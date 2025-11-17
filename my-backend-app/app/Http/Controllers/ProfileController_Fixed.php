<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class ProfileController_Fixed extends Controller
{
    /**
     * Display the authenticated user's profile.
     */
    public function show()
    {
        $user = Auth::user();

        if (!$user) {
            Log::error('Auth::user() returned null in show method.');
            return response()->json(['message' => 'Unauthorized or User not found.'], 401);
        }

        $profileImageUrl = $user->profile_image
            ? route('user.profile.image', ['id' => $user->id, 't' => $user->updated_at->timestamp])
            : null;

        return response()->json([
            'id' => $user->id,
            'fullname' => $user->fullname,
            'username' => $user->username,
            'email' => $user->email,
            'idnumber' => $user->idnumber,
            'phoneno' => $user->phoneno,
            'profile_image_url' => $profileImageUrl,
        ]);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function update(Request $request)
    {
        $authUser = Auth::user();

        if (!$authUser) {
            Log::error('Auth::user() returned null in update method. User not authenticated.');
            return response()->json(['message' => 'Unauthorized. Please log in.'], 401);
        }

        // Get fresh user instance from database
        $user = User::find($authUser->id);
        if (!$user) {
            Log::error('User model not found in database for ID: ' . $authUser->id);
            return response()->json(['message' => 'User not found.'], 404);
        }

        Log::info('Profile Update Request Data:', $request->all());

        // Validate the request
        $validatedData = $request->validate([
            'fullname' => 'sometimes|required|string|max:255',
            'username' => 'sometimes|required|string|max:255|unique:users,username,' . $user->id,
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'idnumber' => 'sometimes|required|string|max:255|unique:users,idnumber,' . $user->id,
            'phoneno' => 'sometimes|required|string|max:255',
            'new_password' => 'nullable|string|min:8|confirmed',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'remove_profile_image' => 'nullable|boolean',
        ]);

        Log::info('Validated data:', $validatedData);

        // Update fields that are present in the request
        if (isset($validatedData['fullname'])) {
            $user->fullname = $validatedData['fullname'];
            Log::info('Updated fullname to: ' . $validatedData['fullname']);
        }
        
        if (isset($validatedData['username'])) {
            $user->username = $validatedData['username'];
            Log::info('Updated username to: ' . $validatedData['username']);
        }
        
        if (isset($validatedData['email'])) {
            $user->email = $validatedData['email'];
            Log::info('Updated email to: ' . $validatedData['email']);
        }
        
        if (isset($validatedData['idnumber'])) {
            $user->idnumber = $validatedData['idnumber'];
            Log::info('Updated idnumber to: ' . $validatedData['idnumber']);
        }
        
        if (isset($validatedData['phoneno'])) {
            $user->phoneno = $validatedData['phoneno'];
            Log::info('Updated phoneno to: ' . $validatedData['phoneno']);
        }

        // Handle password update
        if (!empty($validatedData['new_password'])) {
            $user->password = Hash::make($validatedData['new_password']);
            Log::info('Password updated for user: ' . $user->id);
        }

        // Handle profile image
        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            try {
                $user->profile_image = base64_encode(file_get_contents($file->getRealPath()));
                $user->profile_image_mime = $file->getMimeType();
                Log::info('Profile image received and prepared for user: ' . $user->id);
            } catch (\Exception $e) {
                Log::error('Error reading profile image file: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Failed to process profile image.',
                    'error_detail' => $e->getMessage(),
                ], 400);
            }
        } elseif ($request->boolean('remove_profile_image')) {
            $user->profile_image = null;
            $user->profile_image_mime = null;
            Log::info('Profile image marked for removal for user: ' . $user->id);
        }

        // Log what we're about to save
        Log::info('User data before save:', [
            'id' => $user->id,
            'fullname' => $user->fullname,
            'username' => $user->username,
            'email' => $user->email,
            'idnumber' => $user->idnumber,
            'phoneno' => $user->phoneno,
        ]);

        try {
            // Save the user
            $saved = $user->save();
            Log::info('User profile save result for user ' . $user->id . ': ' . ($saved ? 'success' : 'failure'));
            
            if (!$saved) {
                Log::error('Failed to save user profile - save() returned false');
                return response()->json(['message' => 'Failed to save profile changes.'], 500);
            }
            
        } catch (\Exception $e) {
            Log::error('Database save error for user ' . $user->id . ': ' . $e->getMessage(), ['exception' => $e]);
            return response()->json([
                'message' => 'Failed to update profile due to a database error.',
                'error_detail' => $e->getMessage(),
                'code' => $e->getCode(),
            ], 500);
        }

        // IMPORTANT: Get a fresh instance from the database to return the actual saved data
        $freshUser = User::find($user->id);
        
        Log::info('Fresh user data after save:', [
            'id' => $freshUser->id,
            'fullname' => $freshUser->fullname,
            'username' => $freshUser->username,
            'email' => $freshUser->email,
            'idnumber' => $freshUser->idnumber,
            'phoneno' => $freshUser->phoneno,
        ]);

        $profileImageUrl = $freshUser->profile_image
            ? route('user.profile.image', ['id' => $freshUser->id, 't' => $freshUser->updated_at->timestamp])
            : null;

        return response()->json([
            'message' => 'Profile updated successfully!',
            'user' => [
                'id' => $freshUser->id,
                'fullname' => $freshUser->fullname,
                'username' => $freshUser->username,
                'email' => $freshUser->email,
                'idnumber' => $freshUser->idnumber,
                'phoneno' => $freshUser->phoneno,
                'profile_image_url' => $profileImageUrl,
            ],
        ]);
    }

    /**
     * Serve the user's profile image.
     */
    public function profileImage($id)
    {
        $user = User::findOrFail($id);

        if (!$user->profile_image) {
            abort(404, 'Profile image not found.');
        }

        $mime = $user->profile_image_mime ?? 'image/png';

        return Response::make(base64_decode($user->profile_image), 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="profile_image"',
            'Cache-Control' => 'public, max-age=31536000',
            'Expires' => gmdate('D, d M Y H:i:s T', strtotime('+1 year')),
            'Last-Modified' => gmdate('D, d M Y H:i:s T', $user->updated_at->timestamp),
        ]);
    }
}