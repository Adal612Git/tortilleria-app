@extends('layouts.app')

@section('title', 'Pedidos')

@section('content')
<div class="max-w-5xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-semibold mb-4">Pedidos (Despachador)</h1>

    @if (session('status'))
        <div class="mb-4 p-3 rounded bg-green-50 text-green-700 text-sm">{{ session('status') }}</div>
    @endif
    @if ($errors->any())
        <div class="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{{ $errors->first() }}</div>
    @endif

    <div class="bg-white border rounded p-4 mb-6">
        <h2 class="font-medium mb-3">Crear pedido</h2>
        <form method="POST" action="{{ url('/pedidos') }}" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            @csrf
            <div>
                <label class="block text-sm text-gray-600">Cliente</label>
                <input name="cliente" required class="border rounded w-full px-2 py-1" />
            </div>
            <div>
                <label class="block text-sm text-gray-600">Teléfono</label>
                <input name="telefono" class="border rounded w-full px-2 py-1" />
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm text-gray-600">Dirección</label>
                <input name="direccion" required class="border rounded w-full px-2 py-1" />
            </div>
            <div>
                <label class="block text-sm text-gray-600">Total</label>
                <input name="total" type="number" min="0" step="0.01" required class="border rounded w-full px-2 py-1" />
            </div>
            <div class="md:col-span-2">
                <button class="bg-blue-600 text-white px-4 py-2 rounded">Crear</button>
            </div>
        </form>
    </div>

    <div class="flex items-center gap-3 mb-3">
        <span>Filtrar estado:</span>
        @foreach (['pendiente','en_progreso','entregado','no_entregado'] as $st)
            <a href="{{ url('/pedidos?status='.$st) }}" class="text-blue-600 hover:underline">{{ $st }}</a>
        @endforeach
        <a href="{{ url('/pedidos') }}" class="text-gray-600 hover:underline">Todos</a>
    </div>

    <div class="overflow-x-auto bg-white border rounded">
        <table class="min-w-full">
            <thead>
                <tr class="bg-gray-100 text-left text-sm text-gray-700">
                    <th class="px-4 py-2">Fecha</th>
                    <th class="px-4 py-2">Cliente</th>
                    <th class="px-4 py-2">Dirección</th>
                    <th class="px-4 py-2">Total</th>
                    <th class="px-4 py-2">Estado</th>
                    <th class="px-4 py-2">Motociclista</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($pedidos as $p)
                    <tr class="border-t">
                        <td class="px-4 py-2 text-sm text-gray-600">{{ $p->created_at->format('Y-m-d H:i') }}</td>
                        <td class="px-4 py-2">{{ $p->cliente }}</td>
                        <td class="px-4 py-2">{{ $p->direccion }}</td>
                        <td class="px-4 py-2">$ {{ number_format($p->total, 2) }}</td>
                        <td class="px-4 py-2 capitalize">{{ $p->status }}</td>
                        <td class="px-4 py-2">{{ $p->entrega?->motociclista?->name }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    <div class="mt-3">{{ $pedidos->withQueryString()->links() }}</div>
</div>
@endsection

