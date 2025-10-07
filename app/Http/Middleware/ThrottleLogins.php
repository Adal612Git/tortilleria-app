<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ThrottleLogins
{
    private const MAX_ATTEMPTS = 3;
    private const DECAY_SECONDS = 15 * 60; // 15 minutes

    public function handle(Request $request, Closure $next): Response
    {
        $key = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);
            $minutes = (int) ceil($seconds / 60);
            return back()
                ->withErrors(['email' => "Demasiados intentos. Intenta de nuevo en {$minutes} minutos."])
                ->onlyInput('email');
        }

        return $next($request);
    }

    private function throttleKey(Request $request): string
    {
        return Str::lower((string) $request->input('email')).'|'.$request->ip();
    }
}

