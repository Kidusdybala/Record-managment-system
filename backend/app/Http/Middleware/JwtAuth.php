<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        // Check for token in Authorization header first, then in cookies
        $token = $request->header('Authorization');
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        } elseif (!$token) {
            $token = $request->cookie('token');
        }
        
        if (!$token) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            // Use APP_KEY as symmetric secret for HS256. Strip base64: prefix if present
            $key = config('app.key');
            if (str_starts_with($key, 'base64:')) {
                $key = base64_decode(substr($key, 7));
            }
            
            $decoded = JWT::decode($token, new Key($key, 'HS256'));
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        // Attach auth info to request
        $request->attributes->set('auth_user_id', $decoded->sub ?? null);
        $request->attributes->set('auth_role', $decoded->role ?? null);
        $request->attributes->set('auth_department_id', $decoded->department_id ?? null);

        return $next($request);
    }
}