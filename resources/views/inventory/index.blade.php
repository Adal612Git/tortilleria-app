@extends('layouts.app')

@section('title', 'Inventario')

@section('content')
<div class="max-w-5xl mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold">Inventario</h1>
        <a href="{{ url('/kardex') }}" class="text-blue-600 hover:underline">Ver Kardex</a>
    </div>

    @if (session('status'))
        <div class="alert-success mb-4">{{ session('status') }}</div>
    @endif

    @if ($errors->any())
        <div class="alert-error mb-4">{{ $errors->first() }}</div>
    @endif

    <div class="space-y-4">
        @foreach ($inventories as $inv)
            <div class="border rounded-lg bg-white shadow-sm p-4 inventory-item"
                 data-entry-url="{{ url('/inventario/entrada') }}"
                 data-exit-url="{{ url('/inventario/salida') }}"
                 data-delete-url="{{ route('inventario.products.destroy', $inv->product) }}"
                 data-product-id="{{ $inv->product->id }}">
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h2 class="text-xl font-semibold">{{ $inv->product->name }}</h2>
                        <p class="text-gray-600">Stock disponible: <strong>{{ $inv->quantity }}</strong> unidades</p>
                        <p class="text-gray-600">Precio actual: <strong>$ {{ number_format($inv->product->price, 2) }}</strong></p>
                    </div>

                    @if ($canManage)
                        <div class="flex items-stretch gap-3">
                            <div class="flex flex-col gap-2">
                                <button type="button" class="btn btn-primary inventory-adjust" data-action="entrada">Agregar</button>
                                <button type="button" class="btn btn-warning inventory-adjust" data-action="salida">Retirar</button>
                            </div>
                            <button type="button" class="btn btn-danger inventory-delete">Eliminar</button>
                        </div>
                    @endif
                </div>
            </div>
        @endforeach
    </div>
</div>

@if ($canManage)
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

            const submitForm = (url, fields) => {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = url;
                const inputs = [`<input type="hidden" name="_token" value="${csrfToken}">`].concat(fields);
                form.innerHTML = inputs.join('');
                document.body.appendChild(form);
                form.submit();
            };

            document.querySelectorAll('.inventory-item').forEach(card => {
                const productId = card.dataset.productId;
                const entryUrl = card.dataset.entryUrl;
                const exitUrl = card.dataset.exitUrl;
                const deleteUrl = card.dataset.deleteUrl;

                card.querySelectorAll('.inventory-adjust').forEach(button => {
                    button.addEventListener('click', () => {
                        const action = button.dataset.action;
                        const verb = action === 'entrada' ? 'agregar' : 'retirar';
                        const value = prompt(`¿Cuántas unidades deseas ${verb}?`);
                        if (value === null) {
                            return;
                        }

                        const quantity = parseInt(value, 10);
                        if (!Number.isInteger(quantity) || quantity <= 0) {
                            alert('Ingresa una cantidad válida.');
                            return;
                        }

                        submitForm(action === 'entrada' ? entryUrl : exitUrl, [
                            `<input type="hidden" name="product_id" value="${productId}">`,
                            `<input type="hidden" name="quantity" value="${quantity}">`
                        ]);
                    });
                });

                const deleteButton = card.querySelector('.inventory-delete');
                if (deleteButton) {
                    deleteButton.addEventListener('click', () => {
                        if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) {
                            return;
                        }

                        submitForm(deleteUrl, [
                            '<input type="hidden" name="_method" value="DELETE">'
                        ]);
                    });
                }
            });
        });
    </script>
@endif
@endsection
