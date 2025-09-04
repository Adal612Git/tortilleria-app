<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * roles: comma-separated list of role names.
     */
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }

        $allowed = array_map('trim', explode(',', $roles));
        $userRole = optional($user->role)->name;

        if (!in_array($userRole, $allowed, true)) {
            abort(403, 'No autorizado');
        }

        return $next($request);
    }
}

