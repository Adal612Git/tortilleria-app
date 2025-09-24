<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolesSeeder::class,
            UsersSeeder::class,
            ProductsSeeder::class,
            // Usuarios de prueba (Despachador y Motociclista)
            TestUsersSeeder::class,
            // Inventario base y caja abierta
            InventorySeeder::class,
            CajaSeeder::class,
            // Datos de demostración: ventas históricas, kardex y salarios
            DemoDataSeeder::class,
        ]);
    }
}
