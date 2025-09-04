<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\KardexController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\EntregaController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return view('auth.login');
})->name('login');

Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->middleware('auth');

Route::view('/dashboard/dueno', 'dashboard.dueno');
Route::view('/dashboard/admin', 'dashboard.admin');
Route::view('/dashboard/despacho', 'dashboard.despacho');
Route::view('/dashboard/moto', 'dashboard.moto');

// Inventario y Kardex
Route::middleware('auth')->group(function () {
    // Inventario: listado accesible a todos los roles (UI controla acciones)
    Route::get('/inventario', [InventoryController::class, 'index']);

    // Acciones restringidas a Dueño y Admin
    Route::middleware('role:Dueño,Admin')->group(function () {
        Route::post('/inventario/entrada', [InventoryController::class, 'addEntry']);
        Route::post('/inventario/salida', [InventoryController::class, 'addExit']);
        Route::post('/inventario/conversion', [InventoryController::class, 'convertMasaToTotopos']);
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

// Caja (Dueño/Admin)
Route::middleware(['auth', 'role:Dueño,Admin'])->group(function () {
    Route::get('/caja', [CajaController::class, 'index']);
    Route::post('/caja/abrir', [CajaController::class, 'open']);
    Route::post('/caja/cerrar', [CajaController::class, 'close']);
    Route::get('/caja/reporte/{id}', [CajaController::class, 'report']);
    Route::get('/dashboard/pedidos', [PedidoController::class, 'index']);
});

// Pedidos (Despachador)
Route::middleware(['auth', 'role:Despachador'])->group(function () {
    Route::get('/pedidos', [PedidoController::class, 'index']);
    Route::post('/pedidos', [PedidoController::class, 'store']);
});

// Entregas (Motociclista)
Route::middleware(['auth', 'role:Motociclista'])->group(function () {
    Route::get('/entregas', [EntregaController::class, 'index']);
    Route::post('/entregas/tomar/{pedido}', [EntregaController::class, 'take']);
    Route::get('/entregas/{id}', [EntregaController::class, 'show']);
    Route::post('/entregas/{id}/status', [EntregaController::class, 'updateStatus']);
    Route::get('/entregas/historial', [EntregaController::class, 'history']);
});
