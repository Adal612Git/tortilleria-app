@php
    $isActive = ($oldContext ?? null) === 'store-create';
@endphp

<div class="section-panel mb-4 d-none" id="collapseAddStore" data-section="stores">
    <div class="card shadow-sm">
        <div class="card-body">
            <h2 class="h5 fw-semibold mb-3">Registrar nueva tienda</h2>
            <form method="POST" action="{{ route('admin.stores.store') }}" class="row g-3">
                @csrf
                <input type="hidden" name="_context" value="store-create">
                <div class="col-md-6">
                    <label class="form-label">Nombre de la tienda *</label>
                    <input type="text" name="name" class="form-control" value="{{ $isActive ? old('name') : '' }}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Encargado</label>
                    <input type="text" name="manager_name" class="form-control" value="{{ $isActive ? old('manager_name') : '' }}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Teléfono</label>
                    <input type="text" name="phone" class="form-control" value="{{ $isActive ? old('phone') : '' }}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Correo</label>
                    <input type="email" name="email" class="form-control" value="{{ $isActive ? old('email') : '' }}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Dirección</label>
                    <input type="text" name="address" class="form-control" value="{{ $isActive ? old('address') : '' }}">
                </div>
                <div class="col-12">
                    <label class="form-label">Notas</label>
                    <textarea name="notes" class="form-control" rows="2">{{ $isActive ? old('notes') : '' }}</textarea>
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-success">Guardar tienda</button>
                </div>
            </form>
        </div>
    </div>
</div>
