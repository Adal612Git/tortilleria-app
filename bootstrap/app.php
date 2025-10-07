<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([
        \App\Console\Commands\BackupSqlite::class,
        \App\Console\Commands\BackupRestore::class,
    ])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'throttle.logins' => \App\Http\Middleware\ThrottleLogins::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('backup:sqlite')->dailyAt('00:00');
        // Enviar reporte semanal cada lunes a las 08:00
        $schedule->call(function () {
            \App\Jobs\SendWeeklyReport::dispatch();
        })->weeklyOn(1, '08:00');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
