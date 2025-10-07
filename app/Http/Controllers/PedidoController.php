<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Http\Requests\StorePedidoRequest;
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

        // Para despachador: pasar lista de productos visibles para sumar con botones
        $products = \App\Models\Product::where('hidden', false)->orderBy('name')->get(['id','name','price']);
        return view('pedidos.index', compact('pedidos', 'status', 'products'));
    }

    public function store(StorePedidoRequest $request)
    {
        $data = $request->validated();

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
