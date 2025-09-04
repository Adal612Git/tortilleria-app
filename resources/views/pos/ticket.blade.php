<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 10px; }
        .section { margin-bottom: 8px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border-bottom: 1px solid #ddd; padding: 6px; text-align: left; }
    </style>
    <title>Ticket</title>
    </head>
<body>
    <div class="title">Tortillería - Ticket de Venta</div>
    <div class="section">Fecha: {{ $venta->created_at->format('Y-m-d H:i') }}</div>
    <div class="section">Cajero: {{ $venta->user->name }}</div>
    <table class="table">
        <thead>
            <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $venta->product->name }}</td>
                <td>{{ $venta->quantity }}</td>
                <td>$ {{ number_format($venta->product->price, 2) }}</td>
                <td>$ {{ number_format($venta->total, 2) }}</td>
            </tr>
        </tbody>
    </table>
    <div class="section" style="text-align:right; font-weight:bold;">Total: $ {{ number_format($venta->total, 2) }}</div>
</body>
</html>

