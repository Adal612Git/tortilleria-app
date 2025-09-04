<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\KardexController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return view('auth.login');
})->name('login');

Route::post('/login', [LoginController::class, 'login']);

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
