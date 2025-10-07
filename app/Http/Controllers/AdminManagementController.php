<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Role;
use App\Models\Store;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AdminManagementController extends Controller
{
    public function index(Request $request)
    {
        $employees = Employee::with('user')->orderBy('full_name')->get();
        $stores = Store::orderBy('name')->get();
        $suppliers = Supplier::orderBy('name')->get();
        $roles = Role::orderBy('name')->get();

        $openSection = session()->pull('admin_section', $request->query('section'));
        $focusId = session()->pull('admin_focus_id');
        $oldContext = $request->old('_context');

        [$collapseTargets, $detailTargets, $focusId] = $this->resolveUiTargets(
            $oldContext,
            $openSection,
            $focusId
        );

        Log::info('AdminManagementController@index accessed', [
            'user_id' => optional($request->user())->id,
            'user_role' => optional(optional($request->user())->role)->name,
            'employees_count' => $employees->count(),
            'stores_count' => $stores->count(),
            'suppliers_count' => $suppliers->count(),
        ]);

        return view('dashboard.admin', [
            'employees' => $employees,
            'stores' => $stores,
            'suppliers' => $suppliers,
            'openSection' => $openSection,
            'focusId' => $focusId,
            'collapseTargets' => $collapseTargets,
            'detailTargets' => $detailTargets,
            'oldContext' => $oldContext,
            'roles' => $roles,
        ]);
    }

    private function resolveUiTargets(?string $context, ?string $openSection, ?string $focusId): array
    {
        $collapseTargets = [];
        $detailTargets = [];

        if ($context) {
            if (Str::startsWith($context, 'employee-create')) {
                $collapseTargets[] = 'collapseAddEmployee';
            }
            if (Str::startsWith($context, 'employee-update-')) {
                $collapseTargets[] = 'collapseListEmployees';
                $id = (int) Str::after($context, 'employee-update-');
                if ($id) {
                    $detailTargets[] = 'employee-detail-' . $id;
                    $focusId = $focusId ?: 'employee-detail-' . $id;
                }
            }
            if (Str::startsWith($context, 'store-create')) {
                $collapseTargets[] = 'collapseAddStore';
            }
            if (Str::startsWith($context, 'store-update-')) {
                $collapseTargets[] = 'collapseListStores';
                $id = (int) Str::after($context, 'store-update-');
                if ($id) {
                    $detailTargets[] = 'store-detail-' . $id;
                    $focusId = $focusId ?: 'store-detail-' . $id;
                }
            }
            if (Str::startsWith($context, 'supplier-create')) {
                $collapseTargets[] = 'collapseAddSupplier';
            }
            if (Str::startsWith($context, 'supplier-update-')) {
                $collapseTargets[] = 'collapseListSuppliers';
                $id = (int) Str::after($context, 'supplier-update-');
                if ($id) {
                    $detailTargets[] = 'supplier-detail-' . $id;
                    $focusId = $focusId ?: 'supplier-detail-' . $id;
                }
            }
        }

        if ($openSection) {
            $map = [
                'employees' => 'collapseListEmployees',
                'stores' => 'collapseListStores',
                'suppliers' => 'collapseListSuppliers',
            ];
            if (isset($map[$openSection])) {
                $collapseTargets[] = $map[$openSection];
            }
        }

        return [
            array_values(array_unique($collapseTargets)),
            array_values(array_unique($detailTargets)),
            $focusId,
        ];
    }
}
