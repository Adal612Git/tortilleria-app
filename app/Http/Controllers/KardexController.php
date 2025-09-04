<?php

namespace App\Http\Controllers;

use App\Models\Kardex;

class KardexController extends Controller
{
    public function index()
    {
        $entries = Kardex::with(['product', 'user'])
            ->orderByDesc('created_at')
            ->paginate(50);

        return view('kardex.index', compact('entries'));
    }
}

