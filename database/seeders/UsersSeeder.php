<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        // Asegurar que el rol se obtenga por nombre y no por id fijo
        $roleId = DB::table('roles')->where('name', 'Dueño')->value('id');

        DB::table('users')->updateOrInsert(
            ['email' => 'dueno@local.test'],
            [
                'name' => 'Dueño',
                'email' => 'dueno@local.test',
                'password' => Hash::make('123456'),
                'role_id' => $roleId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
