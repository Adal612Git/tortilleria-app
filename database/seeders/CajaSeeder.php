<?php

namespace Database\Seeders;

use App\Models\Caja;
use Illuminate\Database\Seeder;

class CajaSeeder extends Seeder
{
    public function run(): void
    {
        if (!Caja::where('status', 'abierta')->exists()) {
            Caja::create([
                'opened_by' => 1,
                'opened_at' => now(),
                'status' => 'abierta',
                'total_in' => 0,
                'total_out' => 0,
            ]);
        }
    }
}

