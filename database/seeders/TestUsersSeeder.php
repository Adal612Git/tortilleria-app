<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        $roles = DB::table('roles')->pluck('id','name');

        if (isset($roles['Despachador'])) {
            DB::table('users')->updateOrInsert(
                ['email' => 'despacho@local.test'],
                [
                    'name' => 'Despachador',
                    'email' => 'despacho@local.test',
                    'password' => Hash::make('123456'),
                    'role_id' => $roles['Despachador'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        if (isset($roles['Motociclista'])) {
            DB::table('users')->updateOrInsert(
                ['email' => 'motociclista@local.test'],
                [
                    'name' => 'Motociclista',
                    'email' => 'motociclista@local.test',
                    'password' => Hash::make('123456'),
                    'role_id' => $roles['Motociclista'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
