@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
<div class="max-w-7xl mx-auto py-8 px-4">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white border rounded p-4">
            <div class="text-gray-500 text-sm">Ventas hoy</div>
            <div class="text-2xl font-bold">$ {{ number_format($ventasHoy, 2) }}</div>
        </div>
        <div class="bg-white border rounded p-4">
            <div class="text-gray-500 text-sm">Ventas este mes</div>
            <div class="text-2xl font-bold">$ {{ number_format($ventasMes, 2) }}</div>
        </div>
        <div class="bg-white border rounded p-4">
            <div class="text-gray-500 text-sm">Inventario total</div>
            <div class="text-2xl font-bold">{{ $inventarioTotal }}</div>
        </div>
        <div class="bg-white border rounded p-4">
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white border rounded p-4">
            <h2 class="font-medium mb-2">Ventas por hora (24h)</h2>
            <canvas id="chartHora" height="140"></canvas>
        </div>
        <div class="bg-white border rounded p-4">
            <h2 class="font-medium mb-2">Ventas por día (30 días)</h2>
            <canvas id="chartDia" height="140"></canvas>
        </div>
        <div class="bg-white border rounded p-4">
            <h2 class="font-medium mb-2">Top 10 productos</h2>
            <canvas id="chartProducto" height="140"></canvas>
        </div>
    </div>

    <script>
        // Auto refresh cada 10s
        setInterval(() => window.location.reload(), 10000);

        document.addEventListener('DOMContentLoaded', () => {
            const labelsHora = @json($labelsHora);
            const dataHora = @json($dataHora);
            const labelsDia = @json($labelsDia);
            const dataDia = @json($dataDia);
            const labelsProducto = @json($labelsProducto);
            const dataProducto = @json($dataProducto);

            if (window.Chart) {
                new window.Chart(document.getElementById('chartHora'), {
                    type: 'line',
                    data: { labels: labelsHora, datasets: [{ label: 'Ventas', data: dataHora, borderColor: '#2563eb', fill: false }] },
                    options: { scales: { y: { beginAtZero: true } } }
                });

                new window.Chart(document.getElementById('chartDia'), {
                    type: 'bar',
                    data: { labels: labelsDia, datasets: [{ label: 'Ventas', data: dataDia, backgroundColor: '#16a34a' }] },
                    options: { scales: { y: { beginAtZero: true } } }
                });

                new window.Chart(document.getElementById('chartProducto'), {
                    type: 'bar',
                    data: { labels: labelsProducto, datasets: [{ label: 'Total', data: dataProducto, backgroundColor: '#f59e0b' }] },
                    options: { indexAxis: 'y', scales: { x: { beginAtZero: true } } }
                });
            }
        });
    </script>
</div>
@endsection
