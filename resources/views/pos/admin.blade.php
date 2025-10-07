@extends('layouts.app')

@section('title', 'APOS')

@section('content')
<div class="max-w-5xl mx-auto py-10 px-4">
    <h1 class="text-3xl font-bold mb-6">Punto de Venta Administrador (APOS)</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button type="button" class="btn btn-primary w-full py-3">Rutas</button>
        <button type="button" class="btn btn-primary w-full py-3">Repartidor</button>
        <button type="button" class="btn btn-primary w-full py-3">Hieleras y devoluciones</button>
        <div class="border rounded-lg p-4 bg-white shadow">
            <h2 class="font-semibold text-lg mb-3">Total generado</h2>
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                <select class="border rounded px-3 py-2">
                    <option value="global">Global</option>
                    <option value="ruta1">Ruta 1</option>
                    <option value="ruta2">Ruta 2</option>
                </select>
                <button type="button" class="btn btn-secondary">Consultar</button>
            </div>
        </div>
    </div>

    <p class="text-sm text-gray-500 mt-6">(Interfaz en construcción. Funcionalidad pendiente de definir.)</p>
</div>
@endsection
