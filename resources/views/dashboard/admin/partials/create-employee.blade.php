@php
    $isActive = ($oldContext ?? null) === 'employee-create';
@endphp

<div class="section-panel mb-4 d-none" id="collapseAddEmployee" data-section="employees">
    <div class="card shadow-sm">
        <div class="card-body">
            <h2 class="h5 fw-semibold mb-3">Registrar nuevo empleado</h2>
            <form method="POST" action="{{ route('admin.employees.store') }}" class="row g-3">
                @csrf
                <input type="hidden" name="_context" value="employee-create">
                <div class="col-md-6">
                    <label class="form-label">Nombre completo *</label>
                    <input type="text" name="full_name" class="form-control" value="{{ $isActive ? old('full_name') : '' }}" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Teléfono</label>
                    <input type="text" name="phone" class="form-control" value="{{ $isActive ? old('phone') : '' }}">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Correo</label>
                    <input type="email" name="email" class="form-control" value="{{ $isActive ? old('email') : '' }}">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Fecha de nacimiento</label>
                    <input type="date" name="birth_date" class="form-control" value="{{ $isActive ? old('birth_date') : '' }}">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Puesto</label>
                    <input type="text" name="position" class="form-control" value="{{ $isActive ? old('position') : '' }}">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Salario mensual</label>
                    <input type="number" step="0.01" min="0" name="salary" class="form-control" value="{{ $isActive ? old('salary') : '' }}">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Dirección</label>
                    <input type="text" name="address" class="form-control" value="{{ $isActive ? old('address') : '' }}">
                </div>
                <div class="col-12">
                    <label class="form-label">Notas</label>
                    <textarea name="notes" class="form-control" rows="2">{{ $isActive ? old('notes') : '' }}</textarea>
                </div>

                <div class="col-12">
                    <hr class="my-3">
                    <h3 class="h6 fw-semibold">Acceso al sistema (opcional)</h3>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Correo de acceso</label>
                    <input type="email" name="user_email" class="form-control" value="{{ $isActive ? old('user_email') : '' }}">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Contraseña temporal</label>
                    <input type="password" name="user_password" class="form-control">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Rol</label>
                    <select name="user_role" class="form-select">
                        <option value="">Seleccione un rol</option>
                        @foreach ($roles as $role)
                            <option value="{{ $role->id }}" {{ $isActive && (string) old('user_role') === (string) $role->id ? 'selected' : '' }}>
                                {{ $role->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-success">Guardar empleado</button>
                </div>
            </form>
        </div>
    </div>
</div>
