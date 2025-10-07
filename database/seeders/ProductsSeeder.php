<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductsSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['name' => 'Tortillas', 'price' => 18.00],
            ['name' => 'Arroz', 'price' => 18.00],
            ['name' => 'Salsa', 'price' => 22.00],
            ['name' => 'Frijoles', 'price' => 24.00],
            ['name' => 'Manteca', 'price' => 30.00],
            ['name' => 'Masa', 'price' => 20.00],
            ['name' => 'Maiz', 'price' => 15.00],
            ['name' => 'Totopos', 'price' => 25.00],
        ];

        foreach ($products as $p) {
            DB::table('products')->updateOrInsert(
                ['name' => $p['name']],
                [
                    'name' => $p['name'],
                    'price' => $p['price'],
                    'stock' => 0,
                    'hidden' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
