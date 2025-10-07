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
    <title>Reporte de Caja</title>
</head>
<body>
    <div class="title">Tortillería - Corte de Caja</div>
    <div class="section">Abierta: {{ $caja->opened_at->format('Y-m-d H:i') }} por {{ $caja->openedBy->name }}</div>
    <div class="section">Fondo de apertura: $ {{ number_format($caja->opening_fund, 2) }}</div>
    <div class="section">Cerrada: {{ optional($caja->closed_at)->format('Y-m-d H:i') }} por {{ $caja->closedBy?->name }}</div>

    <table class="table">
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Total</th>
                <th>Usuario</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($ventas as $v)
                <tr>
                    <td>{{ $v->created_at->format('Y-m-d H:i') }}</td>
                    <td>{{ $v->product->name }}</td>
                    <td>{{ $v->quantity }}</td>
                    <td>$ {{ number_format($v->product->price, 2) }}</td>
                    <td>$ {{ number_format($v->total, 2) }}</td>
                    <td>{{ $v->user->name }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="section" style="text-align:right; font-weight:bold;">Subtotal: $ {{ number_format($subtotal, 2) }}</div>
</body>
</html>
