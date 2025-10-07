<div class="section-panel mb-4 d-none" id="collapseListStores" data-section="stores">
    <div class="card shadow-sm">
        <div class="card-body">
            <h2 class="h5 fw-semibold mb-3">Lista de tiendas</h2>
            @if ($stores->isEmpty())
                <p class="text-muted mb-0">Todavía no hay tiendas registradas.</p>
            @else
                <div class="list-group">
                    @foreach ($stores as $store)
                        @php
                            $storeOld = ($oldContext ?? null) === 'store-update-' . $store->id;
                        @endphp
                        <div class="list-group-item" id="store-card-{{ $store->id }}">
                            <button class="btn btn-link w-100 text-start d-flex justify-content-between align-items-center detail-toggle"
                                    type="button"
                                    data-detail-target="store-detail-{{ $store->id }}">
                                <span class="fw-semibold">{{ $store->name }}</span>
                                <span class="small text-muted">{{ $store->manager_name ?? 'Sin encargado' }}</span>
                            </button>

                            <div class="detail-panel d-none mt-3" id="store-detail-{{ $store->id }}">
                                <form method="POST" action="{{ route('admin.stores.update', $store) }}" class="row g-3">
                                    @csrf
                                    @method('PUT')
                                    <input type="hidden" name="_context" value="store-update-{{ $store->id }}">
                                    <div class="col-md-6">
                                        <label class="form-label">Nombre *</label>
                                        <input type="text" name="name" class="form-control" value="{{ $storeOld ? old('name') : $store->name }}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Encargado</label>
                                        <input type="text" name="manager_name" class="form-control" value="{{ $storeOld ? old('manager_name') : $store->manager_name }}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Teléfono</label>
                                        <input type="text" name="phone" class="form-control" value="{{ $storeOld ? old('phone') : $store->phone }}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Correo</label>
                                        <input type="email" name="email" class="form-control" value="{{ $storeOld ? old('email') : $store->email }}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Dirección</label>
                                        <input type="text" name="address" class="form-control" value="{{ $storeOld ? old('address') : $store->address }}">
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Notas</label>
                                        <textarea name="notes" class="form-control" rows="2">{{ $storeOld ? old('notes') : $store->notes }}</textarea>
                                    </div>
                                    <div class="col-12">
                                        <button type="submit" class="btn btn-primary">Guardar cambios</button>
                                    </div>
                                </form>
                                <form method="POST" action="{{ route('admin.stores.destroy', $store) }}" class="mt-2" onsubmit="return confirm('¿Seguro que deseas eliminar esta tienda?')">
                                    @csrf
                                    @method('DELETE')
                                    <input type="hidden" name="_context" value="store-update-{{ $store->id }}">
                                    <button type="submit" class="btn btn-danger">Eliminar tienda</button>
                                </form>
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</div>
