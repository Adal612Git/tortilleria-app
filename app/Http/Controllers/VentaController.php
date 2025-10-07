<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Inventory;
use App\Models\Kardex;
use App\Models\Product;
use App\Models\Venta;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Requests\StoreVentaRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VentaController extends Controller
{
    public function pos()
    {
        $productos = Product::where('hidden', false)
            ->orderBy('name')
            ->get();

        return view('pos.index', compact('productos'));
    }

    public function apos()
    {
        return view('pos.admin');
    }

    public function store(StoreVentaRequest $request)
    {
        $data = $request->validated();

        $caja = Caja::where('status', 'abierta')->latest('opened_at')->first();
        if (!$caja) {
            abort(403, 'No hay caja abierta.');
        }

        $venta = DB::transaction(function () use ($data, $caja) {
            $inventory = Inventory::firstOrCreate(
                ['product_id' => $data['product_id']],
                ['quantity' => 0, 'min_stock' => 0]
            );

            if ($inventory->quantity < $data['quantity']) {
                throw ValidationException::withMessages([
                    'quantity' => 'Stock insuficiente para la venta.',
                ]);
            }

            $inventory->quantity -= $data['quantity'];
            $inventory->save();

            Kardex::create([
                'product_id' => $data['product_id'],
                'type' => 'salida',
                'quantity' => $data['quantity'],
                'description' => 'Venta POS',
                'created_by' => Auth::id(),
            ]);

            $product = Product::findOrFail($data['product_id']);
            $total = $product->price * $data['quantity'];

            return Venta::create([
                'product_id' => $product->id,
                'quantity' => $data['quantity'],
                'total' => $total,
                'user_id' => Auth::id(),
                'caja_id' => $caja->id,
            ]);
        });

        $ticket = Pdf::loadView('pos.ticket', ['venta' => $venta->load('product', 'user', 'caja')]);
        return $ticket->download('ticket-venta-'.$venta->id.'.pdf');
    }

    public function storeBatch(Request $request)
    {
        $data = $request->validate([
            'items' => ['required', 'array'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        if (empty($data['items'])) {
            return back()->withErrors(['items' => 'No se seleccionaron productos.'])->withInput();
        }

        $caja = Caja::where('status', 'abierta')->latest('opened_at')->first();
        if (!$caja) {
            abort(403, 'No hay caja abierta.');
        }

        DB::transaction(function () use ($data, $caja) {
            foreach ($data['items'] as $item) {
                $productId = $item['product_id'];
                $quantity = $item['quantity'];

                $inventory = Inventory::firstOrCreate(
                    ['product_id' => $productId],
                    ['quantity' => 0, 'min_stock' => 0]
                );

                if ($inventory->quantity < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => 'Stock insuficiente para uno de los productos seleccionados.',
                    ]);
                }

                $inventory->quantity -= $quantity;
                $inventory->save();

                Kardex::create([
                    'product_id' => $productId,
                    'type' => 'salida',
                    'quantity' => $quantity,
                    'description' => 'Venta POS (batch)',
                    'created_by' => Auth::id(),
                ]);

                $product = Product::findOrFail($productId);
                $total = $product->price * $quantity;

                Venta::create([
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'total' => $total,
                    'user_id' => Auth::id(),
                    'caja_id' => $caja->id,
                ]);
            }
        });

        return back()->with('status', 'Venta registrada exitosamente.');
    }
}
