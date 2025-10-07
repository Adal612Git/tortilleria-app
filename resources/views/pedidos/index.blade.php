@extends('layouts.app')

@section('title', 'Pedidos')

@section('content')
<div class="max-w-5xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-semibold mb-4">Pedidos (Despachador)</h1>

    @if (session('status'))
        <div class="alert-success mb-4">{{ session('status') }}</div>
    @endif
    @if ($errors->any())
        <div class="alert-error mb-4">{{ $errors->first() }}</div>
    @endif

    <div id="pedido-app" class="bg-secondary border rounded p-4 mb-6">
        <h2 class="font-medium mb-3">Crear pedido</h2>
        <div class="mb-4">
            <div class="text-sm text-gray-600 mb-2">Añadir productos</div>
            <div class="flex flex-wrap gap-2">
                @foreach (($products ?? []) as $prod)
                    <button type="button" class="nav-chip btn-soft-green" @click="add({ id: {{ $prod->id }}, name: '{{ $prod->name }}', price: {{ number_format($prod->price,2,'.','') }} })">+ {{ $prod->name }}</button>
                @endforeach
            </div>
            <div class="mt-3 text-sm" v-if="items.length">
                <div class="font-medium mb-1">Resumen:</div>
                <ul class="list-disc pl-5">
                    <li v-for="it in items" :key="it.id">
                        @{{ it.name }} x @{{ it.qty }} — $ @{{ (it.qty * it.price).toFixed(2) }}
                    </li>
                </ul>
                <div class="mt-2 font-semibold">Total: $ @{{ total.toFixed(2) }}</div>
            </div>
        </div>
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
                <input name="total" type="number" min="0" step="0.01" required class="border rounded w-full px-2 py-1" :value="total.toFixed(2)" readonly />
            </div>
            <div class="md:col-span-2">
                <button class="btn-app btn-secondary-app">Crear</button>
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

    <div class="overflow-x-auto bg-secondary border rounded">
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
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script>
    const { createApp, ref, computed } = Vue;
    createApp({
        setup() {
            const items = ref([]);
            const add = (p) => {
                const existing = items.value.find(i => i.id === p.id);
                if (existing) existing.qty += 1; else items.value.push({ ...p, qty: 1 });
            };
            const total = computed(() => items.value.reduce((s, i) => s + i.qty * i.price, 0));
            return { items, add, total };
        }
    }).mount('#pedido-app');
</script>
@endsection
