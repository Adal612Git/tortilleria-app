@extends('layouts.app')

@section('title', 'Contabilidad')

@section('content')
<div class="max-w-7xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-semibold">Contabilidad ({{ $from }} a {{ $to }})</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-secondary border rounded p-4">
            <div class="text-gray-500 text-sm">Bruto (30 días)</div>
            <div class="text-2xl font-bold">$ {{ number_format($bruto, 2) }}</div>
        </div>
        <div class="bg-secondary border rounded p-4">
            <div class="text-gray-500 text-sm">Costo de ventas</div>
            <div class="text-2xl font-bold">$ {{ number_format($costoVentas, 2) }}</div>
        </div>
        <div class="bg-secondary border rounded p-4">
            <div class="text-gray-500 text-sm">Salarios (30 días)</div>
            <div class="text-2xl font-bold">$ {{ number_format($salarios, 2) }}</div>
        </div>
        <div class="bg-secondary border rounded p-4">
            <div class="text-gray-500 text-sm">Neto (30 días)</div>
            <div class="text-2xl font-bold">$ {{ number_format($neto, 2) }}</div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-secondary border rounded p-4">
            <h2 class="font-medium mb-3">Acumulado por producto (30 días)</h2>
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead>
                        <tr class="bg-gray-100 text-left text-gray-700">
                            <th class="px-3 py-2">Producto</th>
                            <th class="px-3 py-2 text-right">Cantidad</th>
                            <th class="px-3 py-2 text-right">Ingresos</th>
                            <th class="px-3 py-2 text-right">Costo estimado</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($ventasProducto as $v)
                            @php $cost = (float) ($v->product->cost ?? 0) * (float) $v->qty; @endphp
                            <tr class="border-t">
                                <td class="px-3 py-2">{{ $v->product->name }}</td>
                                <td class="px-3 py-2 text-right">{{ $v->qty }}</td>
                                <td class="px-3 py-2 text-right">$ {{ number_format($v->total, 2) }}</td>
                                <td class="px-3 py-2 text-right">$ {{ number_format($cost, 2) }}</td>
                            </tr>
                        @endforeach
                        @if ($ventasProducto->isEmpty())
                            <tr><td colspan="4" class="px-3 py-3 text-center text-gray-500">Sin datos</td></tr>
                        @endif
                    </tbody>
                </table>
            </div>
        </div>
        <div class="bg-secondary border rounded p-4">
            <h2 class="font-medium mb-3">Inventario actual (inversión)</h2>
            <div class="text-sm text-gray-600 mb-2">Valor inventario por costo unitario</div>
            <div class="text-3xl font-bold mb-3">$ {{ number_format($inversion, 2) }}</div>
            <p class="text-xs text-gray-500">La inversión total se calcula como sumatoria de cantidad actual × costo por producto.</p>
        </div>
    </div>
</div>
@endsection
