<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .title { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 10px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border-bottom: 1px solid #ddd; padding: 6px; text-align: left; }
    </style>
    <title>Ventas</title>
    </head>
<body>
    <div class="title">Reporte de Ventas</div>
    @if ($from || $to)
        <div>Rango: {{ $from ?? '-' }} a {{ $to ?? '-' }}</div>
    @endif
    <table class="table">
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cantidad</th>
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
                    <td>$ {{ number_format($v->total, 2) }}</td>
                    <td>{{ $v->user->name }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <div style="text-align:right; font-weight:bold;">Total: $ {{ number_format($total, 2) }}</div>
</body>
</html>

