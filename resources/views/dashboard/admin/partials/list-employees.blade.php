<div class="section-panel mb-4 d-none" id="collapseListEmployees" data-section="employees">
    <div class="card shadow-sm">
        <div class="card-body">
            <h2 class="h5 fw-semibold mb-3">Lista de empleados</h2>
            @if ($employees->isEmpty())
                <p class="text-muted mb-0">Todavía no hay empleados registrados.</p>
            @else
                <div class="list-group">
                    @foreach ($employees as $employee)
                        @php
                            $employeeOld = ($oldContext ?? null) === 'employee-update-' . $employee->id;
                            $salaryValue = $employee->salary !== null ? number_format($employee->salary, 2, '.', '') : '';
                            $currentUserEmail = optional($employee->user)->email;
                            $currentRoleId = optional($employee->user)->role_id;
                        @endphp
                        <div class="list-group-item" id="employee-card-{{ $employee->id }}">
                            <button class="btn btn-link w-100 text-start d-flex justify-content-between align-items-center detail-toggle"
                                    type="button"
                                    data-detail-target="employee-detail-{{ $employee->id }}">
                                <span class="fw-semibold">{{ $employee->full_name }}</span>
                                <span class="small text-muted">{{ $employee->position ?? 'Sin puesto asignado' }}</span>
                            </button>

                            <div class="detail-panel d-none mt-3" id="employee-detail-{{ $employee->id }}">
                                <form method="POST" action="{{ route('admin.employees.update', $employee) }}" class="row g-3">
                                    @csrf
                                    @method('PUT')
                                    <input type="hidden" name="_context" value="employee-update-{{ $employee->id }}">
                                    <div class="col-md-6">
                                        <label class="form-label">Nombre completo *</label>
                                        <input type="text" name="full_name" class="form-control" value="{{ $employeeOld ? old('full_name') : $employee->full_name }}" required>
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Teléfono</label>
                                        <input type="text" name="phone" class="form-control" value="{{ $employeeOld ? old('phone') : $employee->phone }}">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Correo</label>
                                        <input type="email" name="email" class="form-control" value="{{ $employeeOld ? old('email') : $employee->email }}">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Fecha de nacimiento</label>
                                        <input type="date" name="birth_date" class="form-control" value="{{ $employeeOld ? old('birth_date') : optional($employee->birth_date)->format('Y-m-d') }}">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Puesto</label>
                                        <input type="text" name="position" class="form-control" value="{{ $employeeOld ? old('position') : $employee->position }}">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Salario mensual</label>
                                        <input type="number" step="0.01" min="0" name="salary" class="form-control" value="{{ $employeeOld ? old('salary') : $salaryValue }}">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Dirección</label>
                                        <input type="text" name="address" class="form-control" value="{{ $employeeOld ? old('address') : $employee->address }}">
                                    </div>
                                    <div class="col-12">
                                        <label class="form-label">Notas</label>
                                        <textarea name="notes" class="form-control" rows="2">{{ $employeeOld ? old('notes') : $employee->notes }}</textarea>
                                    </div>

                                    <div class="col-12">
                                        <hr class="my-3">
                                        <h3 class="h6 fw-semibold">Acceso al sistema</h3>
                                        <p class="text-muted mb-2">Deja el correo vacío para quitar el acceso. Si solo deseas mantenerlo, no cambies la contraseña.</p>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Correo de acceso</label>
                                        <input type="email" name="user_email" class="form-control" value="{{ $employeeOld ? old('user_email') : $currentUserEmail }}">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Contraseña nueva</label>
                                        <input type="password" name="user_password" class="form-control">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Rol</label>
                                        @php
                                            $selectedRole = $employeeOld ? old('user_role') : $currentRoleId;
                                        @endphp
                                        <select name="user_role" class="form-select">
                                            <option value="">Seleccione un rol</option>
                                            @foreach ($roles as $role)
                                                <option value="{{ $role->id }}" {{ (string) $selectedRole === (string) $role->id ? 'selected' : '' }}>
                                                    {{ $role->name }}
                                                </option>
                                            @endforeach
                                        </select>
                                    </div>
                                    <div class="col-12">
                                        <button type="submit" class="btn btn-primary">Guardar cambios</button>
                                    </div>
                                </form>
                                <form method="POST" action="{{ route('admin.employees.destroy', $employee) }}" class="mt-2" onsubmit="return confirm('¿Seguro que deseas eliminar este empleado?')">
                                    @csrf
                                    @method('DELETE')
                                    <input type="hidden" name="_context" value="employee-update-{{ $employee->id }}">
                                    <button type="submit" class="btn btn-danger">Eliminar empleado</button>
                                </form>
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</div>
