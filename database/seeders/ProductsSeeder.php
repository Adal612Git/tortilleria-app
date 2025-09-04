<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductsSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['name' => 'Masa', 'price' => 20, 'stock' => 100],
            ['name' => 'Tortillas', 'price' => 18, 'stock' => 200],
            ['name' => 'Totopos', 'price' => 25, 'stock' => 50],
        ];

        foreach ($products as $p) {
            DB::table('products')->updateOrInsert(
                ['name' => $p['name']],
                [
                    'name' => $p['name'],
                    'price' => $p['price'],
                    'stock' => $p['stock'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}

