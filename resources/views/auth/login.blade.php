@extends('layouts.app')

@section('title', 'Login')

@section('content')
    <div class="w-full max-w-md bg-white shadow rounded p-6 mx-auto mt-10">
        <h1 class="text-2xl font-semibold text-gray-800 mb-6 text-center">Iniciar sesión</h1>

        @if ($errors->any())
            <div class="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
                {{ $errors->first() }}
            </div>
        @endif

        <form method="POST" action="{{ url('/login') }}" class="space-y-4">
            @csrf
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                <input id="email" name="email" type="email" value="{{ old('email') }}" required autofocus
                       class="mt-1 block w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
            </div>

            <div>
                <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
                <input id="password" name="password" type="password" required
                       class="mt-1 block w-full rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
            </div>

            <button type="submit"
                    class="w-full py-2 px-4 rounded bg-blue-600 text-white font-medium hover:bg-blue-700">
                Entrar
            </button>
        </form>
    </div>
@endsection
