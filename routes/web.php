<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\KardexController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\EntregaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\AccountingController;
use App\Http\Controllers\AdminManagementController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\SupplierController;

// Redirige la ruta raíz al login
Route::redirect('/', '/login');

Route::get('/login', function () {
    if (Auth::check()) {
        return redirect()->intended('/dashboard');
    }

    return view('auth.login');
})->middleware('guest')->name('login');

Route::post('/login', [LoginController::class, 'login'])->middleware(['throttle.logins', 'guest']);
Route::post('/logout', [LoginController::class, 'logout'])->middleware('auth');

// Debug temporal: datos del usuario autenticado (quitar en producción)
Route::middleware('auth')->get('/debug/me', function () {
    $u = Auth::user()->load('role');
    return response()->json([
        'id' => $u->id,
        'email' => $u->email,
        'role_id' => $u->role_id,
        'role_name' => optional($u->role)->name,
    ]);
});

// Debug temporal para validar middleware de rol
Route::middleware(['auth', 'role:Admin,Dueño,Despachador,Caja'])->get('/debug/check', function () {
    return response()->json(['ok' => true]);
});

// Password reset (send email with reset link)
Route::post('/password/email', [PasswordResetController::class, 'sendResetLink'])
    ->name('password.email');

// Dashboards por rol (protegidos)
Route::view('/dashboard/dueno', 'dashboard.dueno')->middleware(['auth', 'role:Dueño']);
Route::middleware(['auth', 'role:Admin,Dueño'])->group(function () {
    Route::get('/dashboard/admin', [AdminManagementController::class, 'index'])->name('admin.dashboard');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
        Route::put('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');

        Route::post('/stores', [StoreController::class, 'store'])->name('stores.store');
        Route::put('/stores/{store}', [StoreController::class, 'update'])->name('stores.update');
        Route::delete('/stores/{store}', [StoreController::class, 'destroy'])->name('stores.destroy');

        Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
        Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
        Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');
    });
});
Route::view('/dashboard/despacho', 'dashboard.despacho')->middleware(['auth', 'role:Despachador']);
Route::view('/dashboard/moto', 'dashboard.moto')->middleware(['auth', 'role:Motociclista']);

// Inventario y Kardex
Route::middleware('auth')->group(function () {
    // Inventario: Dueño y Admin pueden ver/gestionar
    Route::middleware('role:Admin,Dueño')->group(function () {
        Route::get('/inventario', [InventoryController::class, 'index']);
        Route::post('/inventario/entrada', [InventoryController::class, 'addEntry']);
        Route::post('/inventario/salida', [InventoryController::class, 'addExit']);
        Route::post('/inventario/min-stock', [InventoryController::class, 'updateMinStock']);
        Route::delete('/inventario/products/{product}', [InventoryController::class, 'destroyProduct'])->name('inventario.products.destroy');
        Route::post('/inventario/products/{product}/price', [InventoryController::class, 'updatePrice'])->name('inventario.products.update-price');
    });

    // Kardex visible para todos los roles
    Route::get('/kardex', [KardexController::class, 'index']);
});

// POS (Despachador/Motociclista)
Route::middleware(['auth', 'role:Despachador,Motociclista,Admin,Dueño'])->group(function () {
    Route::get('/pos', [VentaController::class, 'pos']);
    Route::post('/ventas', [VentaController::class, 'store']);
    Route::post('/ventas/batch', [VentaController::class, 'storeBatch'])->name('ventas.batch');
    Route::get('/apos', [VentaController::class, 'apos'])->name('pos.admin');
});

// Dashboard principal para Admin y Dueño
Route::middleware(['auth', 'role:Admin,Dueño'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});

// Caja (Dueño/Admin)
Route::middleware(['auth', 'role:Dueño,Admin'])->group(function () {
    Route::get('/reportes/ventas/pdf', [DashboardController::class, 'exportVentasPDF']);
    Route::get('/reportes/ventas/csv', [DashboardController::class, 'exportVentasCSV']);
    Route::get('/reportes/inventario/pdf', [DashboardController::class, 'exportInventarioPDF']);
    Route::get('/reportes/inventario/csv', [DashboardController::class, 'exportInventarioCSV']);
    Route::get('/historial', [AuditController::class, 'index']);
    Route::get('/caja', [CajaController::class, 'index']);
    Route::post('/caja/abrir', [CajaController::class, 'open']);
    Route::post('/caja/cerrar', [CajaController::class, 'close']);
    Route::get('/caja/reporte/{id}', [CajaController::class, 'report']);
    Route::get('/dashboard/pedidos', [PedidoController::class, 'index']);
    Route::get('/contabilidad', [AccountingController::class, 'index']);
});

// Pedidos (Despachador)
Route::middleware(['auth', 'role:Despachador'])->group(function () {
    Route::get('/pedidos', [PedidoController::class, 'index']);
    Route::post('/pedidos', [PedidoController::class, 'store']);
});

// Entregas (Motociclista)
Route::middleware(['auth', 'role:Motociclista'])->group(function () {
    Route::get('/entregas', [EntregaController::class, 'index']);
    // Colocar historial antes de la ruta con {id} para evitar colisión
    Route::get('/entregas/historial', [EntregaController::class, 'history']);
    Route::get('/entregas/{id}', [EntregaController::class, 'show'])->whereNumber('id');
    Route::post('/entregas/{id}/status', [EntregaController::class, 'updateStatus'])->whereNumber('id');
});

// Asignación de entregas (solo Admin y Despachador)
Route::middleware(['auth', 'role:Admin,Despachador'])->group(function () {
    Route::post('/entregas/asignar/{pedido}', [EntregaController::class, 'assign']);
});

// Reportes específicos
Route::middleware(['auth', 'role:Despachador'])->get('/reportes/despachador', [ReporteController::class, 'despachadorResumen']);
Route::middleware(['auth', 'role:Motociclista'])->get('/reportes/motociclista', [ReporteController::class, 'motociclistaHistorial']);
