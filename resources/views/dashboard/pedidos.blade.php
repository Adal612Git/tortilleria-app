@extends('layouts.app')

@section('title', 'Pedidos (Dashboard)')

@section('content')
<div class="max-w-6xl mx-auto py-8 px-4" id="pedidos-container">
    <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-semibold">Pedidos (Dueño/Admin)</h1>
        <div class="text-sm text-gray-600">Actualiza cada 10s</div>
    </div>

    <div class="flex items-center gap-3 mb-3">
        <span>Filtrar estado:</span>
        @foreach (['pendiente','en_progreso','entregado','no_entregado'] as $st)
            <a href="{{ url('/dashboard/pedidos?status='.$st) }}" class="text-blue-600 hover:underline">{{ $st }}</a>
        @endforeach
        <a href="{{ url('/dashboard/pedidos') }}" class="text-gray-600 hover:underline">Todos</a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @foreach ($pedidos as $p)
            @php
                $color = match($p->status) {
                    'pendiente' => 'bg-yellow-50 border-yellow-200',
                    'en_progreso' => 'bg-blue-50 border-blue-200',
                    'entregado' => 'bg-green-50 border-green-200',
                    'no_entregado' => 'bg-red-50 border-red-200',
                    default => 'bg-white'
                };
            @endphp
            <div class="border rounded p-4 bg-secondary">
                <div class="font-medium">{{ $p->cliente }}</div>
                <div class="text-sm text-gray-600">{{ $p->direccion }}</div>
                <div class="text-sm text-gray-600">Total: $ {{ number_format($p->total, 2) }}</div>
                <div class="mt-2 capitalize"><strong>Estado:</strong> {{ $p->status }}</div>
                <div class="text-sm mt-1">Motociclista: {{ $p->entrega?->motociclista?->name ?? '-' }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ $p->created_at->format('Y-m-d H:i') }}</div>
            </div>
        @endforeach
    </div>

    <div class="mt-4">{{ $pedidos->withQueryString()->links() }}</div>
</div>

<script>
    setInterval(() => {
        const url = new URL(window.location.href);
        fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' }})
            .then(r => r.text())
            .then(html => {
                // Re-render whole page if needed; simplest approach:
                window.location.reload();
            })
            .catch(() => {});
    }, 10000);
</script>
@endsection
