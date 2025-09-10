<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Product;
use App\Models\User;
use App\Models\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccountingController extends Controller
{
    public function index(Request $request)
    {
        $now = now();
        $from = $now->copy()->subDays(29)->startOfDay();

        // Ventas por producto (últimos 30 días)
        $ventasProducto = Venta::select('product_id', DB::raw('SUM(quantity) as qty'), DB::raw('SUM(total) as total'))
            ->where('created_at', '>=', $from)
            ->with('product')
            ->groupBy('product_id')
            ->orderByDesc(DB::raw('SUM(total)'))
            ->get();

        $bruto = (float) $ventasProducto->sum('total');

        // Costo de ventas: qty * product.cost (si existe)
        $costMap = Product::pluck('cost', 'id');
        $costoVentas = 0.0;
        foreach ($ventasProducto as $v) {
            $unitCost = (float) ($costMap[$v->product_id] ?? 0);
            $costoVentas += $unitCost * (float) $v->qty;
        }

        // Salarios del periodo (30 días). Suponemos salario mensual y computamos valor mensual.
        $salarios = (float) User::whereNotNull('salary')->sum('salary');

        $neto = $bruto - $costoVentas - $salarios;

        // Inversión actual en inventario: sum(quantity * product.cost)
        $inventario = Inventory::with('product')->get();
        $inversion = 0.0;
        foreach ($inventario as $inv) {
            $inversion += (float) ($inv->quantity) * (float) ($inv->product->cost ?? 0);
        }

        return view('contabilidad.index', [
            'from' => $from->toDateString(),
            'to' => $now->toDateString(),
            'ventasProducto' => $ventasProducto,
            'bruto' => $bruto,
            'costoVentas' => $costoVentas,
            'salarios' => $salarios,
            'neto' => $neto,
            'inversion' => $inversion,
        ]);
    }
}

