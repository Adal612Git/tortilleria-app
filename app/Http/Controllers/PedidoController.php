<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PedidoController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $query = Pedido::with(['creador', 'entrega.motociclista'])->latest();
        if ($status) {
            $query->where('status', $status);
        }
        $pedidos = $query->paginate(50);

        $roleName = optional(Auth::user()->role)->name;
        if (in_array($roleName, ['Dueño', 'Admin'], true)) {
            return view('dashboard.pedidos', compact('pedidos', 'status'));
        }

        return view('pedidos.index', compact('pedidos', 'status'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'cliente' => ['required', 'string'],
            'direccion' => ['required', 'string'],
            'telefono' => ['nullable', 'string'],
            'total' => ['required', 'numeric', 'min:0'],
        ]);

        Pedido::create([
            'cliente' => $data['cliente'],
            'direccion' => $data['direccion'],
            'telefono' => $data['telefono'] ?? null,
            'total' => $data['total'],
            'status' => 'pendiente',
            'created_by' => Auth::id(),
        ]);

        return back()->with('status', 'Pedido creado');
    }
}

