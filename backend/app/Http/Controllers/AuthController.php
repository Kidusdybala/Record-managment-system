<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = JwtService::issueToken($user->id, $user->role, $user->department_id);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'department_id' => $user->department_id,
            ],
            'token' => $token
        ])->cookie('token', $token, 60 * 8, '/', null, false, true);
    }

    public function logout(Request $request)
    {
        return response()->json(['message' => 'Logged out'])
            ->cookie('token', '', -1, '/', null, false, true);
    }

    public function me(Request $request)
    {
        $userId = $request->attributes->get('auth_user_id');
        $user = User::find($userId);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'department_id' => $user->department_id,
            ]
        ]);
    }
}