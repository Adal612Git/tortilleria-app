<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte semanal</title>
</head>
<body style="font-family:Arial, sans-serif; color:#111;">
    <h1>Reporte semanal ({{ $summary['from'] }} a {{ $summary['to'] }})</h1>
    <p>
        Total de ventas de la semana: <strong>$ {{ number_format($summary['totalSemana'], 2) }}</strong><br>
        Producto destacado: <strong>{{ $summary['topProducto']['name'] ?? '-' }}</strong> ($ {{ number_format($summary['topProducto']['total'] ?? 0, 2) }})<br>
        Top repartidor: <strong>{{ $summary['topRepartidor']->repartidor ?? '-' }}</strong> ($ {{ number_format($summary['topRepartidor']->total ?? 0, 2) }})<br>
        Top tienda: <strong>{{ $summary['topTienda']->cliente ?? '-' }}</strong> ($ {{ number_format($summary['topTienda']->total ?? 0, 2) }})
    </p>

    <h2>Ventas por producto</h2>
    <img src="{{ $charts['ventas'] }}" alt="Ventas semanales" style="max-width:100%;" />

    <h2>Top 10 tiendas</h2>
    <img src="{{ $charts['tiendas'] }}" alt="Top tiendas" style="max-width:100%;" />

    <h2>Top repartidores</h2>
    <img src="{{ $charts['repartidores'] }}" alt="Top repartidores" style="max-width:100%;" />

    <p style="font-size:12px;color:#666;">Este es un reporte automático generado por el sistema.</p>
</body>
</html>

