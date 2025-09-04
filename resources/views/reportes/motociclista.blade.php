@extends('layouts.app')

@section('title', 'Historial Motociclista')

@section('content')
<div class="max-w-5xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-semibold mb-4">Historial de entregas</h1>

    <form method="GET" action="{{ url('/reportes/motociclista') }}" class="mb-4">
        <label class="me-2">Rango:</label>
        <select name="range" class="border rounded px-2 py-1" onchange="this.form.submit()">
            <option value="dia" {{ $range==='dia' ? 'selected' : '' }}>Día</option>
            <option value="semana" {{ $range==='semana' ? 'selected' : '' }}>Semana</option>
            <option value="mes" {{ $range==='mes' ? 'selected' : '' }}>Mes</option>
        </select>
    </form>

    <div class="overflow-x-auto bg-white border rounded">
        <table class="min-w-full">
            <thead>
            <tr class="bg-gray-100 text-left text-sm text-gray-700">
                <th class="px-4 py-2">Fecha</th>
                <th class="px-4 py-2">Cliente</th>
                <th class="px-4 py-2">Dirección</th>
                <th class="px-4 py-2">Estado</th>
                <th class="px-4 py-2">Observación</th>
            </tr>
            </thead>
            <tbody>
            @forelse ($entregas as $e)
                <tr class="border-t">
                    <td class="px-4 py-2 text-sm text-gray-600">{{ optional($e->entregado_at) ? $e->entregado_at->format('Y-m-d H:i') : $e->created_at->format('Y-m-d H:i') }}</td>
                    <td class="px-4 py-2">{{ $e->pedido->cliente }}</td>
                    <td class="px-4 py-2">{{ $e->pedido->direccion }}</td>
                    <td class="px-4 py-2 capitalize">{{ $e->status }}</td>
                    <td class="px-4 py-2">{{ $e->observacion }}</td>
                </tr>
            @empty
                <tr><td colspan="5" class="px-4 py-6 text-center text-gray-500">Sin entregas</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-3">{{ $entregas->withQueryString()->links() }}</div>
</div>
@endsection

