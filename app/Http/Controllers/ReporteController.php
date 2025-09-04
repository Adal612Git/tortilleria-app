<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Entrega;
use App\Models\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReporteController extends Controller
{
    public function despachadorResumen()
    {
        $userId = Auth::id();
        $caja = Caja::where('status', 'abierta')->latest('opened_at')->first();
        if (!$caja) {
            return view('reportes.despachador', [
                'mensaje' => 'No hay caja abierta actualmente.',
                'ventas' => collect(),
                'total' => 0,
                'desde' => null,
                'hasta' => null,
            ]);
        }

        $ventas = Venta::with('product')
            ->where('user_id', $userId)
            ->where('created_at', '>=', $caja->opened_at)
            ->orderByDesc('created_at')
            ->get();
        $total = $ventas->sum('total');

        return view('reportes.despachador', [
            'mensaje' => null,
            'ventas' => $ventas,
            'total' => $total,
            'desde' => $caja->opened_at,
            'hasta' => now(),
        ]);
    }

    public function motociclistaHistorial(Request $request)
    {
        $userId = Auth::id();
        $range = $request->query('range', 'dia');

        $query = Entrega::with('pedido')
            ->where('motociclista_id', $userId);

        if ($range === 'dia') {
            $query->where('created_at', '>=', now()->startOfDay());
        } elseif ($range === 'semana') {
            $query->where('created_at', '>=', now()->subWeek());
        } else { // mes
            $query->where('created_at', '>=', now()->subMonth());
        }

        $entregas = $query->orderByDesc('created_at')->paginate(50);

        return view('reportes.motociclista', compact('entregas', 'range'));
    }
}

