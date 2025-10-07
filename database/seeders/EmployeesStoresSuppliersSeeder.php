<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EmployeesStoresSuppliersSeeder extends Seeder
{
    public function run(): void
    {
        $roles = DB::table('roles')->pluck('id', 'name');

        $adminRoleId = $roles['Admin'] ?? null;
        $adminUser = null;

        if ($adminRoleId) {
            $adminUser = User::updateOrCreate(
                ['email' => 'admin@local.test'],
                [
                    'name' => 'Administrador',
                    'password' => '123456',
                    'role_id' => $adminRoleId,
                    'salary' => 15000,
                ]
            );

            Log::info('Seeder ensured admin user exists', [
                'user_id' => $adminUser->id,
                'role_id' => $adminRoleId,
            ]);
        }

        if ($adminUser) {
            Employee::updateOrCreate(
                ['user_id' => $adminUser->id],
                [
                    'full_name' => 'Administrador General',
                    'phone' => '555-0101',
                    'email' => 'admin@local.test',
                    'position' => 'Administrador',
                    'salary' => 15000,
                    'address' => 'Oficina Central 100',
                    'notes' => 'Responsable de la gestión integral del sistema.',
                ]
            );
        }

        Employee::updateOrCreate(
            ['full_name' => 'Carlos Pérez'],
            [
                'phone' => '555-0102',
                'email' => 'carlos.perez@example.com',
                'position' => 'Cajero',
                'salary' => 8000,
                'address' => 'Calle 5 #123, Centro',
                'notes' => 'Encargado de la caja principal.',
            ]
        );

        Store::updateOrCreate(
            ['name' => 'Sucursal Centro'],
            [
                'manager_name' => 'Ana López',
                'phone' => '555-0201',
                'email' => 'centro@tortilleria.test',
                'address' => 'Av. Principal 45, Centro',
                'notes' => 'Abre de 7:00 a 21:00 hrs.',
            ]
        );

        Store::updateOrCreate(
            ['name' => 'Sucursal Norte'],
            [
                'manager_name' => 'Luis Martínez',
                'phone' => '555-0202',
                'email' => 'norte@tortilleria.test',
                'address' => 'Calle Norte 200',
                'notes' => 'Cuenta con reparto a domicilio.',
            ]
        );

        Supplier::updateOrCreate(
            ['name' => 'Harinas del Valle'],
            [
                'contact_name' => 'Julia Rivera',
                'phone' => '555-0301',
                'email' => 'ventas@harinasdelvalle.com',
                'address' => 'Zona Industrial 12',
                'notes' => 'Entrega semanal cada lunes.',
            ]
        );

        Supplier::updateOrCreate(
            ['name' => 'Empaques Express'],
            [
                'contact_name' => 'Miguel Sánchez',
                'phone' => '555-0302',
                'email' => 'contacto@empaquesexpress.com',
                'address' => 'Parque Industrial 33',
                'notes' => 'Descuentos preferenciales por volumen.',
            ]
        );
    }
}
