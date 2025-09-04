@extends('layouts.app')

@section('title', 'POS')

@section('content')
<div class="max-w-4xl mx-auto py-10 px-4">
    <h1 class="text-3xl font-bold mb-6">Punto de Venta</h1>

    @if (session('status'))
        <div class="alert-success mb-4">{{ session('status') }}</div>
    @endif
    @if ($errors->any())
        <div class="alert-error mb-4">{{ $errors->first() }}</div>
    @endif

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        @foreach ($productos as $p)
            <div class="bg-white border rounded p-4 flex flex-col items-center">
                <div class="text-lg font-semibold">{{ $p->name }}</div>
                <div class="text-gray-600 mb-3">$ {{ number_format($p->price, 2) }}</div>
                <form method="POST" action="{{ url('/ventas') }}" class="w-full">
                    @csrf
                    <input type="hidden" name="product_id" value="{{ $p->id }}">
                    <div class="flex items-center gap-2 mb-3">
                        <input type="number" name="quantity" min="1" value="1" class="border rounded px-2 py-1 w-full" />
                    </div>
                    <button class="w-full btn-app btn-secondary-app">Registrar venta</button>
                </form>
            </div>
        @endforeach
    </div>

    <a href="{{ url('/caja') }}" class="text-blue-600 hover:underline">Ir a Caja</a>
</div>
@endsection
