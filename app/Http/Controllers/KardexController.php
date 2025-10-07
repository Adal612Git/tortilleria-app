<?php

namespace App\Http\Controllers;

use App\Models\Kardex;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

class KardexController extends Controller
{
    public function index()
    {
        $entries = Kardex::with(['product', 'user'])
            ->orderByDesc('created_at')
            ->paginate(50);

        $products = Product::orderBy('name')->get();
        $roleName = optional(Auth::user()->role)->name;
        $canManage = in_array($roleName, ['Dueño', 'Admin'], true);

        return view('kardex.index', compact('entries', 'products', 'canManage'));
    }
}
