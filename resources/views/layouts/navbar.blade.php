<nav class="border-bottom mb-3">
    <div class="container-fluid d-flex align-items-center justify-content-between py-2">
        <a class="fw-bold text-decoration-none" href="{{ url('/') }}" style="color:#000;">Tortillería</a>
        <div class="d-flex align-items-center flex-wrap">
            @auth
                @php $role = optional(auth()->user()->role)->name; @endphp
                @if($role === 'Admin')
                    <a class="nav-chip btn-soft-blue me-2 {{ request()->is('dashboard') ? 'active' : '' }}" href="{{ url('/dashboard') }}">Dashboard</a>
                    <a class="nav-chip btn-soft-blue me-2 {{ request()->is('pos') ? 'active' : '' }}" href="{{ url('/pos') }}">POS</a>
                    <a class="nav-chip btn-soft-cyan me-2 {{ request()->is('apos') ? 'active' : '' }}" href="{{ route('pos.admin') }}">APOS</a>
                    <a class="nav-chip btn-soft-green me-2 {{ request()->is('inventario') ? 'active' : '' }}" href="{{ url('/inventario') }}">Inventario</a>
                    <a class="nav-chip btn-soft-cyan me-2 {{ request()->is('kardex') ? 'active' : '' }}" href="{{ url('/kardex') }}">Kardex</a>
                    <a class="nav-chip btn-soft-amber me-2 {{ request()->is('caja') ? 'active' : '' }}" href="{{ url('/caja') }}">Caja</a>
                    <a class="nav-chip btn-soft-green me-2 {{ request()->is('contabilidad') ? 'active' : '' }}" href="{{ url('/contabilidad') }}">Contabilidad</a>
                    <a class="nav-chip btn-soft-red me-2 {{ (request()->is('historial') || request()->is('auditoria')) ? 'active' : '' }}" href="{{ url('/historial') }}">Historial</a>
                @elseif($role === 'Dueño')
                    <a class="nav-chip btn-soft-blue me-2 {{ request()->is('dashboard') ? 'active' : '' }}" href="{{ url('/dashboard') }}">Dashboard</a>
                    <a class="nav-chip btn-soft-blue me-2 {{ request()->is('pos') ? 'active' : '' }}" href="{{ url('/pos') }}">POS</a>
                    <a class="nav-chip btn-soft-cyan me-2 {{ request()->is('apos') ? 'active' : '' }}" href="{{ route('pos.admin') }}">APOS</a>
                    <a class="nav-chip btn-soft-green me-2 {{ request()->is('inventario') ? 'active' : '' }}" href="{{ url('/inventario') }}">Inventario</a>
                    <a class="nav-chip btn-soft-cyan me-2 {{ request()->is('kardex') ? 'active' : '' }}" href="{{ url('/kardex') }}">Kardex</a>
                    <a class="nav-chip btn-soft-amber me-2 {{ request()->is('caja') ? 'active' : '' }}" href="{{ url('/caja') }}">Caja</a>
                    <a class="nav-chip btn-soft-green me-2 {{ request()->is('contabilidad') ? 'active' : '' }}" href="{{ url('/contabilidad') }}">Contabilidad</a>
                    <a class="nav-chip btn-soft-red me-2 {{ (request()->is('historial') || request()->is('auditoria')) ? 'active' : '' }}" href="{{ url('/historial') }}">Historial</a>
                @elseif($role === 'Despachador')
                    <a class="nav-chip btn-soft-blue me-2 {{ request()->is('pos') ? 'active' : '' }}" href="{{ url('/pos') }}">POS</a>
                    <a class="nav-chip btn-soft-green me-2 {{ request()->is('pedidos*') ? 'active' : '' }}" href="{{ url('/pedidos') }}">Pedidos</a>
                    <a class="nav-chip btn-soft-amber me-2 {{ request()->is('reportes/despachador') ? 'active' : '' }}" href="{{ url('/reportes/despachador') }}">Reporte Turno</a>
                @elseif($role === 'Motociclista')
                    <a class="nav-chip btn-soft-blue me-2 {{ request()->is('entregas') ? 'active' : '' }}" href="{{ url('/entregas') }}">Entregas</a>
                    <a class="nav-chip btn-soft-green me-2 {{ request()->is('entregas/historial') ? 'active' : '' }}" href="{{ url('/entregas/historial') }}">Historial</a>
                    <a class="nav-chip btn-soft-cyan me-2 {{ request()->is('reportes/motociclista') ? 'active' : '' }}" href="{{ url('/reportes/motociclista') }}">Mi reporte</a>
                @endif
                <span class="text-muted small me-2">{{ auth()->user()->name }} ({{ optional(auth()->user()->role)->name }})</span>
                <form method="POST" action="{{ url('/logout') }}" class="mb-0 me-2">
                    @csrf
                    <button type="submit" class="nav-chip btn-soft-red">Cerrar sesión</button>
                </form>
            @else
                <a href="{{ route('login') }}" class="nav-chip btn-soft-gray">Iniciar sesión</a>
            @endauth
        </div>
    </div>
</nav>
