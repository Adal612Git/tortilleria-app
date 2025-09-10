@extends('layouts.app')

@section('title', 'Entrega')

@section('content')
<div class="max-w-3xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-semibold mb-4">Entrega del pedido</h1>

    @if (session('status'))
        <div class="alert-success mb-4">{{ session('status') }}</div>
    @endif
    @if ($errors->any())
        <div class="alert-error mb-4">{{ $errors->first() }}</div>
    @endif

    <div class="bg-white border rounded p-4 mb-4">
        <div><span class="text-gray-600">Cliente:</span> {{ $entrega->pedido->cliente }}</div>
        <div><span class="text-gray-600">Dirección:</span> {{ $entrega->pedido->direccion }}</div>
        <div><span class="text-gray-600">Teléfono:</span> {{ $entrega->pedido->telefono }}</div>
        <div><span class="text-gray-600">Total:</span> $ {{ number_format($entrega->pedido->total, 2) }}</div>
        <div><span class="text-gray-600">Estado actual:</span> {{ $entrega->status }}</div>
    </div>

    <div class="bg-secondary border rounded p-4">
        <form method="POST" action="{{ url('/entregas/'.$entrega->id.'/status') }}" id="status-form" class="space-y-3">
            @csrf
            <div class="flex items-center gap-3">
                <label class="inline-flex items-center gap-1">
                    <input type="radio" name="status" value="entregado" checked>
                    <span>Entregado</span>
                </label>
                <label class="inline-flex items-center gap-1">
                    <input type="radio" name="status" value="no_entregado">
                    <span>No entregado</span>
                </label>
            </div>
            <div id="obs" class="hidden">
                <label class="block text-sm text-gray-600">Observación (requerida si no entregado)</label>
                <input name="observacion" class="border rounded w-full px-2 py-1" />
            </div>
            <button class="btn-app btn-success-app">Guardar</button>
        </form>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('status-form');
            const radios = form.querySelectorAll('input[name="status"]');
            const obs = document.getElementById('obs');
            const toggle = () => {
                const val = [...radios].find(r => r.checked)?.value;
                obs.classList.toggle('hidden', val !== 'no_entregado');
            };
            radios.forEach(r => r.addEventListener('change', toggle));
            toggle();
        });
    </script>
</div>
@endsection
