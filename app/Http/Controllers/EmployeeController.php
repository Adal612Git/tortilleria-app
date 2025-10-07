<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        [$employeeData, $userData] = $this->validateRequest($request);

        $user = null;
        if (!empty($userData['email'])) {
            $user = User::create([
                'name' => $employeeData['full_name'],
                'email' => $userData['email'],
                'password' => Hash::make($userData['password']),
                'role_id' => $userData['role_id'],
            ]);
            $employeeData['user_id'] = $user->id;
        }

        $employee = Employee::create($employeeData);

        return redirect()
            ->route('admin.dashboard')
            ->with('status', 'Empleado agregado correctamente.')
            ->with('admin_section', 'employees')
            ->with('admin_focus_id', 'employee-' . $employee->id);
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        [$employeeData, $userData] = $this->validateRequest($request, $employee);

        $user = $employee->user;

        if (!empty($userData['email'])) {
            if ($user) {
                $user->email = $userData['email'];
                $user->name = $employeeData['full_name'];
                if (!empty($userData['role_id'])) {
                    $user->role_id = $userData['role_id'];
                }
                if (!empty($userData['password'])) {
                    $user->password = Hash::make($userData['password']);
                }
                $user->save();
            } else {
                $user = User::create([
                    'name' => $employeeData['full_name'],
                    'email' => $userData['email'],
                    'password' => Hash::make($userData['password']),
                    'role_id' => $userData['role_id'],
                ]);
            }

            $employeeData['user_id'] = $user->id;
        } else {
            if ($user) {
                $user->delete();
            }
            $employeeData['user_id'] = null;
        }

        $employee->update($employeeData);

        return redirect()
            ->route('admin.dashboard')
            ->with('status', 'Empleado actualizado.')
            ->with('admin_section', 'employees')
            ->with('admin_focus_id', 'employee-' . $employee->id);
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        if ($employee->user) {
            $employee->user->delete();
        }

        $employee->delete();

        return redirect()
            ->route('admin.dashboard')
            ->with('status', 'Empleado eliminado.')
            ->with('admin_section', 'employees');
    }

    private function validateRequest(Request $request, ?Employee $employee = null): array
    {
        $hasUser = $employee && $employee->user;
        $ignoreUserId = $employee?->user?->id;

        $rules = [
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'birth_date' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:100'],
            'salary' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'user_email' => ['nullable', 'email', Rule::unique('users', 'email')->ignore($ignoreUserId)],
            'user_password' => [$hasUser ? 'nullable' : 'required_with:user_email', 'string', 'min:6'],
            'user_role' => [$hasUser ? 'nullable' : 'required_with:user_email', 'integer', Rule::exists('roles', 'id')],
        ];

        $validated = $request->validate($rules);

        $employeeData = Arr::only($validated, [
            'full_name',
            'phone',
            'email',
            'birth_date',
            'address',
            'position',
            'salary',
            'notes',
        ]);

        $userData = [
            'email' => $validated['user_email'] ?? null,
            'password' => $validated['user_password'] ?? null,
            'role_id' => $validated['user_role'] ?? null,
        ];

        return [$employeeData, $userData];
    }
}
