@extends('layouts.app')

@section('title', 'Auditoría')

@section('content')
<div class="max-w-7xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-semibold mb-4">Auditoría</h1>

    <form method="GET" action="{{ url('/auditoria') }}" class="row g-2 mb-3">
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
        <div class="col-12">
            <button class="btn btn-primary btn-sm">Filtrar</button>
            <a href="{{ url('/auditoria') }}" class="btn btn-secondary btn-sm">Limpiar</a>
        </div>
    </form>

    <div class="table-responsive bg-white border rounded">
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

