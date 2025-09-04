<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Tortillería')</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <style>
        /* Botones personalizados del navbar (sin clases de Bootstrap) */
        .nav-chip { display:inline-block; padding:6px 12px; border-radius:10px; border:1px solid #cbd5e1; background:#f8fafc; color:#0f172a; text-decoration:none; font-weight:500; line-height:1; cursor:pointer; transition:background .15s ease, color .15s ease, box-shadow .15s ease, transform .05s ease; }
        .nav-chip:hover { box-shadow:0 2px 6px rgba(15,23,42,.15); transform:translateY(-1px); }
        .nav-chip.active { box-shadow: inset 0 0 0 2px rgba(15,23,42,.3); }

        .btn-soft-blue  { background:#e0f2fe; border-color:#7dd3fc; color:#075985; }
        .btn-soft-blue:hover  { background:#bae6fd; }
        .btn-soft-green { background:#dcfce7; border-color:#86efac; color:#065f46; }
        .btn-soft-green:hover { background:#bbf7d0; }
        .btn-soft-cyan  { background:#cffafe; border-color:#67e8f9; color:#164e63; }
        .btn-soft-cyan:hover  { background:#a5f3fc; }
        .btn-soft-amber { background:#fef3c7; border-color:#fcd34d; color:#92400e; }
        .btn-soft-amber:hover { background:#fde68a; }
        .btn-soft-red   { background:#fee2e2; border-color:#fca5a5; color:#7f1d1d; }
        .btn-soft-red:hover   { background:#fecaca; }
        .btn-soft-gray  { background:#e5e7eb; border-color:#cbd5e1; color:#111827; }
        .btn-soft-gray:hover  { background:#d1d5db; }
    </style>
</head>
<body class="min-h-screen bg-gray-50">
    @include('layouts.navbar')

    <main>
        @yield('content')
    </main>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
</body>
</html>
