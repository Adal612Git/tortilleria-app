@extends('layouts.app')

@section('title', 'Historial')

@section('content')
<div class="max-w-7xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-semibold mb-4">Historial</h1>

    <form method="GET" action="{{ url('/historial') }}" class="row g-2 mb-3">
        <div class="col-sm-3">
            <input type="number" name="user_id" value="{{ request('user_id') }}" class="form-control" placeholder="Usuario ID">
        </div>
        <div class="col-sm-3">
            <input type="text" name="action" value="{{ request('action') }}" class="form-control" placeholder="Acción">
        </div>
        <div class="col-sm-3">
            <input type="datetime-local" name="from" value="{{ request('from') }}" class="form-control" placeholder="Desde">
        </div>
        <div class="col-sm-3">
            <input type="datetime-local" name="to" value="{{ request('to') }}" class="form-control" placeholder="Hasta">
        </div>
        <div class="col-12 d-flex gap-2">
            <button class="btn-app btn-accent-app">Filtrar</button>
            <a href="{{ url('/historial') }}" class="btn-app btn-outline-app">Limpiar</a>
        </div>
    </form>

    <div class="table-responsive bg-secondary border rounded">
        <table class="table mb-0">
            <thead class="table-light">
            <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>ID</th>
                <th>Descripción</th>
            </tr>
            </thead>
            <tbody>
            @foreach ($audits as $a)
                <tr>
                    <td>{{ $a->created_at }}</td>
                    <td>{{ $a->user?->name }} ({{ $a->user_id }})</td>
                    <td>{{ $a->action }}</td>
                    <td>{{ $a->entity_type }}</td>
                    <td>{{ $a->entity_id }}</td>
                    <td>{{ $a->description }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>

    <div class="mt-3">{{ $audits->withQueryString()->links() }}</div>
</div>
@endsection
