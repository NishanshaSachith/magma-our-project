<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use App\Models\JobCard; // Add this import
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class QuotationController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        // Retrieve all quotations from the database
        $quotations = Quotation::all();

        // Return a JSON response with the quotations
        return response()->json($quotations);
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
        'job_card_id' => 'required|exists:job_cards,id',
        'attention' => 'nullable|string',
        'quotation_no' => 'nullable|string',
        'select_date' => 'nullable|date',
        'region' => 'nullable|string',
        'ref_qtn' => 'nullable|string',
        'site' => 'nullable|string',
        'job_date' => 'nullable|date',
        'fam_no' => 'nullable|string',
        'complain_nature' => 'nullable|string',
        'po_no' => 'nullable|string',
        'po_date' => 'nullable|date',
        'actual_break_down' => 'nullable|string',
        'tender_no' => 'nullable|string',
        'signed_date' => 'nullable|date',
        'total_without_tax' => 'nullable|numeric',
        'vat' => 'nullable|numeric',
        'total_with_tax' => 'nullable|numeric',
        'discount' => 'nullable|numeric',
        'total_with_tax_vs_disc' => 'nullable|numeric',
        'special_note' => 'nullable|string',
    ]);

    // Check if a quotation already exists for this job card
    $existingQuotation = Quotation::where('job_card_id', $validatedData['job_card_id'])->first();

    if ($existingQuotation) {
        return response()->json([
            'message' => 'Quotation already exists.',
            'quotation' => $existingQuotation
        ], Response::HTTP_OK);
    }

    // Create a new quotation
    $quotation = Quotation::create($validatedData);

    return response()->json($quotation, Response::HTTP_CREATED);
}
    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Quotation  $quotation
     * @return \Illuminate\Http\Response
     */
    public function show(Quotation $quotation)
    {
        // The $quotation model is automatically resolved by route model binding
        // Return a JSON response with the specific quotation
        return response()->json($quotation);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Quotation  $quotation
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Quotation $quotation)
    {
        // Validate the incoming request data
        $validatedData = $request->validate([
            'job_card_id' => 'sometimes|required|exists:job_cards,id',
            'attention' => 'sometimes|nullable|string',
            'quotation_no' => 'sometimes|nullable|string',
            'select_date' => 'sometimes|nullable|date',
            // Use 'sometimes' for all fields that are not always required for updates
            'region' => 'sometimes|nullable|string',
            'ref_qtn' => 'sometimes|nullable|string',
            'site' => 'sometimes|nullable|string',
            'job_date' => 'sometimes|nullable|date',
            'fam_no' => 'sometimes|nullable|string',
            'complain_nature' => 'sometimes|nullable|string',
            'po_no' => 'sometimes|nullable|string',
            'po_date' => 'sometimes|nullable|date',
            'actual_break_down' => 'sometimes|nullable|string',
            'tender_no' => 'sometimes|nullable|string',
            'signed_date' => 'sometimes|nullable|date',
            'total_without_tax' => 'sometimes|nullable|numeric',
            'vat' => 'sometimes|nullable|numeric',
            'total_with_tax' => 'sometimes|nullable|numeric',
            'discount' => 'sometimes|nullable|numeric',
            'total_with_tax_vs_disc' => 'sometimes|nullable|numeric',
            'special_note' => 'sometimes|nullable|string',
        ]);

        // Update the quotation with the validated data
        $quotation->update($validatedData);

        // Return a JSON response with the updated quotation
        return response()->json($quotation);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Quotation  $quotation
     * @return \Illuminate\Http\Response
     */
    public function destroy(Quotation $quotation)
    {
        // The $quotation model is automatically resolved
        $quotation->delete();

        // Return a no-content response
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function itemshow($jobCardId)
    {
        try {
            // Find the Quotation associated with the given jobCardId
            // Eager load the chain: Quotation -> JobCard -> JobHome -> JobItems
            $quotation = Quotation::where('job_card_id', $jobCardId)
                      ->with('jobCard.jobHome.jobItems')  // Correct eager load
                      ->first();

            // Check if the quotation exists
            if (!$quotation) {
                return response()->json(['message' => 'Quotation not found for this Job Card.'], Response::HTTP_NOT_FOUND);
            }

            // Safely access the job items through the relationship chain
            // Use null coalescing operator (??) and collect() to handle cases where relationships might be missing
            $jobItems = $quotation->jobCard->jobHome->jobItems ?? collect();

            // Map the items to a more front-end friendly format
            $items = $jobItems->map(function ($item) {
                // Ensure unit_price and quantity are treated as numbers for calculation
                $unitPrice = (float)$item->unit_price;
                $quantity = (int)$item->quantity;
                $unitTotalPrice = $quantity * $unitPrice;

                return [
                    'id' => $item->id,
                    'materialsNo' => $item->materials_no,
                    'description' => $item->materials,
                    'unitPrice' => $unitPrice,
                    'quantity' => $quantity,
                    'unitTotalPrice' => (float)number_format($unitTotalPrice, 2, '.', ''),
                ];
            });

            // Calculate totals
            $subtotal = $items->sum('unitTotalPrice');
            $taxRate = 0.10; // 10% tax
            $tax = $subtotal * $taxRate;
            $grandTotal = $subtotal + $tax;

            // Prepare the final JSON response with all quotation fields
            return response()->json([
                'id' => $quotation->id,
                'job_card_id' => $quotation->job_card_id,
                'attention' => $quotation->attention,
                'quotation_no' => $quotation->quotation_no,
                'select_date' => $quotation->select_date,
                'region' => $quotation->region,
                'ref_qtn' => $quotation->ref_qtn,
                'site' => $quotation->site,
                'job_date' => $quotation->job_date,
                'fam_no' => $quotation->fam_no,
                'complain_nature' => $quotation->complain_nature,
                'po_no' => $quotation->po_no,
                'po_date' => $quotation->po_date,
                'actual_break_down' => $quotation->actual_break_down,
                'tender_no' => $quotation->tender_no,
                'signed_date' => $quotation->signed_date,
                'total_without_tax' => $quotation->total_without_tax,
                'vat' => $quotation->vat,
                'total_with_tax' => $quotation->total_with_tax,
                'discount' => $quotation->discount,
                'total_with_tax_vs_disc' => $quotation->total_with_tax_vs_disc,
                'special_note' => $quotation->special_note,
                // Safely access customer name from the JobCard
                'customer_name' => $quotation->jobCard->customer_name ?? null,
                'items' => $items,
                'subtotal' => (float)number_format($subtotal, 2, '.', ''),
                'tax' => (float)number_format($tax, 2, '.', ''),
                'grandTotal' => (float)number_format($grandTotal, 2, '.', ''),
            ]);

        } catch (\Exception $e) {
            // Log the error for debugging purposes
            Log::error('Error fetching quotation details: ' . $e->getMessage());

            // Return a generic server error response
            return response()->json(['message' => 'Internal server error.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get quotation by quotation ID with full data (for Invoice component)
     *
     * @param  int  $quotationId
     * @return \Illuminate\Http\Response
     */
    public function getById($quotationId)
    {
        try {
            // Find the Quotation by ID
            $quotation = Quotation::with('jobCard.jobHome.jobItems')
                      ->find($quotationId);

            // Check if the quotation exists
            if (!$quotation) {
                return response()->json(['message' => 'Quotation not found.'], Response::HTTP_NOT_FOUND);
            }

            // Safely access the job items through the relationship chain
            $jobItems = $quotation->jobCard->jobHome->jobItems ?? collect();

            // Map the items to a more front-end friendly format
            $items = $jobItems->map(function ($item) {
                // Ensure unit_price and quantity are treated as numbers for calculation
                $unitPrice = (float)$item->unit_price;
                $quantity = (int)$item->quantity;
                $unitTotalPrice = $quantity * $unitPrice;

                return [
                    'id' => $item->id,
                    'materialsNo' => $item->materials_no,
                    'description' => $item->materials,
                    'unitPrice' => $unitPrice,
                    'quantity' => $quantity,
                    'unitTotalPrice' => (float)number_format($unitTotalPrice, 2, '.', ''),
                ];
            });

            // Calculate totals
            $subtotal = $items->sum('unitTotalPrice');
            $taxRate = 0.10; // 10% tax
            $tax = $subtotal * $taxRate;
            $grandTotal = $subtotal + $tax;

            // Prepare the final JSON response with all quotation fields
            return response()->json([
                'id' => $quotation->id,
                'job_card_id' => $quotation->job_card_id,
                'attention' => $quotation->attention,
                'quotation_no' => $quotation->quotation_no,
                'select_date' => $quotation->select_date,
                'region' => $quotation->region,
                'ref_qtn' => $quotation->ref_qtn,
                'site' => $quotation->site,
                'job_date' => $quotation->job_date,
                'fam_no' => $quotation->fam_no,
                'complain_nature' => $quotation->complain_nature,
                'po_no' => $quotation->po_no,
                'po_date' => $quotation->po_date,
                'actual_break_down' => $quotation->actual_break_down,
                'tender_no' => $quotation->tender_no,
                'signed_date' => $quotation->signed_date,
                'total_without_tax' => $quotation->total_without_tax,
                'vat' => $quotation->vat,
                'total_with_tax' => $quotation->total_with_tax,
                'discount' => $quotation->discount,
                'total_with_tax_vs_disc' => $quotation->total_with_tax_vs_disc,
                'special_note' => $quotation->special_note,
                // Safely access customer name from the JobCard
                'customer_name' => $quotation->jobCard->customer_name ?? null,
                'items' => $items,
                'subtotal' => (float)number_format($subtotal, 2, '.', ''),
                'tax' => (float)number_format($tax, 2, '.', ''),
                'grandTotal' => (float)number_format($grandTotal, 2, '.', ''),
            ]);

        } catch (\Exception $e) {
            // Log the error for debugging purposes
            Log::error('Error fetching quotation by ID: ' . $e->getMessage());

            // Return a generic server error response
            return response()->json(['message' => 'Internal server error.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update only the unit_price of items associated with a JobCard via Quotation.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $jobCardId
     * @return \Illuminate\Http\Response
     */
    public function updatePrices(Request $request, $jobCardId)
    {
        // Validate the incoming request data
        $validatedData = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:job_items,id',
            'items.*.description' => 'nullable|string',
            'items.*.unitPrice' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:0',
        ]);

        try {
            // Find the quotation related to the jobCardId
           $quotation = Quotation::where('job_card_id', $jobCardId)
                      ->with('jobCard.jobHome.jobItems')  // Correct eager load
                      ->first();

            if (!$quotation || !$quotation->jobCard || !$quotation->jobCard->jobHome) {
                return response()->json(['message' => 'Quotation or associated Job Home not found.'], Response::HTTP_NOT_FOUND);
            }

            $jobHome = $quotation->jobCard->jobHome;

            // Loop through the items received from the frontend and update the fields
            foreach ($validatedData['items'] as $itemData) {
                // Find the specific JobItem that belongs to this JobHome
                $item = $jobHome->jobItems()->find($itemData['id']);

                if ($item) {
                    $item->update([
                        'materials' => $itemData['description'],
                        'unit_price' => $itemData['unitPrice'],
                        'quantity' => $itemData['quantity'],
                    ]);
                }
            }

            // Optionally, you might want to recalculate and update totals on the Quotation model
            // if they are stored in the database. This would require fetching the updated items
            // and then updating the Quotation model.

            return response()->json(['message' => 'Items updated successfully.']);

        } catch (\Exception $e) {
            Log::error('Error updating items: ' . $e->getMessage());
            return response()->json(['message' => 'Internal server error.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get quotation total by job home id (similar to MessageController getPersons method)
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getTotalByJobHomeId(Request $request)
    {
        try {
            $jobHomeId = $request->query('job_home_id');

            if (!$jobHomeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'job_home_id is required'
                ], 400);
            }

            // Find the job home and its related job card
            $jobHome = \App\Models\JobHome::with('jobCard')->find($jobHomeId);

            if (!$jobHome) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job home not found'
                ], 404);
            }

            if (!$jobHome->jobCard) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job card not found for this job home'
                ], 404);
            }

            // Find quotation by job card id
            $quotation = Quotation::where('job_card_id', $jobHome->jobCard->id)->first();

            if (!$quotation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quotation not found for this job card'
                ], 404);
            }

            // Calculate total if total_with_tax_vs_disc is null
            $total = $quotation->total_with_tax_vs_disc;
            if ($total === null) {
                // Get job items and calculate total
                $jobItems = $jobHome->jobCard->jobHome->jobItems ?? collect();
                $subtotal = $jobItems->sum(function ($item) {
                    return (float)$item->unit_price * (int)$item->quantity;
                });
                
                $vatPercent = (float)($quotation->vat ?? 0);
                $discountPercent = (float)($quotation->discount ?? 0);
                
                $tax = $subtotal * ($vatPercent / 100);
                $discount = $subtotal * ($discountPercent / 100);
                $total = $subtotal + $tax - $discount;
            }

            return response()->json([
                'success' => true,
                'total_with_tax_vs_disc' => (float)$total,
                'quotation_id' => $quotation->id,
                'job_card_id' => $jobHome->jobCard->id
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching quotation total by job home ID: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch quotation total',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}