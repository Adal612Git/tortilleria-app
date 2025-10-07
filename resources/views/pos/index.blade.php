@extends('layouts.app')

@section('title', 'POS')

@section('content')
<div class="max-w-5xl mx-auto py-10 px-4">
    <h1 class="text-3xl font-bold mb-6">Punto de Venta</h1>

    @if (session('status'))
        <div class="alert-success mb-4">{{ session('status') }}</div>
    @endif

    @if ($errors->any())
        <div class="alert-error mb-4">{{ $errors->first() }}</div>
    @endif

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
        @foreach ($productos as $producto)
            <button type="button"
                    class="pos-product-card border rounded-lg bg-white shadow-sm p-4 text-center hover:shadow transition"
                    data-id="{{ $producto->id }}"
                    data-name="{{ $producto->name }}"
                    data-price="{{ number_format($producto->price, 2, '.', '') }}">
                <div class="text-lg font-semibold">{{ $producto->name }}</div>
                <div class="text-sm text-gray-500">$ {{ number_format($producto->price, 2) }} por unidad</div>
                <div class="mt-2 text-xs text-blue-500">Clic para agregar</div>
            </button>
        @endforeach
    </div>

    <div class="bg-white border rounded-lg shadow-sm p-4" id="order-summary" hidden>
        <h2 class="text-lg font-semibold mb-3">Orden actual</h2>
        <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
                <thead>
                    <tr class="text-left bg-gray-100 text-gray-700">
                        <th class="px-2 py-1">Producto</th>
                        <th class="px-2 py-1 text-center">Cantidad</th>
                        <th class="px-2 py-1 text-right">Precio</th>
                        <th class="px-2 py-1 text-right">Subtotal</th>
                    </tr>
                </thead>
                <tbody id="order-items"></tbody>
            </table>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-3">
            <div class="text-lg font-semibold">Total: $ <span id="order-total">0.00</span></div>
            <div class="flex gap-2">
                <button type="button" id="clear-order" class="btn btn-outline-secondary">Limpiar</button>
                <form id="order-form" method="POST" action="{{ route('ventas.batch') }}">
                    @csrf
                    <button type="submit" class="btn btn-success">Cobrar</button>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        const order = new Map();
        const orderSummary = document.getElementById('order-summary');
        const orderItems = document.getElementById('order-items');
        const orderTotal = document.getElementById('order-total');
        const orderForm = document.getElementById('order-form');
        const clearButton = document.getElementById('clear-order');

        const render = () => {
            orderItems.innerHTML = '';
            let total = 0;

            order.forEach((item, id) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-2 py-1">${item.name}</td>
                    <td class="px-2 py-1 text-center">
                        <button type="button" class="text-red-600 font-bold" data-action="decrement" data-id="${id}">−</button>
                        <span class="mx-2">${item.quantity}</span>
                        <button type="button" class="text-green-600 font-bold" data-action="increment" data-id="${id}">+</button>
                    </td>
                    <td class="px-2 py-1 text-right">$ ${item.price.toFixed(2)}</td>
                    <td class="px-2 py-1 text-right">$ ${(item.price * item.quantity).toFixed(2)}</td>`;
                orderItems.appendChild(row);
                total += item.price * item.quantity;
            });

            orderTotal.textContent = total.toFixed(2);
            orderSummary.hidden = order.size === 0;
        };

        document.querySelectorAll('.pos-product-card').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.dataset.id;
                const name = button.dataset.name;
                const price = parseFloat(button.dataset.price);

                if (order.has(id)) {
                    order.get(id).quantity += 1;
                } else {
                    order.set(id, { name, price, quantity: 1 });
                }

                render();
            });
        });

        orderItems.addEventListener('click', (event) => {
            const action = event.target.dataset.action;
            const id = event.target.dataset.id;
            if (!action || !order.has(id)) {
                return;
            }

            if (action === 'increment') {
                order.get(id).quantity += 1;
            } else if (action === 'decrement') {
                const item = order.get(id);
                item.quantity -= 1;
                if (item.quantity <= 0) {
                    order.delete(id);
                }
            }

            render();
        });

        clearButton.addEventListener('click', () => {
            order.clear();
            render();
        });

        orderForm.addEventListener('submit', (event) => {
            if (order.size === 0) {
                event.preventDefault();
                alert('Agrega productos antes de cobrar.');
                return;
            }

            orderForm.querySelectorAll('input[name^="items"]').forEach(input => input.remove());

            let index = 0;
            order.forEach((item, id) => {
                const productInput = document.createElement('input');
                productInput.type = 'hidden';
                productInput.name = `items[${index}][product_id]`;
                productInput.value = id;

                const quantityInput = document.createElement('input');
                quantityInput.type = 'hidden';
                quantityInput.name = `items[${index}][quantity]`;
                quantityInput.value = item.quantity;

                orderForm.appendChild(productInput);
                orderForm.appendChild(quantityInput);

                index += 1;
            });
        });
    });
</script>
@endsection
