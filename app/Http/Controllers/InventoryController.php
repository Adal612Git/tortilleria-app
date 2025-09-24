<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Kardex;
use App\Models\Product;
use App\Http\Requests\InventoryMovementRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
    public function index()
    {
        $inventories = Inventory::with('product')
            ->whereHas('product', fn($q) => $q->where('hidden', false))
            ->orderBy(Product::select('name')->whereColumn('products.id', 'inventories.product_id'))
            ->get();
        $user = Auth::user();
        $roleName = optional($user->role)->name;
        $canManage = in_array($roleName, ['Dueño', 'Admin'], true);

        return view('inventory.index', compact('inventories', 'canManage'));
    }

    public function addEntry(InventoryMovementRequest $request)
    {
        $data = $request->validated();
        $request->validate(['product_id' => ['required', 'exists:products,id']]);

        DB::transaction(function () use ($data) {
            $inventory = Inventory::firstOrCreate(
                ['product_id' => $data['product_id']],
                ['quantity' => 0, 'min_stock' => 0]
            );

            $inventory->quantity += $data['quantity'];
            $inventory->save();

            $k = Kardex::create([
                'product_id' => $data['product_id'],
                'type' => 'entrada',
                'quantity' => $data['quantity'],
                'description' => $data['description'] ?? null,
                'created_by' => Auth::id(),
            ]);
            DB::table('audits')->insert([
                'user_id' => Auth::id(),
                'action' => 'inventario_entrada',
                'entity_type' => 'Kardex',
                'entity_id' => $k->id,
                'description' => 'Entrada de inventario producto '.$data['product_id'].' cantidad '.$data['quantity'],
                'created_at' => now(),
            ]);
        });

        return back()->with('status', 'Entrada registrada');
    }

    public function addExit(InventoryMovementRequest $request)
    {
        $data = $request->validated();
        $request->validate(['product_id' => ['required', 'exists:products,id']]);

        DB::transaction(function () use ($data) {
            $inventory = Inventory::firstOrCreate(
                ['product_id' => $data['product_id']],
                ['quantity' => 0, 'min_stock' => 0]
            );

            if ($inventory->quantity < $data['quantity']) {
                throw ValidationException::withMessages([
                    'quantity' => 'Stock insuficiente para realizar la salida.',
                ]);
            }

            $inventory->quantity -= $data['quantity'];
            $inventory->save();

            $k = Kardex::create([
                'product_id' => $data['product_id'],
                'type' => 'salida',
                'quantity' => $data['quantity'],
                'description' => $data['description'] ?? null,
                'created_by' => Auth::id(),
            ]);
            DB::table('audits')->insert([
                'user_id' => Auth::id(),
                'action' => 'inventario_salida',
                'entity_type' => 'Kardex',
                'entity_id' => $k->id,
                'description' => 'Salida de inventario producto '.$data['product_id'].' cantidad '.$data['quantity'],
                'created_at' => now(),
            ]);
        });

        return back()->with('status', 'Salida registrada');
    }

    public function convertMasaToTotopos(InventoryMovementRequest $request)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            $masa = Product::where('name', 'Masa')->firstOrFail();
            $totopos = Product::where('name', 'Totopos')->firstOrFail();

            $masaInv = Inventory::firstOrCreate(['product_id' => $masa->id], ['quantity' => 0, 'min_stock' => 0]);
            $totoposInv = Inventory::firstOrCreate(['product_id' => $totopos->id], ['quantity' => 0, 'min_stock' => 0]);

            if ($masaInv->quantity < $data['quantity']) {
                throw ValidationException::withMessages([
                    'quantity' => 'Stock de Masa insuficiente para convertir.',
                ]);
            }

            // Salida de Masa
            $masaInv->quantity -= $data['quantity'];
            $masaInv->save();
            $k1 = Kardex::create([
                'product_id' => $masa->id,
                'type' => 'conversion',
                'quantity' => $data['quantity'],
                'description' => $data['description'] ?? 'Conversión Masa -> Totopos',
                'created_by' => Auth::id(),
            ]);

            // Entrada de Totopos
            $totoposInv->quantity += $data['quantity'];
            $totoposInv->save();
            $k2 = Kardex::create([
                'product_id' => $totopos->id,
                'type' => 'conversion',
                'quantity' => $data['quantity'],
                'description' => $data['description'] ?? 'Conversión Masa -> Totopos',
                'created_by' => Auth::id(),
            ]);
            DB::table('audits')->insert([
                'user_id' => Auth::id(),
                'action' => 'inventario_conversion',
                'entity_type' => 'Kardex',
                'entity_id' => $k2->id,
                'description' => 'Conversión Masa->Totopos cantidad '.$data['quantity'],
                'created_at' => now(),
            ]);
        });

        return back()->with('status', 'Conversión realizada');
    }

    public function updateMinStock(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'min_stock' => ['required', 'integer', 'min:0'],
        ]);

        $inventory = Inventory::firstOrCreate(
            ['product_id' => $data['product_id']],
            ['quantity' => 0, 'min_stock' => 0]
        );

        $inventory->min_stock = $data['min_stock'];
        $inventory->save();

        return back()->with('status', 'Stock mínimo actualizado');
    }
}
