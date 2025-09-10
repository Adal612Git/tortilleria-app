@extends('layouts.app')

@section('title', 'Login')

@section('content')
    <div class="w-full max-w-md shadow rounded p-6 mx-auto mt-10" style="background: var(--blanco); border:1px solid var(--borde);">
        <h1 class="text-2xl font-semibold text-gray-800 mb-6 text-center">Iniciar sesión</h1>

        @if ($errors->any())
            <div class="alert-error mb-4">{{ $errors->first() }}</div>
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

            <button type="submit" class="w-full btn-app btn-secondary-app">Entrar</button>
        </form>

        <div id="forgot-app" class="mt-4 text-center">
            <button @click="send" type="button" class="text-blue-600 hover:underline">Olvidé la contraseña</button>
            <p v-if="msg" class="mt-2 text-sm" :class="ok ? 'text-green-600' : 'text-red-600'">@{{ msg }}</p>
        </div>
    </div>

    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <script>
        const { createApp, ref } = Vue;
        createApp({
            setup() {
                const msg = ref('');
                const ok = ref(false);
                const send = async () => {
                    msg.value = '';
                    ok.value = false;
                    const emailEl = document.getElementById('email');
                    const email = emailEl ? emailEl.value : '';
                    if (!email) {
                        msg.value = 'Ingresa tu email para enviar el enlace.';
                        ok.value = false;
                        return;
                    }
                    try {
                        const { data } = await window.axios.post('/password/email', { email });
                        ok.value = !!data.ok;
                        msg.value = data.message || 'Se envió el enlace de recuperación si el email existe.';
                    } catch (e) {
                        ok.value = false;
                        const data = e?.response?.data;
                        msg.value = data?.message || 'No se pudo enviar el enlace.';
                    }
                };
                return { msg, ok, send };
            }
        }).mount('#forgot-app');
    </script>
@endsection
