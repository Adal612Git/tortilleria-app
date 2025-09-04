@extends('layouts.app')

@section('title', 'Resumen Despachador')

@section('content')
<div class="max-w-5xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-semibold mb-4">Resumen de ventas del turno</h1>
    @if ($mensaje)
        <div class="mb-4 p-3 rounded bg-yellow-50 text-yellow-700 text-sm">{{ $mensaje }}</div>
    @else
        <div class="mb-4 text-sm text-gray-600">Desde {{ $desde->format('Y-m-d H:i') }} hasta {{ $hasta->format('Y-m-d H:i') }}</div>
        <div class="bg-white border rounded p-4 mb-4">
            <div class="text-gray-500">Total</div>
            <div class="text-2xl font-bold">$ {{ number_format($total, 2) }}</div>
        </div>
        <div class="overflow-x-auto bg-white border rounded">
            <table class="min-w-full">
                <thead>
                    <tr class="bg-gray-100 text-left text-sm text-gray-700">
                        <th class="px-4 py-2">Fecha</th>
                        <th class="px-4 py-2">Producto</th>
                        <th class="px-4 py-2">Cantidad</th>
                        <th class="px-4 py-2">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($ventas as $v)
                        <tr class="border-t">
                            <td class="px-4 py-2 text-sm text-gray-600">{{ $v->created_at->format('Y-m-d H:i') }}</td>
                            <td class="px-4 py-2">{{ $v->product->name }}</td>
                            <td class="px-4 py-2">{{ $v->quantity }}</td>
                            <td class="px-4 py-2">$ {{ number_format($v->total, 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @endif
</div>
@endsection

