<?php

namespace App\Http\Controllers;

use App\Models\Entrega;
use App\Models\Pedido;
use App\Models\User;
use App\Http\Requests\StoreEntregaRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EntregaController extends Controller
{
    public function index()
    {
        $pendientes = Pedido::where('status', 'pendiente')->latest()->paginate(50);
        return view('entregas.index', compact('pendientes'));
    }

    public function take($pedidoId)
    {
        abort(403, 'La asignación de viajes debe realizarse por Admin o Despachador.');
    }

    public function show($id)
    {
        $entrega = Entrega::with('pedido')->findOrFail($id);
        if ($entrega->motociclista_id !== Auth::id()) {
            abort(403);
        }
        return view('entregas.show', compact('entrega'));
    }

    // Asignar pedido a un motociclista (Admin/Despachador)
    public function assign(Request $request, $pedidoId)
    {
        $pedido = Pedido::findOrFail($pedidoId);
        if ($pedido->status !== 'pendiente') {
            return back()->withErrors('El pedido ya no está disponible.');
        }

        // Validar que el asignado sea un usuario con rol Motociclista
        $data = $request->validate([
            'motociclista_id' => ['required', 'integer', 'exists:users,id'],
        ]);
        $mot = User::with('role')->findOrFail($data['motociclista_id']);
        if (optional($mot->role)->name !== 'Motociclista') {
            return back()->withErrors('El usuario seleccionado no es Motociclista.');
        }

        try {
            DB::transaction(function () use ($pedido, $mot) {
                if ($pedido->entrega()->exists()) {
                    abort(422, 'El pedido ya fue asignado.');
                }
                $pedido->status = 'en_progreso';
                $pedido->save();

                Entrega::create([
                    'pedido_id' => $pedido->id,
                    'motociclista_id' => $mot->id,
                    'status' => 'en_progreso',
                ]);
            });
        } catch (\Throwable $e) {
            return back()->withErrors('No se pudo asignar: '.$e->getMessage());
        }

        return back()->with('status', 'Pedido asignado a '.$mot->name);
    }

    public function updateStatus(StoreEntregaRequest $request, $id)
    {
        $data = $request->validated();

        $entrega = Entrega::with('pedido')->findOrFail($id);
        if ($entrega->motociclista_id !== Auth::id()) {
            abort(403);
        }

        if ($data['status'] === 'no_entregado' && empty($data['observacion'])) {
            return back()->withErrors('Observación es requerida cuando no se entrega.');
        }

        DB::transaction(function () use ($entrega, $data) {
            $entrega->status = $data['status'];
            $entrega->observacion = $data['observacion'] ?? null;
            $entrega->entregado_at = now();
            $entrega->save();

            $entrega->pedido->status = $data['status'];
            $entrega->pedido->save();

            DB::table('audits')->insert([
                'user_id' => Auth::id(),
                'action' => 'entrega_estado',
                'entity_type' => 'Entrega',
                'entity_id' => $entrega->id,
                'description' => 'Cambio de estado a '.$data['status'],
                'created_at' => now(),
            ]);
        });

        return redirect()->to('/entregas/historial')->with('status', 'Entrega actualizada');
    }

    public function history(Request $request)
    {
        $range = $request->query('range', 'semana');
        $query = Entrega::with('pedido')->where('motociclista_id', Auth::id());

        if ($range === 'mes') {
            $query->where('created_at', '>=', now()->subMonth());
        } else {
            $query->where('created_at', '>=', now()->subWeek());
        }

        $entregas = $query->orderByDesc('created_at')->paginate(50);
        return view('entregas.historial', compact('entregas', 'range'));
    }
}
