<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LoginController;

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
