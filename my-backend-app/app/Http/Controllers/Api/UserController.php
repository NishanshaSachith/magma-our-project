<?php

// app/Http/Controllers/Api/UserController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash; // For hashing passwords
use Illuminate\Support\Facades\Validator; // For input validation
use Illuminate\Support\Facades\Log; // Added for logging
use Illuminate\Support\Facades\Auth; // Added for auth helper

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        Log::info('UserController@index called');
        $user = Auth::user();
        Log::info('Authenticated user:', ['id' => $user ? $user->id : null, 'username' => $user ? $user->username : null]);

        // Removed role check to allow all authenticated users to fetch users list
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: You must be logged in to access this resource.'
            ], 401);
        }

        // Retrieve all users from the database and return them as a JSON response.
        // In a real application, you might want to paginate these results for performance.
        return response()->json(User::all());
    }

    // New method to get users with role 'technician'
    public function getTechnicians()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: You must be logged in to access this resource.'
            ], 401);
        }

        $technicians = User::where('role', 'technician')->get();
        return response()->json($technicians);
    }

    /**
     * Store a newly created user in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // 1. Validate the incoming request data against defined rules.
        // The field names here must match the keys sent in the request body from the client.
        $validator = Validator::make($request->all(), [
            'fullname' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username', // Ensure username is unique in the 'users' table
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8', // Require a minimum password length for security
            'idnumber' => 'nullable|string|max:255|unique:users,idnumber', // Match migration: 'idnumber'
            'phoneno' => 'nullable|string|max:20', // Match migration: 'phoneno'
            'role' => 'required|in:Administrator,Tecnical_Head,Manager,Technician', // Restrict roles to the enum values defined in migration
        ]);
        //dd($validator);
        // If validation fails, return a 422 Unprocessable Entity response with detailed errors.
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors() // Provides specific validation error messages
            ], 422);
        }

        try {
            // 2. Create the user in the database.
            // The array keys here must match the column names in your 'users' table.
            $user = User::create([
                'fullname' => $request->fullname,
                'username' => $request->username,
                'email' => $request->email,
                'password' => Hash::make($request->password), // Hash the password before saving for security
                'idnumber' => $request->idnumber, // Matched to migration column name
                'phoneno' => $request->phoneno,     // Matched to migration column name
                'role' => $request->role,
            ]);

            // 3. Return a success response with the created user object.
            return response()->json([
                'status' => 'success',
                'message' => 'User created successfully!',
                'user' => $user // Optionally return the created user data
            ], 201); // 201 Created status code indicates successful resource creation

        } catch (\Exception $e) {
            // 4. Handle any exceptions that occur during user creation (e.g., database errors).
            // Return a 500 Internal Server Error response with the exception message for debugging.
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create user',
                'error' => $e->getMessage() // Provide the exception message for development/debugging
            ], 500); // 500 Internal Server Error for unexpected server-side issues
        }
    }

    /**
     * Remove the specified user from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        try {
            $user->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the role of the specified user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateRole(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:Administrator,Tecnical_Head,Manager,Technician',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        try {
            $user->role = $request->role;
            $user->save();

            return response()->json([
                'status' => 'success',
                'message' => 'User role updated successfully',
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update user role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the password of the specified user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updatePassword(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'newPassword' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        }

        try {
            $user->password = Hash::make($request->newPassword);
            $user->save();

            return response()->json([
                'status' => 'success',
                'message' => 'User password updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update user password',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
