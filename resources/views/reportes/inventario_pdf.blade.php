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
    <title>Inventario</title>
</head>
<body>
    <div class="title">Inventario Actual</div>
    <table class="table">
        <thead>
            <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Stock mínimo</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($inventario as $i)
                <tr>
                    <td>{{ $i->product->name }}</td>
                    <td>{{ $i->quantity }}</td>
                    <td>{{ $i->min_stock }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>

