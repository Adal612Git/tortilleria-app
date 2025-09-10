<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $key = $this->throttleKey($request);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            $user = Auth::user();

            // Successful login: clear throttle attempts
            RateLimiter::clear($key);

            $response = $this->authenticated($request, $user);
            if ($response) {
                return $response;
            }

            return redirect()->intended('/');
        }

        // Failed login: record attempt with 15 minutes decay
        RateLimiter::hit($key, 60 * 15);

        return back()->withErrors([
            'email' => 'Credenciales inválidas.',
        ])->onlyInput('email');
    }

    protected function authenticated(Request $request, $user)
    {
        $role = optional($user->role)->name;

        // Redirigir a /dashboard para Admin, Caja (si existe) y Despachador
        if (in_array($role, ['Admin', 'Caja', 'Despachador', 'Dueño'], true)) {
            return redirect('/dashboard');
        }

        // Otros roles mantienen comportamiento previo
        switch ($role) {
            case 'Motociclista':
                return redirect('/dashboard/moto');
            default:
                return redirect('/');
        }
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
    }

    private function throttleKey(Request $request): string
    {
        return Str::lower($request->input('email')).'|'.$request->ip();
    }
}
