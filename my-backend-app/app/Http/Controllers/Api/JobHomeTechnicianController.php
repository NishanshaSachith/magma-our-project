<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JobHomeTechnician;
use Illuminate\Support\Facades\Validator;

class JobHomeTechnicianController extends Controller
{
    // Get all jobhome technicians
    public function index()
    {
        $technicians = JobHomeTechnician::all();
        return response()->json($technicians);
    }

    // Assign multiple technicians to a jobhome
    public function assignTechnicians(Request $request, $jobhomeId)
    {
        $validator = Validator::make($request->all(), [
            'technicians' => 'required|array',
            'technicians.*.user_id' => 'required|exists:users,id',
            'technicians.*.technician_name' => 'required|string',
            'technicians.*.assign_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for existing assignments to avoid duplicates
        foreach ($request->technicians as $tech) {
            $existing = JobHomeTechnician::where('jobhome_id', $jobhomeId)
                ->where('user_id', $tech['user_id'])
                ->first();
            if (!$existing) {
                JobHomeTechnician::create([
                    'jobhome_id' => $jobhomeId,
                    'user_id' => $tech['user_id'],
                    'technician_name' => $tech['technician_name'],
                    'assign_date' => $tech['assign_date'],
                    'state' => 'new',
                ]);
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Technicians assigned successfully',
        ]);
    }

    // Get technicians assigned to a jobhome
    public function getAssignedTechnicians($jobhomeId)
    {
        $assigned = JobHomeTechnician::where('jobhome_id', $jobhomeId)->get();
        return response()->json($assigned);
    }

    // Delete a technician assignment
    public function deleteTechnician($jobhomeId, $technicianId)
    {
        $assignment = JobHomeTechnician::where('jobhome_id', $jobhomeId)
            ->where('id', $technicianId)
            ->first();

        if (!$assignment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Technician assignment not found'
            ], 404);
        }

        $assignment->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Technician assignment deleted successfully'
        ]);
    }

    // Get states for current technician's assigned jobs
    public function getStates()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $states = JobHomeTechnician::where('user_id', $user->id)
            ->pluck('state', 'jobhome_id');

        return response()->json($states);
    }

    // Update state for a specific jobhome assignment
    public function updateState($jobhomeId)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $request = request();
        $state = $request->input('state');

        if (!in_array($state, ['new', 'opened'])) {
            return response()->json(['error' => 'Invalid state'], 400);
        }

        $assignment = JobHomeTechnician::where('jobhome_id', $jobhomeId)
            ->where('user_id', $user->id)
            ->first();

        if (!$assignment) {
            return response()->json(['error' => 'Assignment not found'], 404);
        }

        $assignment->state = $state;
        $assignment->save();

        return response()->json(['status' => 'success']);
    }
}
