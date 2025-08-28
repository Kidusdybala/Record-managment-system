<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        // Only record office (admin) can view users
        if ($request->attributes->get('auth_role') !== 'record_office') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $users = User::with('department')->get();

        return response()->json(['data' => $users]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        // Only record office (admin) can create users
        if ($request->attributes->get('auth_role') !== 'record_office') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['minister', 'record_office', 'department'])],
            'department_id' => 'nullable|integer|exists:departments,id',
        ]);

        // Validate department_id is required for department users
        if ($request->role === 'department' && !$request->department_id) {
            return response()->json(['message' => 'Department is required for department users'], 422);
        }

        // Validate department_id should be null for minister and record_office
        if (in_array($request->role, ['minister', 'record_office']) && $request->department_id) {
            return response()->json(['message' => 'Department should not be set for minister or record office users'], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'department_id' => $request->department_id,
            'status' => 'active',
        ]);

        return response()->json(['data' => $user->load('department')], 201);
    }

    /**
     * Display the specified user.
     */
    public function show(Request $request, string $id)
    {
        // Only record office (admin) can view users
        if ($request->attributes->get('auth_role') !== 'record_office') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user = User::with('department')->findOrFail($id);

        return response()->json(['data' => $user]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, string $id)
    {
        // Only record office (admin) can update users
        if ($request->attributes->get('auth_role') !== 'record_office') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['sometimes', 'required', Rule::in(['minister', 'record_office', 'department'])],
            'department_id' => 'nullable|integer|exists:departments,id',
            'status' => ['sometimes', 'required', Rule::in(['active', 'suspended'])],
        ]);

        // Validate department_id is required for department users
        if ($request->has('role') && $request->role === 'department' && !$request->department_id) {
            return response()->json(['message' => 'Department is required for department users'], 422);
        }

        // Validate department_id should be null for minister and record_office
        if ($request->has('role') && in_array($request->role, ['minister', 'record_office']) && $request->department_id) {
            return response()->json(['message' => 'Department should not be set for minister or record office users'], 422);
        }

        $user->update($request->only(['name', 'email', 'role', 'department_id', 'status']));

        return response()->json(['data' => $user->fresh()->load('department')]);
    }

    /**
     * Suspend the specified user.
     */
    public function suspend(Request $request, string $id)
    {
        // Only record office (admin) can suspend users
        if ($request->attributes->get('auth_role') !== 'record_office') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user = User::findOrFail($id);

        // Prevent suspending other record office users
        if ($user->role === 'record_office') {
            return response()->json(['message' => 'Cannot suspend record office users'], 403);
        }

        $user->suspend();

        return response()->json(['data' => $user->fresh()->load('department')]);
    }

    /**
     * Activate the specified user.
     */
    public function activate(Request $request, string $id)
    {
        // Only record office (admin) can activate users
        if ($request->attributes->get('auth_role') !== 'record_office') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user = User::findOrFail($id);
        $user->activate();

        return response()->json(['data' => $user->fresh()->load('department')]);
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, string $id)
    {
        // Only record office (admin) can delete users
        if ($request->attributes->get('auth_role') !== 'record_office') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $user = User::findOrFail($id);

        // Prevent deleting other record office users
        if ($user->role === 'record_office') {
            return response()->json(['message' => 'Cannot delete record office users'], 403);
        }

        // Check if user has any associated letters
        if ($user->createdLetters()->count() > 0 || $user->reviewedLetters()->count() > 0) {
            return response()->json(['message' => 'Cannot delete user with associated letters'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
