<div class="section-panel mb-4 d-none" id="collapseListSuppliers" data-section="suppliers">
    <div class="card shadow-sm">
        <div class="card-body">
            <h2 class="h5 fw-semibold mb-3">Lista de proveedores</h2>
            @if ($suppliers->isEmpty())
                <p class="text-muted mb-0">Todavía no hay proveedores registrados.</p>
            @else
                <div class="list-group">
                    @foreach ($suppliers as $supplier)
                        @php
                            $supplierOld = ($oldContext ?? null) === 'supplier-update-' . $supplier->id;
                        @endphp
                        <div class="list-group-item" id="supplier-card-{{ $supplier->id }}">
                            <button class="btn btn-link w-100 text-start d-flex justify-content-between align-items-center detail-toggle"
                                    type="button"
                                    data-detail-target="supplier-detail-{{ $supplier->id }}">
                                <span class="fw-semibold">{{ $supplier->name }}</span>
                                <span class="small text-muted">{{ $supplier->contact_name ?? 'Sin contacto' }}</span>
                            </button>

                            <div class="detail-panel d-none mt-3" id="supplier-detail-{{ $supplier->id }}">
                                <form method="POST" action="{{ route('admin.suppliers.update', $supplier) }}" class="row g-3">
                                    @csrf
                                    @method('PUT')
                                    <input type="hidden" name="_context" value="supplier-update-{{ $supplier->id }}">
                                    <div class="col-md-6">
                                        <label class="form-label">Nombre *</label>
                                        <input type="text" name="name" class="form-control" value="{{ $supplierOld ? old('name') : $supplier->name }}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Persona de contacto</label>
                                        <input type="text" name="contact_name" class="form-control" value="{{ $supplierOld ? old('contact_name') : $supplier->contact_name }}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Teléfono</label>
                                        <input type="text" name="phone" class="form-control" value="{{ $supplierOld ? old('phone') : $supplier->phone }}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Correo</label>
                                        <input type="email" name="email" class="form-control" value="{{ $supplierOld ? old('email') : $supplier->email }}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Dirección</label>
                                        <input type="text" name="address" class="form-control" value="{{ $supplierOld ? old('address') : $supplier->address }}">
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Notas</label>
                                        <textarea name="notes" class="form-control" rows="2">{{ $supplierOld ? old('notes') : $supplier->notes }}</textarea>
                                    </div>
                                    <div class="col-12">
                                        <button type="submit" class="btn btn-primary">Guardar cambios</button>
                                    </div>
                                </form>
                                <form method="POST" action="{{ route('admin.suppliers.destroy', $supplier) }}" class="mt-2" onsubmit="return confirm('¿Seguro que deseas eliminar este proveedor?')">
                                    @csrf
                                    @method('DELETE')
                                    <input type="hidden" name="_context" value="supplier-update-{{ $supplier->id }}">
                                    <button type="submit" class="btn btn-danger">Eliminar proveedor</button>
                                </form>
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</div>
