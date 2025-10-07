<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Evitar duplicar datos si ya existen ventas históricas
        if (DB::table('ventas')->where('created_at', '<', now()->subDay())->exists()) {
            return; // ya poblado
        }

        // 1) Asegurar costos, precios y salarios base
        $costByName = [
            'Masa' => 10.00,
            'Tortillas' => 8.00,
            'Totopos' => 12.00,
        ];
        $priceByName = [
            'Masa' => 20.00,
            'Tortillas' => 18.00,
            'Totopos' => 25.00,
        ];

        $products = DB::table('products')->get(['id', 'name']);
        $prodMap = [];
        foreach ($products as $p) {
            $prodMap[$p->name] = $p->id;
            DB::table('products')->where('id', $p->id)->update([
                'cost' => $costByName[$p->name] ?? 0,
                'price' => $priceByName[$p->name] ?? DB::raw('price'),
                'updated_at' => now(),
            ]);
        }

        // 2) Asegurar inventarios razonables actuales y stock mínimo
        $inventorySeed = [
            'Masa' => ['quantity' => 150, 'min_stock' => 50],
            'Tortillas' => ['quantity' => 300, 'min_stock' => 100],
            'Totopos' => ['quantity' => 120, 'min_stock' => 40],
        ];
        foreach ($inventorySeed as $name => $vals) {
            if (!isset($prodMap[$name])) continue;
            DB::table('inventories')->updateOrInsert(
                ['product_id' => $prodMap[$name]],
                [
                    'quantity' => $vals['quantity'],
                    'min_stock' => $vals['min_stock'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // 3) Salarios de ejemplo (mensual)
        //    Dueño sin salario (0) para mostrar mejor margen; Despachador y Motociclista con salario.
        $roleIds = DB::table('roles')->pluck('id', 'name');
        $users = DB::table('users')->get(['id','name','email']);
        foreach ($users as $u) {
            $salary = null;
            if (str_contains(mb_strtolower($u->name), 'despachador')) {
                $salary = 8000.00;
            } elseif (str_contains(mb_strtolower($u->name), 'motociclista')) {
                $salary = 7000.00;
            } elseif (str_contains(mb_strtolower($u->name), 'dueñ') || str_contains(mb_strtolower($u->name), 'dueno') || str_contains(mb_strtolower($u->name), "dueno")) {
                $salary = 0.00;
            }
            if ($salary !== null) {
                DB::table('users')->where('id', $u->id)->update(['salary' => $salary, 'updated_at' => now()]);
            }
        }

        // 4) Cajas históricas + ventas diarias (últimos ~60 días)
        //    Para cada día cerramos una caja con ventas repartidas durante el día.
        $despachadorId = DB::table('users')->where('email', 'despacho@local.test')->value('id')
            ?: DB::table('users')->where('name', 'like', '%Despachador%')->value('id');
        $duenoId = DB::table('users')->where('email', 'dueno@local.test')->value('id')
            ?: DB::table('users')->where('name', 'like', '%Dueño%')->orWhere('name', 'like', '%Dueno%')->value('id');

        if (!$despachadorId || !$duenoId) {
            // Si faltan usuarios clave, no intentamos poblar ventas
            return;
        }

        $start = Carbon::now()->copy()->subDays(60)->startOfDay();
        $end = Carbon::now()->copy()->subDay()->endOfDay();

        $productIds = [
            'Tortillas' => $prodMap['Tortillas'] ?? null,
            'Masa' => $prodMap['Masa'] ?? null,
            'Totopos' => $prodMap['Totopos'] ?? null,
        ];
        $prices = [
            'Tortillas' => $priceByName['Tortillas'],
            'Masa' => $priceByName['Masa'],
            'Totopos' => $priceByName['Totopos'],
        ];

        $cursor = $start->copy();
        while ($cursor->lessThanOrEqualTo($end)) {
            $openedAt = $cursor->copy()->setTime(8, 0);
            $closedAt = $cursor->copy()->setTime(20, 0);

            // Crear caja cerrada de ese día
            $cajaId = DB::table('cajas')->insertGetId([
                'opened_by' => $duenoId,
                'opened_at' => $openedAt,
                'opening_fund' => 500.00,
                'closed_by' => $duenoId,
                'closed_at' => $closedAt,
                'total_in' => 0, // se actualizará después de insertar ventas
                'total_out' => 0,
                'status' => 'cerrada',
                'created_at' => $openedAt,
                'updated_at' => $closedAt,
            ]);

            // Número de ventas del día: 12-28
            $salesCount = random_int(12, 28);
            $totalDia = 0.0;
            for ($i = 0; $i < $salesCount; $i++) {
                // Distribución: Tortillas 60%, Masa 25%, Totopos 15%
                $r = random_int(1, 100);
                if ($r <= 60) {
                    $key = 'Tortillas';
                    $qty = random_int(1, 5) * 1; // paquetes
                } elseif ($r <= 85) {
                    $key = 'Masa';
                    $qty = random_int(1, 8) * 1; // kg
                } else {
                    $key = 'Totopos';
                    $qty = random_int(1, 4) * 1; // bolsas
                }
                $productId = $productIds[$key] ?? null;
                if (!$productId) continue;

                // Hora aleatoria durante la jornada
                $saleAt = $cursor->copy()->setTime(8, 0)->addMinutes(random_int(0, 12 * 60));
                $total = $prices[$key] * $qty;

                DB::table('ventas')->insert([
                    'product_id' => $productId,
                    'quantity' => $qty,
                    'total' => $total,
                    'user_id' => $despachadorId,
                    'caja_id' => $cajaId,
                    'created_at' => $saleAt,
                    'updated_at' => $saleAt,
                ]);

                // Registrar movimiento en kardex (salida por venta)
                DB::table('kardex')->insert([
                    'product_id' => $productId,
                    'type' => 'salida',
                    'quantity' => $qty,
                    'description' => 'Venta POS',
                    'created_by' => $despachadorId,
                    'created_at' => $saleAt,
                    'updated_at' => $saleAt,
                ]);

                $totalDia += $total;
            }

            // Actualizar total de la caja
            DB::table('cajas')->where('id', $cajaId)->update([
                'total_in' => $totalDia,
                'updated_at' => $closedAt,
            ]);

            $cursor->addDay();
        }

        // 5) Movimientos de inventario de entrada periódicos (reabasto semanal)
        //    Semanalmente agregamos entradas para reflejar compra/producción.
        $weekCursor = $start->copy();
        while ($weekCursor->lessThanOrEqualTo($end)) {
            foreach (['Masa' => 200, 'Tortillas' => 400, 'Totopos' => 150] as $name => $qty) {
                if (!isset($prodMap[$name])) continue;
                $dt = $weekCursor->copy()->setTime(7, 30);
                DB::table('kardex')->insert([
                    'product_id' => $prodMap[$name],
                    'type' => 'entrada',
                    'quantity' => $qty,
                    'description' => 'Reabasto semanal',
                    'created_by' => $duenoId,
                    'created_at' => $dt,
                    'updated_at' => $dt,
                ]);
            }
            $weekCursor->addDays(7);
        }
    }
}

