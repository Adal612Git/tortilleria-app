<?php

namespace App\Http\Controllers;

use App\Models\Entrega;
use App\Models\Pedido;
use App\Http\Requests\StoreEntregaRequest;
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
        $pedido = Pedido::findOrFail($pedidoId);
        if ($pedido->status !== 'pendiente') {
            return back()->withErrors('El pedido ya no está disponible.');
        }

        try {
            DB::transaction(function () use ($pedido) {
                // Verificar que no exista entrega previa
                if ($pedido->entrega()->exists()) {
                    abort(422, 'El pedido ya fue tomado.');
                }

                $pedido->status = 'en_progreso';
                $pedido->save();

                Entrega::create([
                    'pedido_id' => $pedido->id,
                    'motociclista_id' => Auth::id(),
                    'status' => 'en_progreso',
                ]);
            });
        } catch (\Throwable $e) {
            return back()->withErrors('No se pudo tomar el pedido: '.$e->getMessage());
        }

        $entrega = $pedido->entrega;
        return redirect()->to('/entregas/'.$entrega->id)->with('status', 'Pedido asignado');
    }

    public function show($id)
    {
        $entrega = Entrega::with('pedido')->findOrFail($id);
        if ($entrega->motociclista_id !== Auth::id()) {
            abort(403);
        }
        return view('entregas.show', compact('entrega'));
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
