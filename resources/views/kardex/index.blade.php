@extends('layouts.app')

@section('title', 'Kardex')

@section('content')
<div class="max-w-6xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold">Kardex</h1>
        <a href="{{ url('/inventario') }}" class="text-blue-600 hover:underline">Volver a Inventario</a>
    </div>

    <div class="overflow-x-auto bg-secondary border rounded">
        <table class="min-w-full">
            <thead>
            <tr class="bg-gray-100 text-left text-sm text-gray-700">
                <th class="px-4 py-2">Fecha</th>
                <th class="px-4 py-2">Producto</th>
                <th class="px-4 py-2">Tipo</th>
                <th class="px-4 py-2">Cantidad</th>
                <th class="px-4 py-2">Usuario</th>
                <th class="px-4 py-2">Descripción</th>
            </tr>
            </thead>
            <tbody>
            @foreach ($entries as $e)
                <tr class="border-t">
                    <td class="px-4 py-2 text-sm text-gray-600">{{ $e->created_at->format('Y-m-d H:i') }}</td>
                    <td class="px-4 py-2">{{ $e->product->name }}</td>
                    <td class="px-4 py-2 capitalize">{{ $e->type }}</td>
                    <td class="px-4 py-2">{{ $e->quantity }}</td>
                    <td class="px-4 py-2">{{ $e->user?->name }}</td>
                    <td class="px-4 py-2 text-sm text-gray-700">{{ $e->description }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>

    <div class="mt-4">
        {{ $entries->links() }}
    </div>

    @if ($canManage)
        <div class="mt-8 bg-white border rounded p-4">
            <h2 class="font-medium mb-4">Actualizar precios de productos</h2>
            <div class="space-y-3">
                @foreach ($products as $product)
                    <form method="POST" action="{{ route('inventario.products.update-price', $product) }}" class="flex flex-col sm:flex-row sm:items-center gap-3">
                        @csrf
                        <div class="sm:w-1/3 text-sm font-semibold">{{ $product->name }}</div>
                        <div class="sm:w-1/3">
                            <input type="number" step="0.01" min="0" name="price" value="{{ number_format($product->price, 2, '.', '') }}" class="border rounded px-3 py-2 w-full">
                        </div>
                        <div class="sm:w-1/3">
                            <button type="submit" class="btn-app btn-secondary-app w-full sm:w-auto">Actualizar</button>
                        </div>
                    </form>
                @endforeach
            </div>
        </div>
    @endif
</div>
@endsection
