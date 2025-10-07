<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);
        $supplier = Supplier::create($data);

        return redirect()
            ->route('admin.dashboard')
            ->with('status', 'Proveedor agregado correctamente.')
            ->with('admin_section', 'suppliers')
            ->with('admin_focus_id', 'supplier-' . $supplier->id);
    }

    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        $data = $this->validatedData($request);
        $supplier->update($data);

        return redirect()
            ->route('admin.dashboard')
            ->with('status', 'Proveedor actualizado.')
            ->with('admin_section', 'suppliers')
            ->with('admin_focus_id', 'supplier-' . $supplier->id);
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        return redirect()
            ->route('admin.dashboard')
            ->with('status', 'Proveedor eliminado.')
            ->with('admin_section', 'suppliers');
    }

    private function validatedData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
