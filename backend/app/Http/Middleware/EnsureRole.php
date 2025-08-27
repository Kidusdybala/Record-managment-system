<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Ensure the authenticated user has one of the required roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $role = $request->attributes->get('auth_role');
        if (!$role || !in_array($role, $roles, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return $next($request);
    }
}