<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            $user = Auth::user();

            $response = $this->authenticated($request, $user);
            if ($response) {
                return $response;
            }

            return redirect()->intended('/');
        }

        return back()->withErrors([
            'email' => 'Credenciales inválidas.',
        ])->onlyInput('email');
    }

    protected function authenticated(Request $request, $user)
    {
        $role = optional($user->role)->name;

        switch ($role) {
            case 'Dueño':
                return redirect('/dashboard/dueno');
            case 'Admin':
                return redirect('/dashboard/admin');
            case 'Despachador':
                return redirect('/dashboard/despacho');
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
}
