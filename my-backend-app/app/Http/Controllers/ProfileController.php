<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        // Step 1: Check what we receive
        Log::info('=== PROFILE UPDATE DEBUG START ===');
        Log::info('Raw request data:', $request->all());
        
        $authUser = Auth::user();
        if (!$authUser) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        Log::info('Auth user ID: ' . $authUser->id);

        // Step 2: Get user from database
        $user = User::find($authUser->id);
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        Log::info('User before any changes:', [
            'id' => $user->id,
            'username' => $user->username,
            'fullname' => $user->fullname,
        ]);

        // Step 3: Validate - FIXED: Added new_password_confirmation to validation
        $validatedData = $request->validate([
            'fullname' => 'sometimes|required|string|max:255',
            'username' => 'sometimes|required|string|max:255|unique:users,username,' . $user->id,
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'idnumber' => 'sometimes|required|string|max:255|unique:users,idnumber,' . $user->id,
            'phoneno' => 'sometimes|required|string|max:255',
            'new_password' => 'nullable|string|min:8|confirmed',
            'new_password_confirmation' => 'nullable|string|min:8', // Added this line
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'remove_profile_image' => 'nullable|boolean',
        ]);

        Log::info('Validated data received:', $validatedData);

        // Step 4: Update fields one by one with detailed logging
        $originalUsername = $user->username;
        
        if (isset($validatedData['username'])) {
            Log::info('BEFORE username update: ' . $user->username);
            $user->username = $validatedData['username'];
            Log::info('AFTER username assignment: ' . $user->username);
            Log::info('Model isDirty for username: ' . ($user->isDirty('username') ? 'YES' : 'NO'));
            Log::info('Original value: ' . $user->getOriginal('username'));
        }

        if (isset($validatedData['fullname'])) {
            $user->fullname = $validatedData['fullname'];
        }
        if (isset($validatedData['email'])) {
            $user->email = $validatedData['email'];
        }
        if (isset($validatedData['idnumber'])) {
            $user->idnumber = $validatedData['idnumber'];
        }
        if (isset($validatedData['phoneno'])) {
            $user->phoneno = $validatedData['phoneno'];
        }

        // FIXED: Handle new password update with better logic
        if (!empty($validatedData['new_password'])) {
            Log::info('Password update requested. Original password hash: ' . substr($user->password, 0, 20) . '...');
            $newHashedPassword = Hash::make($validatedData['new_password']);
            $user->password = $newHashedPassword;
            Log::info('New password hash: ' . substr($newHashedPassword, 0, 20) . '...');
            Log::info('Password field is dirty: ' . ($user->isDirty('password') ? 'YES' : 'NO'));
        }

        // Handle profile image upload
        if (isset($validatedData['profile_image'])) {
            $file = $request->file('profile_image');
            if ($file && $file->isValid()) {
                $user->profile_image = base64_encode(file_get_contents($file->getRealPath()));
                $user->profile_image_mime = $file->getMimeType();
                Log::info('Profile image updated with mime: ' . $user->profile_image_mime);
            }
        }

        // Handle profile image removal
        if (isset($validatedData['remove_profile_image']) && $validatedData['remove_profile_image']) {
            $user->profile_image = null;
            $user->profile_image_mime = null;
            Log::info('Profile image removed as requested.');
        }

        // Step 5: Check what we're about to save
        Log::info('User model before save:', [
            'id' => $user->id,
            'username' => $user->username,
            'fullname' => $user->fullname,
            'email' => $user->email,
        ]);

        Log::info('Dirty attributes:', $user->getDirty());
        Log::info('All model attributes (excluding password):', array_diff_key($user->getAttributes(), ['password' => '']));

        // Step 6: Try direct database update as a test (REMOVED - not needed for debugging)
        
        // Step 7: Try the model save
        try {
            Log::info('Attempting model save...');
            $saved = $user->save();
            Log::info('Model save result: ' . ($saved ? 'true' : 'false'));
            
            if (!empty($validatedData['new_password'])) {
                Log::info('Password was updated in this save operation');
            }
        } catch (\Exception $e) {
            Log::error('Save error: ' . $e->getMessage());
            return response()->json(['message' => 'Save failed: ' . $e->getMessage()], 500);
        }

        // Step 8: Verify password was saved (if password was updated)
        if (!empty($validatedData['new_password'])) {
            $freshFromDb = DB::table('users')->where('id', $user->id)->first();
            $passwordMatches = Hash::check($validatedData['new_password'], $freshFromDb->password);
            Log::info('Password verification after save: ' . ($passwordMatches ? 'SUCCESS' : 'FAILED'));
        }

        // Step 9: Get fresh model instance
        $freshUser = User::find($user->id);
        Log::info('Fresh User model after save:', [
            'id' => $freshUser->id,
            'username' => $freshUser->username,
            'fullname' => $freshUser->fullname,
        ]);

        Log::info('=== PROFILE UPDATE DEBUG END ===');

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
            'debug_info' => [
                'original_username' => $originalUsername,
                'sent_username' => $validatedData['username'] ?? 'not_provided',
                'final_username' => $freshUser->username,
                'password_updated' => !empty($validatedData['new_password']),
            ]
        ]);
    }

    // Keep your other methods (show, profileImage) as they were
    public function show()
    {
        $user = Auth::user();

        if (!$user) {
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