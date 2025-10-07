<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['Dueño', 'Admin', 'Despachador', 'Motociclista'];

        foreach ($roles as $name) {
            DB::table('roles')->updateOrInsert(['name' => $name], ['name' => $name, 'created_at' => now(), 'updated_at' => now()]);
        }
    }
}

