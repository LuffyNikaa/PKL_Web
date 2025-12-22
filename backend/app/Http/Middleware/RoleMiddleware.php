<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!in_array(auth()->user()->role_users, $roles)) {
            return response()->json(['message' => 'Akses ditolak'], 403);
        }
        return $next($request);
    }
}
