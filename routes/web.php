<?php

use Illuminate\Support\Facades\Route;
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

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return view('auth.login');
})->name('login');

Route::post('/login', [LoginController::class, 'login'])->middleware('throttle.logins');
Route::post('/logout', [LoginController::class, 'logout'])->middleware('auth');

// Password reset (send email with reset link)
Route::post('/password/email', [PasswordResetController::class, 'sendResetLink'])
    ->name('password.email');

Route::view('/dashboard/dueno', 'dashboard.dueno');
Route::view('/dashboard/admin', 'dashboard.admin');
Route::view('/dashboard/despacho', 'dashboard.despacho');
Route::view('/dashboard/moto', 'dashboard.moto');

// Inventario y Kardex
Route::middleware('auth')->group(function () {
    // Inventario: sólo Admin puede ver/gestionar
    Route::middleware('role:Admin')->group(function () {
        Route::get('/inventario', [InventoryController::class, 'index']);
        Route::post('/inventario/entrada', [InventoryController::class, 'addEntry']);
        Route::post('/inventario/salida', [InventoryController::class, 'addExit']);
        Route::post('/inventario/min-stock', [InventoryController::class, 'updateMinStock']);
    });

    // Kardex visible para todos los roles
    Route::get('/kardex', [KardexController::class, 'index']);
});

// POS (Despachador/Motociclista)
Route::middleware(['auth', 'role:Despachador,Motociclista'])->group(function () {
    Route::get('/pos', [VentaController::class, 'pos']);
    Route::post('/ventas', [VentaController::class, 'store']);
});

// Dashboard accesible para Admin/Dueño/Despachador (y Caja si existe)
Route::middleware(['auth', 'role:Admin,Dueño,Despachador,Caja'])->group(function () {
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
