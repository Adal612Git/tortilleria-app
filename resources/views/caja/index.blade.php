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

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2">
            <div class="bg-secondary border rounded p-4">
                <h2 class="text-xl font-semibold mb-3">Histórico de ventas del día</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead>
                            <tr class="bg-gray-100 text-left text-sm text-gray-700">
                                <th class="px-2 py-2">Hora</th>
                                <th class="px-2 py-2">Producto</th>
                                <th class="px-2 py-2 text-right">Cantidad</th>
                                <th class="px-2 py-2 text-right">Total</th>
                                <th class="px-2 py-2">Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($ventasDia as $v)
                                <tr class="border-t">
                                    <td class="px-2 py-2 text-sm text-gray-600">{{ $v->created_at->format('H:i') }}</td>
                                    <td class="px-2 py-2">{{ $v->product->name }}</td>
                                    <td class="px-2 py-2 text-right">{{ $v->quantity }}</td>
                                    <td class="px-2 py-2 text-right">$ {{ number_format($v->total, 2) }}</td>
                                    <td class="px-2 py-2">{{ $v->user->name }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="px-4 py-6 text-center text-gray-500">Sin ventas hoy</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="md:col-span-1">
            <div class="bg-secondary border rounded p-4">
                @if (!$caja)
                    <h2 class="text-xl font-semibold mb-2">Abrir caja</h2>
                    <button id="btn-open-modal" class="btn-app btn-success-app w-full">Abrir caja</button>
                @else
                    <h2 class="text-xl font-semibold mb-2">Caja abierta</h2>
                    <div class="text-sm mb-3">Por: <strong>{{ $caja->openedBy->name }}</strong><br>En: {{ $caja->opened_at->format('Y-m-d H:i') }}</div>
                    <div class="text-sm mb-4">Fondo de apertura: <strong>$ {{ number_format($caja->opening_fund, 2) }}</strong></div>
                    <form id="close-caja-form" method="POST" action="{{ url('/caja/cerrar') }}">
                        @csrf
                        <button type="button" id="btn-close-modal" class="btn-app btn-secondary-app w-full">Corte de caja</button>
                    </form>
                @endif
            </div>
            <div class="bg-secondary border rounded p-4 mt-6">
                <h2 class="text-xl font-semibold mb-3">Pedidos pendientes</h2>
                @if ($pendientes->isEmpty())
                    <div class="text-gray-500">No hay pedidos pendientes</div>
                @else
                    <div class="space-y-3">
                        @foreach ($pendientes as $p)
                            <div class="border rounded p-2">
                                <div class="text-sm text-gray-600">{{ $p->created_at->format('Y-m-d H:i') }}</div>
                                <div class="font-medium">{{ $p->cliente }} — $ {{ number_format($p->total, 2) }}</div>
                                <div class="text-sm text-gray-700">{{ $p->direccion }}</div>
                                @if ($canAssign)
                                    <form method="POST" action="{{ url('/entregas/asignar/'.$p->id) }}" class="mt-2 flex items-center gap-2">
                                        @csrf
                                        <select name="motociclista_id" class="border rounded px-2 py-1 flex-1">
                                            @foreach ($motociclistas as $m)
                                                <option value="{{ $m->id }}">{{ $m->name }}</option>
                                            @endforeach
                                        </select>
                                        <button class="btn-app btn-accent-app">Asignar</button>
                                    </form>
                                @else
                                    <div class="text-xs text-gray-500 mt-1">Sólo Admin o Despachador pueden asignar</div>
                                @endif
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>
        </div>
    </div>

    <!-- Modal Abrir Caja -->
    <div id="modal-open" class="fixed inset-0 bg-black/40 hidden items-center justify-center">
        <div class="bg-secondary rounded shadow p-4 w-full max-w-sm">
            <h3 class="text-lg font-semibold mb-2">Abrir caja</h3>
            <form id="open-caja-form" method="POST" action="{{ url('/caja/abrir') }}">
                @csrf
                <label class="block text-sm text-gray-700 mb-1">Fondo de apertura</label>
                <input type="number" name="opening_fund" step="0.01" min="0" value="0" class="border rounded w-full px-2 py-1 mb-4" />
                <div class="flex items-center justify-end gap-2">
                    <button type="button" class="btn-app btn-outline-app" id="open-cancel">No</button>
                    <button class="btn-app btn-success-app">Sí, abrir</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Cerrar Caja -->
    <div id="modal-close" class="fixed inset-0 bg-black/40 hidden items-center justify-center">
        <div class="bg-secondary rounded shadow p-4 w-full max-w-sm">
            <h3 class="text-lg font-semibold mb-3">¿Cerrar caja?</h3>
            <div class="flex items-center justify-end gap-2">
                <button type="button" class="btn-app btn-outline-app" id="close-cancel">No</button>
                <button type="button" class="btn-app btn-secondary-app" id="close-confirm">Sí, cerrar</button>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const $ = (s) => document.querySelector(s);

            // Open modal controls
            const modalOpen = $('#modal-open');
            const btnOpenModal = $('#btn-open-modal');
            if (btnOpenModal && modalOpen) {
                btnOpenModal.addEventListener('click', () => { modalOpen.classList.remove('hidden'); modalOpen.classList.add('flex'); });
                $('#open-cancel').addEventListener('click', () => { modalOpen.classList.add('hidden'); modalOpen.classList.remove('flex'); });
            }

            // Close modal controls
            const modalClose = $('#modal-close');
            const btnCloseModal = $('#btn-close-modal');
            const closeForm = $('#close-caja-form');
            if (btnCloseModal && modalClose && closeForm) {
                btnCloseModal.addEventListener('click', () => { modalClose.classList.remove('hidden'); modalClose.classList.add('flex'); });
                $('#close-cancel').addEventListener('click', () => { modalClose.classList.add('hidden'); modalClose.classList.remove('flex'); });
                $('#close-confirm').addEventListener('click', async () => {
                    modalClose.classList.add('hidden'); modalClose.classList.remove('flex');
                    // Submit and download PDF
                    const formData = new FormData(closeForm);
                    const token = formData.get('_token');
                    try {
                        const resp = await fetch(closeForm.action, { method: 'POST', headers: { 'X-CSRF-TOKEN': token, 'Accept': 'application/pdf' }, body: formData });
                        if (!resp.ok) { alert('Error al cerrar caja'); return; }
                        const blob = await resp.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        const cd = resp.headers.get('Content-Disposition');
                        let filename = 'reporte-caja.pdf';
                        if (cd && cd.includes('filename=')) { filename = cd.split('filename=')[1].replace(/\"/g, ''); }
                        a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
                        setTimeout(() => window.location.reload(), 500);
                    } catch (err) { console.error(err); alert('Error inesperado al cerrar caja'); }
                });
            }
        });
    </script>
</div>
@endsection
