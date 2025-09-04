<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventario</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-gray-50">
<div class="max-w-5xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold">Inventario</h1>
        <a href="{{ url('/kardex') }}" class="text-blue-600 hover:underline">Ver Kardex</a>
    </div>

    @if (session('status'))
        <div class="mb-4 p-3 rounded bg-green-50 text-green-700 text-sm">{{ session('status') }}</div>
    @endif
    @if ($errors->any())
        <div class="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{{ $errors->first() }}</div>
    @endif

    @if ($canManage)
        <div class="mb-6 p-4 bg-white border rounded">
            <h2 class="font-medium mb-3">Conversión Masa → Totopos</h2>
            <form method="POST" action="{{ url('/inventario/conversion') }}" class="flex items-end gap-2">
                @csrf
                <div>
                    <label class="block text-sm text-gray-600">Cantidad</label>
                    <input type="number" name="quantity" min="1" required class="border rounded px-2 py-1">
                </div>
                <div class="flex-1">
                    <label class="block text-sm text-gray-600">Descripción (opcional)</label>
                    <input type="text" name="description" class="border rounded px-2 py-1 w-full">
                </div>
                <button class="bg-indigo-600 text-white px-4 py-2 rounded">Convertir</button>
            </form>
        </div>
    @endif

    <div class="overflow-x-auto bg-white border rounded">
        <table class="min-w-full">
            <thead>
            <tr class="bg-gray-100 text-left text-sm text-gray-700">
                <th class="px-4 py-2">Producto</th>
                <th class="px-4 py-2">Stock</th>
                <th class="px-4 py-2">Stock mínimo</th>
                @if ($canManage)
                    <th class="px-4 py-2">Acciones</th>
                @endif
            </tr>
            </thead>
            <tbody>
            @foreach ($inventories as $inv)
                @php $isLow = $inv->quantity <= $inv->min_stock; @endphp
                <tr class="border-t">
                    <td class="px-4 py-2">{{ $inv->product->name }}</td>
                    <td class="px-4 py-2 {{ $isLow ? 'text-red-600 font-semibold' : '' }}">{{ $inv->quantity }}</td>
                    <td class="px-4 py-2">{{ $inv->min_stock }}</td>
                    @if ($canManage)
                        <td class="px-4 py-2">
                            <div class="flex flex-wrap gap-2">
                                <form method="POST" action="{{ url('/inventario/entrada') }}" class="flex items-center gap-1">
                                    @csrf
                                    <input type="hidden" name="product_id" value="{{ $inv->product->id }}">
                                    <input type="number" name="quantity" min="1" placeholder="Entrada" class="w-24 border rounded px-2 py-1">
                                    <button class="bg-green-600 text-white px-3 py-1 rounded">Entrada</button>
                                </form>
                                <form method="POST" action="{{ url('/inventario/salida') }}" class="flex items-center gap-1">
                                    @csrf
                                    <input type="hidden" name="product_id" value="{{ $inv->product->id }}">
                                    <input type="number" name="quantity" min="1" placeholder="Salida" class="w-24 border rounded px-2 py-1">
                                    <button class="bg-red-600 text-white px-3 py-1 rounded">Salida</button>
                                </form>
                                <form method="POST" action="{{ url('/inventario/min-stock') }}" class="flex items-center gap-1">
                                    @csrf
                                    <input type="hidden" name="product_id" value="{{ $inv->product->id }}">
                                    <input type="number" name="min_stock" min="0" value="{{ $inv->min_stock }}" class="w-24 border rounded px-2 py-1">
                                    <button class="bg-blue-600 text-white px-3 py-1 rounded">Actualizar mínimo</button>
                                </form>
                            </div>
                        </td>
                    @endif
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
    <p class="text-xs text-gray-500 mt-2">Los elementos en rojo están en o por debajo del stock mínimo.</p>
</div>
</body>
</html>

