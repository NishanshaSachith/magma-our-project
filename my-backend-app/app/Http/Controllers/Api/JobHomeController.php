<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JobHome;
use App\Models\JobCard;

class JobHomeController extends Controller
{
     // Create JobHome with auto-generated job_no
    public function store(Request $request)
        {
            $request->validate([
                'job_type' => 'required|string',
                'customer_id' => 'nullable|exists:customers,id',
                'job_status' => 'nullable|string',
            ]);

            $jobType = trim($request->job_type); // remove extra whitespace

            // 🔠 Use first two letters of job_type as prefix (uppercase)
            $prefix = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $jobType), 0, 2));

            // 🔍 Find the latest job_no with this prefix
            $lastJob = JobHome::where('job_no', 'LIKE', $prefix . '%')
                        ->orderBy('id', 'desc')
                        ->first();

            if ($lastJob) {
                // Get numeric part from job_no (e.g., 00012 from GE00012)
                $lastNumber = (int) substr($lastJob->job_no, strlen($prefix));
                $nextNumber = $lastNumber + 1;
            } else {
                $nextNumber = 1;
            }

            // 🆕 Generate the new job number
            $jobNo = $prefix . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

            // 📌 Default status if not provided
            $status = $request->job_status ?? 'Pending';

            $jobHome = JobHome::create([
                'job_no' => $jobNo,
                'job_type' => $jobType,
                'customer_id' => $request->customer_id,
                'job_status' => $status,
            ]);

            return response()->json([
                'job_home' => $jobHome,
                'job_card' => null,
            ]);
        }



    // Update fields like service_start, service_end etc.
    public function update(Request $request, $id)
    {
        $request->validate([
            'service_start' => 'nullable|boolean',
            'service_end' => 'nullable|boolean',
            'customer_ok' => 'nullable|boolean',
            'special_approve' => 'nullable|boolean',
            'customer_id' => 'nullable|exists:customers,id',
        ]);

        $jobHome = JobHome::with('payments', 'quotation.invoice')->findOrFail($id);

        // Prevent modifications if job_status is 'cancel' or 'final'
        if (in_array(strtolower($jobHome->job_status), ['cancel', 'final'])) {
            return response()->json(['message' => 'Cannot modify a cancelled or final job.'], 403);
        }
        $jobHome->update($request->only(['service_start', 'service_end', 'customer_ok', 'special_approve', 'customer_id']));

        // Prevent job_status change if it is 'cancel'
        if ($jobHome->job_status !== 'cancel') {
            // Calculate payment statuses
            $payments = $jobHome->payments;
            $first_payment_success = $payments->isNotEmpty() && $payments->sum('payment_amount') > 0;
            $invoice = $jobHome->quotation?->invoice;
            $full_payment_success = $invoice ? $payments->sum('payment_amount') >= $invoice->total_amount : false;

            // Set job_status based on new conditions in sequence
            if ($jobHome->service_start && $jobHome->service_end && $full_payment_success && ($jobHome->special_approve || $first_payment_success)) {
                $jobHome->job_status = 'complete';
            } elseif ($jobHome->service_start && $jobHome->service_end && ($jobHome->special_approve || $first_payment_success)) {
                $jobHome->job_status = 'end';
            } elseif ($jobHome->service_start && ($jobHome->special_approve || $first_payment_success)) {
                $jobHome->job_status = 'inprocess';
            } elseif ($first_payment_success || $jobHome->special_approve) {
                $jobHome->job_status = 'todo';
            } else {
                $jobHome->job_status = 'Pending';
            }
            $jobHome->save();
        }

        return response()->json($jobHome);
    }

    // Optional: Fetch single job home with job card
    public function show($id)
    {
        $jobHome = JobHome::with('jobCard', 'payments', 'quotation.invoice')->findOrFail($id);

        // Fetch cancellation data if job is cancelled
        $cancellation = null;
        if (strtolower($jobHome->job_status) === 'cancel') {
            $cancellation = \App\Models\JobCancellation::where('job_home_id', $id)->first();
        }

        return response()->json([
            'job_home' => $jobHome,
            'job_card' => $jobHome->jobCard,
            'payments' => $jobHome->payments,
            'invoice' => $jobHome->quotation?->invoice,
            'cancellation' => $cancellation
        ]);
    }
    public function index()
    {
        $user = auth()->user();

        $query = JobHome::with('jobCard', 'payments', 'quotation.invoice');

        // If the user is a technician, filter jobs assigned to them
        if ($user && strtolower($user->role) === 'technician') {
            $assignedJobHomeIds = \App\Models\JobHomeTechnician::where('user_id', $user->id)
                ->pluck('jobhome_id');
            $query->whereIn('id', $assignedJobHomeIds);
        }

        $jobHomes = $query->get();

        // Add cancellation data for cancelled jobs
        $jobHomes->each(function ($jobHome) {
            if (strtolower($jobHome->job_status) === 'cancel') {
                $jobHome->cancellation = \App\Models\JobCancellation::where('job_home_id', $jobHome->id)->first();
            }
        });

        return $jobHomes;
    }
}
