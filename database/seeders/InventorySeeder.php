<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $products = DB::table('products')->get(['id']);

        foreach ($products as $product) {
            $exists = DB::table('inventories')->where('product_id', $product->id)->exists();
            if (!$exists) {
                DB::table('inventories')->insert([
                    'product_id' => $product->id,
                    'quantity' => 0,
                    'min_stock' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
