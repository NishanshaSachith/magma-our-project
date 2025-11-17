<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // List all users
    public function index()
    {
        $users = User::all();
        return response()->json($users);
    }

    // Store a new user
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'fullname' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'idnumber' => 'nullable|string|max:255',
            'phoneno' => 'nullable|string|max:255',
            'role' => ['required', Rule::in(['Administrator','Tecnical_Head', 'Manager', 'Technician'])],
        ]);

        $user = new User();
        $user->fullname = $validatedData['fullname'];
        $user->username = $validatedData['username'];
        $user->email = $validatedData['email'];
        $user->password = Hash::make($validatedData['password']);
        $user->idnumber = $validatedData['idnumber'] ?? null;
        $user->phoneno = $validatedData['phoneno'] ?? null;
        $user->role = $validatedData['role'];
        $user->save();

        return response()->json(['status' => 'success', 'message' => 'User created successfully']);
    }

    // Update user role by ID
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validatedData = $request->validate([
            'role' => ['required', Rule::in(['Administrator','Tecnical_Head', 'Manager', 'Technician'])],
        ]);

        $user->role = $validatedData['role'];
        $user->save();

        return response()->json(['status' => 'success', 'message' => 'User role updated successfully']);
    }

    // Delete user by ID
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['status' => 'success', 'message' => 'User deleted successfully']);
    }

    // Update user role by ID (for route /users/{id}/role)
    public function updateRole(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validatedData = $request->validate([
            'role' => ['required', Rule::in(['Administrator','Tecnical_Head', 'Manager', 'Technician'])],
        ]);

        $user->role = $validatedData['role'];
        $user->save();

        return response()->json(['status' => 'success', 'message' => 'User role updated successfully']);
    }
}
