<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('products', 'hidden')) {
            Schema::table('products', function (Blueprint $table) {
                $table->boolean('hidden')->default(false)->after('stock');
            });
        }

        // Seed hidden products if not present
        $hiddenItems = [
            ['name' => 'Salsa', 'price' => 20.00],
            ['name' => 'Chicharrón', 'price' => 50.00],
            ['name' => 'Frijoles', 'price' => 35.00],
            ['name' => 'Arroz', 'price' => 25.00],
        ];
        foreach ($hiddenItems as $item) {
            $exists = DB::table('products')->where('name', $item['name'])->exists();
            if (!$exists) {
                DB::table('products')->insert([
                    'name' => $item['name'],
                    'price' => $item['price'],
                    'stock' => 0,
                    'hidden' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('products')->where('name', $item['name'])->update(['hidden' => true]);
            }
        }
    }

    public function down(): void
    {
        // Do not delete products. Only drop column if exists.
        if (Schema::hasColumn('products', 'hidden')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('hidden');
            });
        }
    }
};

