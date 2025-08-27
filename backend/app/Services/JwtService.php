<?php

namespace App\Services;

use Firebase\JWT\JWT;

class JwtService
{
    public static function issueToken(int $userId, string $role, ?int $departmentId = null): string
    {
        $now = time();
        $payload = [
            'iss' => config('app.url'), // issuer
            'iat' => $now,             // issued at
            'nbf' => $now,             // not before
            'exp' => $now + 60 * 60 * 8, // 8 hours
            'sub' => $userId,
            'role' => $role,
            'department_id' => $departmentId,
        ];

        // Use APP_KEY as symmetric secret for HS256. Strip base64: prefix if present
        $key = config('app.key');
        if (str_starts_with($key, 'base64:')) {
            $key = base64_decode(substr($key, 7));
        }

        return JWT::encode($payload, $key, 'HS256');
    }
}