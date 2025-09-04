@extends('layouts.app')

@section('title', 'Entregas pendientes')

@section('content')
<div class="max-w-5xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-semibold mb-4">Pedidos pendientes (Motociclista)</h1>

    @if (session('status'))
        <div class="alert-success mb-4">{{ session('status') }}</div>
    @endif
    @if ($errors->any())
        <div class="alert-error mb-4">{{ $errors->first() }}</div>
    @endif

    <div class="overflow-x-auto bg-white border rounded">
        <table class="min-w-full">
            <thead>
            <tr class="bg-gray-100 text-left text-sm text-gray-700">
                <th class="px-4 py-2">Fecha</th>
                <th class="px-4 py-2">Cliente</th>
                <th class="px-4 py-2">Dirección</th>
                <th class="px-4 py-2">Total</th>
                <th class="px-4 py-2">Acción</th>
            </tr>
            </thead>
            <tbody>
            @forelse ($pendientes as $p)
                <tr class="border-t">
                    <td class="px-4 py-2 text-sm text-gray-600">{{ $p->created_at->format('Y-m-d H:i') }}</td>
                    <td class="px-4 py-2">{{ $p->cliente }}</td>
                    <td class="px-4 py-2">{{ $p->direccion }}</td>
                    <td class="px-4 py-2">$ {{ number_format($p->total, 2) }}</td>
                    <td class="px-4 py-2">
                        <form method="POST" action="{{ url('/entregas/tomar/'.$p->id) }}">
                            @csrf
                            <button class="btn-app btn-accent-app">Tomar</button>
                        </form>
                    </td>
                </tr>
            @empty
                <tr><td colspan="5" class="px-4 py-6 text-center text-gray-500">No hay pedidos pendientes</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-3">{{ $pendientes->links() }}</div>
</div>
@endsection
