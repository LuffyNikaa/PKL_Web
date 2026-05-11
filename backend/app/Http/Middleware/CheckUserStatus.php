<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->status_users !== 'aktif') {
            // hapus token biar langsung logout
            $user->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Akun nonaktif, akses ditolak'
            ], 403);
        }

        return $next($request);
    }
}
