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

    <div class="flex items-center gap-2 mb-4 flex-wrap">
        <a class="btn-app btn-accent-app" href="{{ url('/reportes/ventas/pdf') }}">Ventas PDF</a>
        <a class="btn-app btn-outline-app" href="{{ url('/reportes/ventas/csv') }}">Ventas CSV</a>
        <a class="btn-app btn-accent-app" href="{{ url('/reportes/inventario/pdf') }}">Inventario PDF</a>
        <a class="btn-app btn-outline-app" href="{{ url('/reportes/inventario/csv') }}">Inventario CSV</a>
    </div>

    <form method="GET" class="bg-white border rounded p-4 mb-6 flex flex-col md:flex-row md:items-end gap-3">
        <div>
            <label for="from" class="block text-sm font-medium text-gray-600">Desde</label>
            <input type="date" id="from" name="from" value="{{ optional($rangeFrom)->toDateString() }}" class="border rounded px-3 py-2">
        </div>
        <div>
            <label for="to" class="block text-sm font-medium text-gray-600">Hasta</label>
            <input type="date" id="to" name="to" value="{{ optional($rangeTo)->toDateString() }}" class="border rounded px-3 py-2">
        </div>
        <div class="flex gap-2">
            <button type="submit" class="btn-app btn-secondary-app">Aplicar</button>
            @if(request()->has('from') || request()->has('to'))
                <a href="{{ url('/dashboard') }}" class="btn-app btn-outline-app">Restablecer</a>
            @endif
        </div>
    </form>

    <div class="grid gap-6 lg:grid-cols-12">
        <div class="space-y-6 lg:col-span-3">
            <div class="bg-white border rounded p-4">
                <h2 class="font-medium mb-2">Venta total ({{ $rangeFrom->toDateString() }} - {{ $rangeTo->toDateString() }})</h2>
                <div class="text-2xl font-bold text-blue-600 mb-4">$ {{ number_format($ventaTotalRango, 2) }}</div>
                <canvas id="chartVentaRango" height="160"></canvas>
            </div>

            <div class="bg-white border rounded p-4">
                <h2 class="font-medium mb-4">Consumo de maíz y producción</h2>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span>Costales de maíz usados</span><strong>{{ number_format($totalCostales, 0) }}</strong></div>
                    <div class="flex justify-between"><span>Total masa producida</span><strong>{{ number_format($totalMasa, 0) }}</strong></div>
                    <div class="flex justify-between"><span>Total tortillas producidas</span><strong>{{ number_format($totalTortillas, 0) }}</strong></div>
                    <div class="flex justify-between"><span>Total dinero (rango)</span><strong>$ {{ number_format($totalDineroRango, 2) }}</strong></div>
                </div>
            </div>
        </div>

        <div class="space-y-6 lg:col-span-6">
            <div class="bg-white border rounded p-4">
                <h2 class="font-medium mb-2">Ventas de hoy (dinero)</h2>
                <canvas id="chartVentasHoy" height="160"></canvas>
            </div>
            <div class="bg-white border rounded p-4">
                <h2 class="font-medium mb-2">Ventas del mes (dinero)</h2>
                <canvas id="chartVentasMes" height="160"></canvas>
            </div>
            <div class="bg-white border rounded p-4">
                <h2 class="font-medium mb-2">Top tiendas ({{ $labelsTiendas->count() }} registros)</h2>
                @if($labelsTiendas->isEmpty())
                    <p class="text-sm text-gray-500">Sin datos suficientes en el rango seleccionado.</p>
                @else
                    <canvas id="chartTopTiendas" height="200"></canvas>
                @endif
            </div>
            <div class="bg-white border rounded p-4">
                <h2 class="font-medium mb-2">Top productos</h2>
                @if($labelsProducto->isEmpty())
                    <p class="text-sm text-gray-500">Sin datos suficientes en el rango seleccionado.</p>
                @else
                    <canvas id="chartTopProductos" height="200"></canvas>
                @endif
            </div>
        </div>

        <div class="space-y-4 lg:col-span-3">
            <div class="bg-white border rounded p-4">
                <h2 class="font-medium mb-3">Pedidos activos</h2>
                <div class="space-y-3 max-h-96 overflow-y-auto">
                    @forelse ($pedidosActivosList as $pedido)
                        <div class="border rounded p-3">
                            <div class="font-semibold">{{ $pedido->cliente }}</div>
                            <div class="text-sm text-gray-600">Total: $ {{ number_format($pedido->total, 2) }}</div>
                            <div class="text-xs text-gray-500">Estado: {{ ucfirst(str_replace('_', ' ', $pedido->status)) }}</div>
                            <div class="text-xs text-gray-500">Creado: {{ $pedido->created_at->format('d/m/Y H:i') }}</div>
                        </div>
                    @empty
                        <p class="text-sm text-gray-500">No hay pedidos activos.</p>
                    @endforelse
                </div>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (!window.Chart) {
                return;
            }

            const chartVentaRangoCtx = document.getElementById('chartVentaRango');
            const ventaRangoLabels = @json($labelsVentaRango);
            const ventaRangoData = @json($dataVentaRango);
            if (chartVentaRangoCtx && ventaRangoLabels.length) {
                new window.Chart(chartVentaRangoCtx, {
                    type: 'line',
                    data: {
                        labels: ventaRangoLabels,
                        datasets: [{
                            label: 'Total vendido',
                            data: ventaRangoData,
                            borderColor: '#2563eb',
                            backgroundColor: 'rgba(37, 99, 235, 0.15)',
                            fill: true,
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { callback: (value) => `$ ${Number(value).toFixed(0)}` }
                            }
                        }
                    }
                });
            }

            const ventasHoyCtx = document.getElementById('chartVentasHoy');
            if (ventasHoyCtx) {
                new window.Chart(ventasHoyCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Hoy'],
                        datasets: [{
                            label: 'Dinero',
                            data: [{{ $ventasHoy }}],
                            backgroundColor: '#16a34a',
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { callback: (value) => `$ ${Number(value).toFixed(0)}` }
                            }
                        }
                    }
                });
            }

            const ventasMesCtx = document.getElementById('chartVentasMes');
            if (ventasMesCtx) {
                new window.Chart(ventasMesCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Mes'],
                        datasets: [{
                            label: 'Dinero',
                            data: [{{ $ventasMes }}],
                            backgroundColor: '#9333ea',
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { callback: (value) => `$ ${Number(value).toFixed(0)}` }
                            }
                        }
                    }
                });
            }

            const topTiendasCtx = document.getElementById('chartTopTiendas');
            const labelsTiendas = @json($labelsTiendas);
            const dataTiendas = @json($dataTiendas);
            if (topTiendasCtx && labelsTiendas.length) {
                new window.Chart(topTiendasCtx, {
                    type: 'bar',
                    data: {
                        labels: labelsTiendas,
                        datasets: [{
                            label: 'Total',
                            data: dataTiendas,
                            backgroundColor: '#f97316',
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        scales: {
                            x: {
                                beginAtZero: true,
                                ticks: { callback: (value) => `$ ${Number(value).toFixed(0)}` }
                            }
                        }
                    }
                });
            }

            const topProductosCtx = document.getElementById('chartTopProductos');
            const labelsProductos = @json($labelsProducto);
            const dataProductos = @json($dataProducto);
            if (topProductosCtx && labelsProductos.length) {
                new window.Chart(topProductosCtx, {
                    type: 'bar',
                    data: {
                        labels: labelsProductos,
                        datasets: [{
                            label: 'Total',
                            data: dataProductos,
                            backgroundColor: '#0ea5e9',
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        scales: {
                            x: {
                                beginAtZero: true,
                                ticks: { callback: (value) => `$ ${Number(value).toFixed(0)}` }
                            }
                        }
                    }
                });
            }
        });
    </script>
</div>
@endsection
