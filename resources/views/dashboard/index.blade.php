@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
<div class="max-w-7xl mx-auto py-8 px-4">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-secondary border rounded p-4">
            <div class="text-gray-500 text-sm">Ventas hoy</div>
            <div class="text-2xl font-bold">$ {{ number_format($ventasHoy, 2) }}</div>
        </div>
        <div class="bg-secondary border rounded p-4">
            <div class="text-gray-500 text-sm">Ventas este mes</div>
            <div class="text-2xl font-bold">$ {{ number_format($ventasMes, 2) }}</div>
        </div>
        <div class="bg-secondary border rounded p-4">
            <div class="text-gray-500 text-sm">Inventario total</div>
            <div class="text-2xl font-bold">{{ $inventarioTotal }}</div>
        </div>
        <div class="bg-secondary border rounded p-4">
            <div class="text-gray-500 text-sm">Pedidos activos</div>
            <div class="text-2xl font-bold">{{ $pedidosActivos }}</div>
        </div>
    </div>

    <div class="flex items-center gap-2 mb-4">
        <a class="btn-app btn-accent-app" href="{{ url('/reportes/ventas/pdf') }}">Ventas PDF</a>
        <a class="btn-app btn-outline-app" href="{{ url('/reportes/ventas/csv') }}">Ventas CSV</a>
        <a class="btn-app btn-accent-app" href="{{ url('/reportes/inventario/pdf') }}">Inventario PDF</a>
        <a class="btn-app btn-outline-app" href="{{ url('/reportes/inventario/csv') }}">Inventario CSV</a>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-secondary border rounded p-4">
            <h2 class="font-medium mb-2">Ventas por día (30 días)</h2>
            <div class="text-xs text-gray-500 mb-1">Tortillas • Masa • Totopos</div>
            <canvas id="chartDia" height="160"></canvas>
        </div>
        <div class="bg-secondary border rounded p-4">
            <h2 class="font-medium mb-2">Ventas por semana (12 semanas)</h2>
            <div class="text-xs text-gray-500 mb-1">Tortillas • Masa • Totopos</div>
            <canvas id="chartSem" height="160"></canvas>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div class="bg-white border rounded p-4">
            <h2 class="font-medium mb-2">Concentrado Total (30 días)</h2>
            <canvas id="chartTotal" height="140"></canvas>
        </div>
        <div class="bg-white border rounded p-4">
            <h2 class="font-medium mb-2">Top 10 productos</h2>
            <canvas id="chartProducto" height="140"></canvas>
        </div>
        <div class="bg-white border rounded p-4">
            <h2 class="font-medium mb-2">Top Repartidores</h2>
            <canvas id="chartRepartidor" height="140"></canvas>
            <div class="overflow-x-auto mt-3">
                <table class="min-w-full text-sm">
                    <thead>
                        <tr class="text-gray-700 bg-gray-100">
                            <th class="px-2 py-1 text-left">Repartidor</th>
                            <th class="px-2 py-1 text-right">Entregas</th>
                            <th class="px-2 py-1 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach (($topRepartidores ?? []) as $r)
                        <tr class="border-t">
                            <td class="px-2 py-1">{{ $r->repartidor }}</td>
                            <td class="px-2 py-1 text-right">{{ $r->entregas }}</td>
                            <td class="px-2 py-1 text-right">$ {{ number_format($r->total, 2) }}</td>
                        </tr>
                        @endforeach
                        @if (($topRepartidores ?? collect())->isEmpty())
                        <tr><td colspan="3" class="px-2 py-2 text-center text-gray-500">Sin datos</td></tr>
                        @endif
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="bg-white border rounded p-4 mt-6">
        <h2 class="font-medium mb-2">Top 10 Tiendas</h2>
        <p class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Pendiente: se requiere relación de ventas/pedidos a tiendas para calcular “Producto estrella” y “Producto rotativo”.
        </p>
        <div class="overflow-x-auto mt-3">
            <table class="min-w-full text-sm">
                <thead>
                    <tr class="text-gray-700 bg-gray-100">
                        <th class="px-2 py-1 text-left">Tienda</th>
                        <th class="px-2 py-1 text-left">Producto estrella</th>
                        <th class="px-2 py-1 text-left">Producto rotativo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="px-2 py-2 text-gray-500" colspan="3">Diseñar modelo de Tienda y enlazar ventas.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Auto refresh cada 10s
        setInterval(() => window.location.reload(), 10000);

        document.addEventListener('DOMContentLoaded', () => {
            const labelsDia = @json($labelsDia);
            const seriesDia = @json($seriesDia);
            const labelsSem = @json($labelsSem);
            const seriesSem = @json($seriesSem);
            const labelsProducto = @json($labelsProducto);
            const dataProducto = @json($dataProducto);
            const labelsTotal = @json($labelsTotalDia);
            const dataTotal = @json($dataTotalDia);
            const labelsRepartidor = @json($labelsRepartidor);
            const dataRepartidor = @json($dataRepartidor);

            if (window.Chart) {
                new window.Chart(document.getElementById('chartDia'), {
                    type: 'bar',
                    data: {
                        labels: labelsDia,
                        datasets: [
                            { label: 'Tortillas', data: seriesDia.Tortillas, backgroundColor: '#2563eb' },
                            { label: 'Masa', data: seriesDia.Masa, backgroundColor: '#16a34a' },
                            { label: 'Totopos', data: seriesDia.Totopos, backgroundColor: '#f59e0b' },
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: { y: { beginAtZero: true, ticks: { callback: v => `$ ${Number(v).toFixed(0)}` } } },
                        plugins: { tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: $ ${ctx.parsed.y.toFixed(2)}` } } }
                    }
                });

                new window.Chart(document.getElementById('chartSem'), {
                    type: 'line',
                    data: {
                        labels: labelsSem,
                        datasets: [
                            { label: 'Tortillas', data: seriesSem.Tortillas, borderColor: '#2563eb', fill: false },
                            { label: 'Masa', data: seriesSem.Masa, borderColor: '#16a34a', fill: false },
                            { label: 'Totopos', data: seriesSem.Totopos, borderColor: '#f59e0b', fill: false },
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: { y: { beginAtZero: true, ticks: { callback: v => `$ ${Number(v).toFixed(0)}` } } },
                        plugins: { tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: $ ${ctx.parsed.y.toFixed(2)}` } } }
                    }
                });

                new window.Chart(document.getElementById('chartProducto'), {
                    type: 'bar',
                    data: { labels: labelsProducto, datasets: [{ label: 'Total', data: dataProducto, backgroundColor: '#9333ea' }] },
                    options: { indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { callback: v => `$ ${Number(v).toFixed(0)}` } } },
                        plugins: { tooltip: { callbacks: { label: ctx => `$ ${ctx.parsed.x.toFixed(2)}` } } } }
                });

                new window.Chart(document.getElementById('chartTotal'), {
                    type: 'line',
                    data: { labels: labelsTotal, datasets: [{ label: 'Total', data: dataTotal, borderColor: '#0ea5e9', fill: false }] },
                    options: { scales: { y: { beginAtZero: true, ticks: { callback: v => `$ ${Number(v).toFixed(0)}` } } },
                        plugins: { tooltip: { callbacks: { label: ctx => `$ ${ctx.parsed.y.toFixed(2)}` } } } }
                });

                new window.Chart(document.getElementById('chartRepartidor'), {
                    type: 'bar',
                    data: { labels: labelsRepartidor, datasets: [{ label: 'Ventas', data: dataRepartidor, backgroundColor: '#ef4444' }] },
                    options: { indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { callback: v => `$ ${Number(v).toFixed(0)}` } } },
                        plugins: { tooltip: { callbacks: { label: ctx => `$ ${ctx.parsed.x.toFixed(2)}` } } } }
                });
            }
        });
    </script>
</div>
@endsection
