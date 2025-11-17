<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobCancellation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class JobCancellationController extends Controller
{
    /**
     * Store a new job cancellation
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'job_home_id' => 'required|exists:job_homes,id',
            'reason' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if job is already cancelled
        $existingCancellation = JobCancellation::where('job_home_id', $request->job_home_id)->first();
        if ($existingCancellation) {
            return response()->json([
                'message' => 'Job is already cancelled',
                'cancellation' => $existingCancellation
            ], 409);
        }

        $cancellation = JobCancellation::create($request->only(['job_home_id', 'reason', 'description']));

        // Update job_home status to 'Cancel'
        $jobHome = \App\Models\JobHome::find($request->job_home_id);
        if ($jobHome) {
            $jobHome->update(['job_status' => 'Cancel']);

            // Cancel associated quotations and invoices
            $this->cancelAssociatedDocuments($jobHome->id);
        }

        return response()->json([
            'message' => 'Job cancelled successfully',
            'cancellation' => $cancellation->load('jobHome')
        ], 201);
    }

    /**
     * Cancel associated quotations and invoices when job is cancelled
     */
    private function cancelAssociatedDocuments($jobHomeId)
    {
        // Find job cards associated with this job home
        $jobCards = \App\Models\JobCard::where('job_home_id', $jobHomeId)->get();

        foreach ($jobCards as $jobCard) {
            // Cancel quotations associated with this job card
            $quotations = \App\Models\Quotation::where('job_card_id', $jobCard->id)->get();
            foreach ($quotations as $quotation) {
                // Update quotation status to cancelled (you may need to add a status field to quotations table)
                // For now, we'll just mark it as cancelled by updating a field or adding a cancelled_at timestamp
                $quotation->update(['cancelled_at' => now()]);

                // Cancel associated invoices
                $invoices = \App\Models\Invoice::where('quotation_id', $quotation->id)->get();
                foreach ($invoices as $invoice) {
                    $invoice->update(['status' => 'cancelled', 'cancelled_at' => now()]);
                }
            }
        }
    }

    /**
     * Get cancellation details for a specific job
     */
    public function show($jobHomeId): JsonResponse
    {
        $cancellation = JobCancellation::where('job_home_id', $jobHomeId)
            ->with('jobHome')
            ->first();

        if (!$cancellation) {
            return response()->json([
                'message' => 'No cancellation found for this job'
            ], 404);
        }

        return response()->json($cancellation);
    }
}
