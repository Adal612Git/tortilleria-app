@extends('layouts.app')

@section('title', 'Caja')

@section('content')
<div class="max-w-6xl mx-auto py-10 px-4">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold">Caja</h1>
        <a href="{{ url('/pos') }}" class="text-blue-600 hover:underline">Ir a POS</a>
    </div>

    @if (session('status'))
        <div class="alert-success mb-4">{{ session('status') }}</div>
    @endif
    @if ($errors->any())
        <div class="alert-error mb-4">{{ $errors->first() }}</div>
    @endif

    @if (!$caja)
        <div class="bg-white border rounded p-6">
            <p class="mb-4">No hay caja abierta.</p>
            <form method="POST" action="{{ url('/caja/abrir') }}">
                @csrf
                <button class="btn-app btn-success-app">Abrir caja</button>
            </form>
        </div>
    @else
        <div class="bg-white border rounded p-6 mb-6">
            <div class="mb-2">Caja abierta por: <strong>{{ $caja->openedBy->name }}</strong> en {{ $caja->opened_at->format('Y-m-d H:i') }}</div>
            <form id="close-caja-form" method="POST" action="{{ url('/caja/cerrar') }}">
                @csrf
                <button class="btn-app btn-secondary-app">Corte de caja</button>
            </form>
        </div>

        <div class="overflow-x-auto bg-white border rounded">
            <table class="min-w-full">
                <thead>
                <tr class="bg-gray-100 text-left text-sm text-gray-700">
                    <th class="px-4 py-2">Fecha</th>
                    <th class="px-4 py-2">Producto</th>
                    <th class="px-4 py-2">Cantidad</th>
                    <th class="px-4 py-2">Total</th>
                    <th class="px-4 py-2">Usuario</th>
                </tr>
                </thead>
                <tbody>
                @forelse ($ventas as $v)
                    <tr class="border-t">
                        <td class="px-4 py-2 text-sm text-gray-600">{{ $v->created_at->format('Y-m-d H:i') }}</td>
                        <td class="px-4 py-2">{{ $v->product->name }}</td>
                        <td class="px-4 py-2">{{ $v->quantity }}</td>
                        <td class="px-4 py-2">$ {{ number_format($v->total, 2) }}</td>
                        <td class="px-4 py-2">{{ $v->user->name }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="px-4 py-6 text-center text-gray-500">Sin ventas aún</td>
                    </tr>
                @endforelse
                </tbody>
            </table>
        </div>
    @endif
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('close-caja-form');
            if (!form) return;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const token = formData.get('_token');
                try {
                    const resp = await fetch(form.action, {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': token,
                            'Accept': 'application/pdf'
                        },
                        body: formData
                    });
                    if (!resp.ok) {
                        alert('Error al cerrar caja');
                        return;
                    }
                    const blob = await resp.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    const cd = resp.headers.get('Content-Disposition');
                    let filename = 'reporte-caja.pdf';
                    if (cd && cd.includes('filename=')) {
                        filename = cd.split('filename=')[1].replace(/"/g, '');
                    }
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    setTimeout(() => window.location.reload(), 500);
                } catch (err) {
                    console.error(err);
                    alert('Error inesperado al cerrar caja');
                }
            });
        });
    </script>
</div>
@endsection
