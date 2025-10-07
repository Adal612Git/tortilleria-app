@extends('layouts.app')

@section('title', 'Dashboard Admin')

@section('content')
    <style>
        .focus-highlight {
            animation: focusFade 2.2s ease;
            box-shadow: 0 0 0 0.35rem rgba(13, 110, 253, 0.35);
            border-radius: 0.5rem;
        }

        @keyframes focusFade {
            0% { box-shadow: 0 0 0 0.5rem rgba(13, 110, 253, 0.45); }
            100% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0); }
        }

        .section-toggle {
            position: relative;
            padding-right: 2.5rem;
        }

        .section-toggle::after {
            content: "▾";
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            transition: transform 0.2s ease;
        }

        .section-toggle.open::after {
            transform: translateY(-50%) rotate(180deg);
        }

        .detail-toggle {
            position: relative;
            padding-right: 2.5rem;
        }

        .detail-toggle::after {
            content: "▸";
            position: absolute;
            right: 0.5rem;
            top: 50%;
            transform: translateY(-50%);
            transition: transform 0.2s ease;
        }

        .detail-toggle.open::after {
            transform: translateY(-50%) rotate(90deg);
        }
    </style>

    @php
        $sessionUser = auth()->user();
        $sessionRole = optional($sessionUser->role)->name ?? 'Sin rol';
    @endphp

    <div class="container py-4">
        <h1 class="mb-4 fw-semibold text-white">Panel de administración</h1>

        @if (session('status'))
            <div class="alert alert-success">{{ session('status') }}</div>
        @endif

        @if ($errors->any())
            <div class="alert alert-danger">
                <ul class="mb-0">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <div class="row g-2 mb-4">
            <div class="col-12 col-sm-6 col-lg-4">
                <button class="btn btn-primary w-100 section-toggle" type="button" data-section-target="collapseAddEmployee">Agregar Empleado</button>
            </div>
            <div class="col-12 col-sm-6 col-lg-4">
                <button class="btn btn-primary w-100 section-toggle" type="button" data-section-target="collapseAddStore">Agregar Tienda</button>
            </div>
            <div class="col-12 col-sm-6 col-lg-4">
                <button class="btn btn-primary w-100 section-toggle" type="button" data-section-target="collapseAddSupplier">Agregar Proveedor</button>
            </div>
            <div class="col-12 col-sm-6 col-lg-4">
                <button class="btn btn-secondary w-100 section-toggle" type="button" data-section-target="collapseListEmployees">Lista de Empleados</button>
            </div>
            <div class="col-12 col-sm-6 col-lg-4">
                <button class="btn btn-secondary w-100 section-toggle" type="button" data-section-target="collapseListStores">Lista de Tiendas</button>
            </div>
            <div class="col-12 col-sm-6 col-lg-4">
                <button class="btn btn-secondary w-100 section-toggle" type="button" data-section-target="collapseListSuppliers">Lista de Proveedores</button>
            </div>
        </div>

        @include('dashboard.admin.partials.create-employee', [
            'oldContext' => $oldContext ?? null,
            'roles' => $roles,
        ])
        @include('dashboard.admin.partials.create-store', ['oldContext' => $oldContext ?? null])
        @include('dashboard.admin.partials.create-supplier', ['oldContext' => $oldContext ?? null])

        @include('dashboard.admin.partials.list-employees', [
            'employees' => $employees,
            'oldContext' => $oldContext ?? null,
            'roles' => $roles,
        ])
        @include('dashboard.admin.partials.list-stores', ['stores' => $stores, 'oldContext' => $oldContext ?? null])
        @include('dashboard.admin.partials.list-suppliers', ['suppliers' => $suppliers, 'oldContext' => $oldContext ?? null])
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const collapseTargets = @json($collapseTargets);
            const detailTargets = @json($detailTargets);
            const focusId = @json($focusId);

            const sections = document.querySelectorAll('.section-panel');
            const sectionMap = new Map();
            sections.forEach((section) => {
                if (section.id) {
                    section.classList.remove('collapse', 'show');
                    section.classList.add('d-none');
                    sectionMap.set(section.id, section);
                }
            });

            const setSectionButtonState = (id, isOpen) => {
                document.querySelectorAll(`.section-toggle[data-section-target="${id}"]`).forEach((btn) => {
                    if (isOpen) {
                        btn.classList.add('open');
                    } else {
                        btn.classList.remove('open');
                    }
                });
            };

            const hideSection = (id) => {
                const section = sectionMap.get(id);
                if (!section) {
                    return;
                }
                section.classList.add('d-none');
                setSectionButtonState(id, false);
            };

            const showSection = (id, { scroll = false } = {}) => {
                const section = sectionMap.get(id);
                if (!section) {
                    console.warn('[AdminPanel] Panel no encontrado', id);
                    return;
                }
                if (section.classList.contains('d-none')) {
                    section.classList.remove('d-none');
                    if (scroll) {
                        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
                setSectionButtonState(id, true);
            };

            document.querySelectorAll('.section-toggle').forEach((button) => {
                const targetId = button.getAttribute('data-section-target');
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const section = sectionMap.get(targetId);
                    if (!section) {
                        return;
                    }
                    const shouldShow = section.classList.contains('d-none');
                    if (shouldShow) {
                        showSection(targetId, { scroll: true });
                    } else {
                        hideSection(targetId);
                    }
                });
            });

            const detailPanels = new Map();
            document.querySelectorAll('.detail-panel').forEach((panel) => {
                if (panel.id) {
                    panel.classList.add('d-none');
                    detailPanels.set(panel.id, panel);
                }
            });

            const toggleDetail = (id) => {
                const panel = detailPanels.get(id);
                if (!panel) {
                    console.warn('[AdminPanel] Panel de detalle no encontrado', id);
                    return;
                }
                const shouldShow = panel.classList.contains('d-none');
                if (shouldShow) {
                    panel.classList.remove('d-none');
                } else {
                    panel.classList.add('d-none');
                }
            };

            document.querySelectorAll('.detail-toggle').forEach((button) => {
                const targetId = button.getAttribute('data-detail-target');
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const panel = detailPanels.get(targetId);
                    if (!panel) {
                        return;
                    }
                    const shouldShow = panel.classList.contains('d-none');
                    if (shouldShow) {
                        panel.classList.remove('d-none');
                        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        button.classList.add('open');
                    } else {
                        panel.classList.add('d-none');
                        button.classList.remove('open');
                    }
                });
            });

            (collapseTargets || []).forEach((id) => showSection(id));
            (detailTargets || []).forEach((id) => {
                const detailPanel = detailPanels.get(id);
                if (detailPanel) {
                    const parent = detailPanel.closest('.section-panel');
                    if (parent && parent.id) {
                        showSection(parent.id);
                    }
                    detailPanel.classList.remove('d-none');
                    const toggleButton = document.querySelector(`.detail-toggle[data-detail-target="${id}"]`);
                    if (toggleButton) {
                        toggleButton.classList.add('open');
                    }
                }
            });

            if (focusId) {
                const target = document.getElementById(focusId);
                if (target) {
                    const parent = target.closest('.section-panel');
                    if (parent && parent.id) {
                        showSection(parent.id);
                    }
                    target.classList.add('focus-highlight');
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setTimeout(() => target.classList.remove('focus-highlight'), 2200);
                }
            }
        });
    </script>
@endsection
