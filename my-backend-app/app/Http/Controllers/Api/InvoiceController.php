<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InvoiceController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $invoices = Invoice::with('quotation')->get();
        return response()->json($invoices);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'quotation_id' => 'required|exists:quotations,id',
            'invoice_no' => 'required|string|unique:invoices',
            'vat_no' => 'nullable|string',
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:pending,paid,overdue',
            'notes' => 'nullable|string',
        ]);

        $invoice = Invoice::create($validatedData);
        return response()->json($invoice, Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Invoice  $invoice
     * @return \Illuminate\Http\Response
     */
    public function show(Invoice $invoice)
    {
        return response()->json($invoice->load('quotation'));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Invoice  $invoice
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Invoice $invoice)
    {
        $validatedData = $request->validate([
            'quotation_id' => 'sometimes|required|exists:quotations,id',
            'invoice_no' => 'sometimes|required|string|unique:invoices,invoice_no,' . $invoice->id,
            'vat_no' => 'sometimes|nullable|string',
            'invoice_date' => 'sometimes|required|date',
            'due_date' => 'sometimes|nullable|date',
            'total_amount' => 'sometimes|required|numeric|min:0',
            'paid_amount' => 'sometimes|nullable|numeric|min:0',
            'status' => 'sometimes|nullable|in:pending,paid,overdue',
            'notes' => 'sometimes|nullable|string',
        ]);

        $invoice->update($validatedData);
        return response()->json($invoice);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Invoice  $invoice
     * @return \Illuminate\Http\Response
     */
    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Update invoice information by quotation ID.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updateInfo(Request $request)
    {
        $validatedData = $request->validate([
            'quotation_id' => 'required|exists:quotations,id',
            'invoice_no' => 'sometimes|required|string',
            'vat_no' => 'sometimes|nullable|string',
            'invoice_date' => 'sometimes|required|date',
            'notes' => 'sometimes|nullable|string',
        ]);

        $invoice = Invoice::where('quotation_id', $validatedData['quotation_id'])->first();

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found for this quotation.'], Response::HTTP_NOT_FOUND);
        }

        // Remove quotation_id from validated data as it's not a field in invoices table
        unset($validatedData['quotation_id']);

        $invoice->update($validatedData);
        return response()->json($invoice);
    }

    /**
     * Fetch invoice details by quotation ID.
     *
     * @param  int  $quotationId
     * @return \Illuminate\Http\Response
     */
    public function getByQuotationId($quotationId)
    {
        $invoice = Invoice::where('quotation_id', $quotationId)->with('quotation')->first();

        if (!$invoice) {
            return response()->json(null);
        }

        return response()->json($invoice);
    }
}
