<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Venta;
use App\Models\Pedido;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CajaController extends Controller
{
    public function index()
    {
        $caja = Caja::where('status', 'abierta')->latest('opened_at')->first();
        $ventasCaja = collect();
        if ($caja) {
            $ventasCaja = Venta::with(['product', 'user'])
                ->where('caja_id', $caja->id)
                ->orderByDesc('created_at')
                ->get();
        }

        $ventasDia = Venta::with(['product', 'user'])
            ->whereDate('created_at', now()->toDateString())
            ->orderByDesc('created_at')
            ->get();

        $pendientes = Pedido::where('status', 'pendiente')->latest()->limit(100)->get();
        $motociclistas = User::with('role')->whereHas('role', fn($q) => $q->where('name', 'Motociclista'))->orderBy('name')->get();
        $roleName = optional(auth()->user()->role)->name;
        $canAssign = in_array($roleName, ['Admin', 'Despachador'], true);

        return view('caja.index', [
            'caja' => $caja,
            'ventas' => $ventasCaja,
            'ventasDia' => $ventasDia,
            'pendientes' => $pendientes,
            'motociclistas' => $motociclistas,
            'canAssign' => $canAssign,
        ]);
    }

    public function open(Request $request)
    {
        if (Caja::where('status', 'abierta')->exists()) {
            return back()->withErrors('Ya existe una caja abierta.');
        }

        $data = $request->validate([
            'opening_fund' => ['nullable', 'numeric', 'min:0'],
        ]);

        Caja::create([
            'opened_by' => Auth::id(),
            'opened_at' => now(),
            'opening_fund' => $data['opening_fund'] ?? 0,
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

            DB::table('audits')->insert([
                'user_id' => Auth::id(),
                'action' => 'caja_cierre',
                'entity_type' => 'Caja',
                'entity_id' => $caja->id,
                'description' => 'Cierre de caja con total '.$total,
                'created_at' => now(),
            ]);
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
