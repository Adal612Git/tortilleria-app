<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Tortillería')</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-gray-50">
    <nav class="navbar navbar-expand-lg navbar-light bg-light border-bottom mb-3">
        <div class="container-fluid">
            <a class="navbar-brand" href="{{ url('/') }}">Tortillería</a>
            <div class="d-flex align-items-center ms-auto">
                @auth
                    <form method="POST" action="{{ url('/logout') }}" class="mb-0">
                        @csrf
                        <button type="submit" class="btn btn-outline-danger btn-sm">Cerrar sesión</button>
                    </form>
                @else
                    <a href="{{ route('login') }}" class="btn btn-outline-primary btn-sm">Iniciar sesión</a>
                @endauth
            </div>
        </div>
    </nav>

    <main>
        @yield('content')
    </main>
</body>
</html>

