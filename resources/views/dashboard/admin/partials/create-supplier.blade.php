@php
    $isActive = ($oldContext ?? null) === 'supplier-create';
@endphp

<div class="section-panel mb-4 d-none" id="collapseAddSupplier" data-section="suppliers">
    <div class="card shadow-sm">
        <div class="card-body">
            <h2 class="h5 fw-semibold mb-3">Registrar nuevo proveedor</h2>
            <form method="POST" action="{{ route('admin.suppliers.store') }}" class="row g-3">
                @csrf
                <input type="hidden" name="_context" value="supplier-create">
                <div class="col-md-6">
                    <label class="form-label">Nombre del proveedor *</label>
                    <input type="text" name="name" class="form-control" value="{{ $isActive ? old('name') : '' }}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Persona de contacto</label>
                    <input type="text" name="contact_name" class="form-control" value="{{ $isActive ? old('contact_name') : '' }}">
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
                    <button type="submit" class="btn btn-success">Guardar proveedor</button>
                </div>
            </form>
        </div>
    </div>
</div>
