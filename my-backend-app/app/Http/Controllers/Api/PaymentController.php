<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        // Retrieve all payments from the database
        $payments = Payment::all();

        // Return a JSON response with the payments
        return response()->json($payments);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // Validate incoming data
        $validatedData = $request->validate([
            'jobhomeid' => 'required|exists:job_homes,id',
            'payment_amount' => 'required|numeric|min:0',
            'date' => 'required|date',
        ]);

        // Create a new payment
        $payment = Payment::create($validatedData);

        // Update job status after payment creation
        $this->updateJobStatus($validatedData['jobhomeid']);

        return response()->json($payment, Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Payment  $payment
     * @return \Illuminate\Http\Response
     */
    public function show(Payment $payment)
    {
        // The $payment model is automatically resolved by route model binding
        // Return a JSON response with the specific payment
        return response()->json($payment);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Payment  $payment
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Payment $payment)
    {
        // Validate the incoming request data
        $validatedData = $request->validate([
            'jobhomeid' => 'sometimes|required|exists:job_homes,id',
            'payment_amount' => 'sometimes|required|numeric|min:0',
            'date' => 'sometimes|required|date',
        ]);

        // Update the payment with the validated data
        $payment->update($validatedData);

        // Return a JSON response with the updated payment
        return response()->json($payment);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Payment  $payment
     * @return \Illuminate\Http\Response
     */
    public function destroy(Payment $payment)
    {
        $jobhomeid = $payment->jobhomeid;

        // The $payment model is automatically resolved
        $payment->delete();

        // Update job status after payment deletion
        $this->updateJobStatus($jobhomeid);

        // Return a no-content response
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Get payments by jobhomeid.
     *
     * @param  int  $jobhomeid
     * @return \Illuminate\Http\Response
     */
    public function getByJobHomeId($jobhomeid)
    {
        $payments = Payment::where('jobhomeid', $jobhomeid)->get();

        return response()->json($payments);
    }

    /**
     * Update job status based on payments and flags.
     *
     * @param  int  $jobhomeid
     * @return void
     */
    private function updateJobStatus($jobhomeid)
    {
        $jobHome = \App\Models\JobHome::with('payments', 'quotation.invoice')->find($jobhomeid);

        if (!$jobHome) {
            return;
        }

        // Calculate payment statuses
        $payments = $jobHome->payments;
        $first_payment_success = $payments->isNotEmpty() && $payments->sum('payment_amount') > 0;
        $quotation = $jobHome->quotation;
        $invoice = $quotation?->invoice;
        $full_payment_success = $invoice ? $payments->sum('payment_amount') >= $invoice->total_amount : ($quotation ? $payments->sum('payment_amount') >= $quotation->total_with_tax_vs_disc : false);

        // Set job_status based on conditions in sequence
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
}
