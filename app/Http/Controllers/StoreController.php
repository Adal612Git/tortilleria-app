<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);
        $store = Store::create($data);

        return redirect()
            ->route('admin.dashboard')
            ->with('status', 'Tienda agregada correctamente.')
            ->with('admin_section', 'stores')
            ->with('admin_focus_id', 'store-' . $store->id);
    }

    public function update(Request $request, Store $store): RedirectResponse
    {
        $data = $this->validatedData($request);
        $store->update($data);

        return redirect()
            ->route('admin.dashboard')
            ->with('status', 'Tienda actualizada.')
            ->with('admin_section', 'stores')
            ->with('admin_focus_id', 'store-' . $store->id);
    }

    public function destroy(Store $store): RedirectResponse
    {
        $store->delete();

        return redirect()
            ->route('admin.dashboard')
            ->with('status', 'Tienda eliminada.')
            ->with('admin_section', 'stores');
    }

    private function validatedData(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'manager_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
