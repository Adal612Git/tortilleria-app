<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * roles: comma-separated list of role names.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }

        // Los parámetros del middleware vienen separados por coma y se entregan como argumentos adicionales.
        $allowed = array_map('trim', $roles);
        $userRole = optional($user->role)->name;

        // Normaliza espacios, acentos y mayúsculas para comparar roles de forma robusta
        $normalize = fn ($v) => Str::lower(Str::ascii(trim((string) $v)));
        $allowedNorm = array_map($normalize, $allowed);
        $userRoleNorm = $normalize($userRole);

        if (!in_array($userRoleNorm, $allowedNorm, true)) {
            Log::warning('RoleMiddleware denied', [
                'path' => $request->path(),
                'user_id' => $user->id,
                'user_role' => $userRole,
                'user_role_norm' => $userRoleNorm,
                'allowed' => $allowed,
                'allowed_norm' => $allowedNorm,
            ]);
            abort(403, 'No autorizado');
        }

        return $next($request);
    }
}
