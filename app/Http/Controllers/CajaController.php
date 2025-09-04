<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Venta;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CajaController extends Controller
{
    public function index()
    {
        $caja = Caja::where('status', 'abierta')->latest('opened_at')->first();
        $ventas = collect();
        if ($caja) {
            $ventas = Venta::with(['product', 'user'])
                ->where('caja_id', $caja->id)
                ->orderByDesc('created_at')
                ->get();
        }

        return view('caja.index', compact('caja', 'ventas'));
    }

    public function open(Request $request)
    {
        if (Caja::where('status', 'abierta')->exists()) {
            return back()->withErrors('Ya existe una caja abierta.');
        }

        Caja::create([
            'opened_by' => Auth::id(),
            'opened_at' => now(),
            'status' => 'abierta',
            'total_in' => 0,
            'total_out' => 0,
        ]);

        return back()->with('status', 'Caja abierta');
    }

    public function close(Request $request)
    {
        $caja = Caja::where('status', 'abierta')->latest('opened_at')->first();
        if (!$caja) {
            return back()->withErrors('No hay caja abierta.');
        }

        DB::transaction(function () use ($caja) {
            $ventas = Venta::where('caja_id', $caja->id)->get();
            $total = $ventas->sum('total');

            $caja->total_in = $total;
            $caja->status = 'cerrada';
            $caja->closed_by = Auth::id();
            $caja->closed_at = now();
            $caja->save();
        });

        // Generar y descargar PDF de reporte sin cambiar de vista
        $ventas = Venta::with(['product', 'user'])
            ->where('caja_id', $caja->id)
            ->orderBy('created_at')
            ->get();
        $pdf = Pdf::loadView('caja.reporte', [
            'caja' => $caja->fresh(['openedBy', 'closedBy']),
            'ventas' => $ventas,
            'subtotal' => $ventas->sum('total'),
        ]);

        return $pdf->download('reporte-caja-'.$caja->id.'.pdf');
    }

    public function report($id)
    {
        $caja = Caja::with(['openedBy', 'closedBy'])->findOrFail($id);
        $ventas = Venta::with(['product', 'user'])
            ->where('caja_id', $caja->id)
            ->orderBy('created_at')
            ->get();

        $pdf = Pdf::loadView('caja.reporte', [
            'caja' => $caja,
            'ventas' => $ventas,
            'subtotal' => $ventas->sum('total'),
        ]);

        return $pdf->download('reporte-caja-'.$caja->id.'.pdf');
    }
}
