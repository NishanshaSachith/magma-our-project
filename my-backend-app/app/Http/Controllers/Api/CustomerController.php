<?php
declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Area;
use App\Models\CustomerArea;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    public function index()
    {
        // Load customers with their areas and branches
        $customers = Customer::with([
            'customerAreas.area',
            'customerAreas.branches'
        ])->get();

        $customersTransformed = $customers->map(function ($customer) {
            $areasWithBranches = $customer->customerAreas->map(function ($customerArea) {
                return [
                    'id' => $customerArea->area->id,
                    'areaName' => $customerArea->area->name,
                    'branches' => $customerArea->branches->map(function ($branch) {
                        return [
                            'id' => $branch->id,
                            'branchName' => $branch->name,
                            'branchPhone' => $branch->phone_no,
                        ];
                    }),
                ];
            });

            return [
                'id' => $customer->id,
                'customer_id' => $customer->id,
                'customer_name' => $customer->customer_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'areas' => $areasWithBranches,
            ];
        });

        return response()->json($customersTransformed);
    }

    public function show($id)
    {
        $customer = Customer::with([
            'customerAreas.area',
            'customerAreas.branches'
        ])->findOrFail($id);

        $areasWithBranches = $customer->customerAreas->map(function ($customerArea) {
            return [
                'id' => $customerArea->area->id,
                'areaName' => $customerArea->area->name,
                'branches' => $customerArea->branches->map(function ($branch) {
                    return [
                        'id' => $branch->id,
                        'branchName' => $branch->name,
                        'branchPhone' => $branch->phone_no,
                    ];
                }),
            ];
        });

        $response = [
            'id' => $customer->id,
            'customer_name' => $customer->customer_name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'address' => $customer->address,
            'areas' => $areasWithBranches,
        ];

        Log::debug('Customer show response', ['response' => $response]);
        return response()->json($response);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:100',
            'email' => 'nullable|email|unique:customers,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'areas' => 'array',
            'areas.*.areaName' => 'required|string|max:100',
            'areas.*.branches' => 'array',
            'areas.*.branches.*.branchName' => 'required|string|max:100',
            'areas.*.branches.*.branchPhone' => 'nullable|string|max:20',
        ]);

        DB::beginTransaction();
        try {
            $customer = Customer::create([
                'customer_name' => $validated['customer_name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
            ]);

            if (!empty($validated['areas'])) {
                foreach ($validated['areas'] as $areaData) {
                    // Find or create area
                    $area = Area::firstOrCreate(['name' => $areaData['areaName']]);
                    
                    // Create customer area relationship
                    $customerArea = CustomerArea::create([
                        'customer_id' => $customer->id,
                        'area_id' => $area->id,
                    ]);

                    // Create branches for this customer area
                    foreach ($areaData['branches'] as $branchData) {
                        Branch::create([
                            'name' => $branchData['branchName'],
                            'phone_no' => $branchData['branchPhone'] ?? null,
                            'customer_area_id' => $customerArea->customer_area_id,
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json($customer, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create customer', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to save customer', 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'customer_name' => 'required|string|max:100',
            'email' => 'nullable|email|unique:customers,email,' . $customer->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'areas' => 'array',
            'areas.*.areaName' => 'required|string|max:100',
            'areas.*.branches' => 'array',
            'areas.*.branches.*.branchName' => 'required|string|max:100',
            'areas.*.branches.*.branchPhone' => 'nullable|string|max:20',
        ]);

        DB::beginTransaction();
        try {
            $customer->update([
                'customer_name' => $validated['customer_name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
            ]);

            // Delete all existing customer areas and their branches
            $customer->customerAreas()->delete();
            
            // Delete branches that belong to this customer
            Branch::whereIn('customer_area_id', 
                CustomerArea::where('customer_id', $customer->id)->pluck('customer_area_id')
            )->delete();

            if (!empty($validated['areas'])) {
                foreach ($validated['areas'] as $areaData) {
                    // Find or create area
                    $area = Area::firstOrCreate(['name' => $areaData['areaName']]);
                    
                    // Create customer area relationship
                    $customerArea = CustomerArea::create([
                        'customer_id' => $customer->id,
                        'area_id' => $area->id,
                    ]);

                    // Create branches for this customer area
                    foreach ($areaData['branches'] as $branchData) {
                        Branch::create([
                            'name' => $branchData['branchName'],
                            'phone_no' => $branchData['branchPhone'] ?? null,
                            'customer_area_id' => $customerArea->customer_area_id,
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json($customer);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update customer', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to update customer', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            
            $customer = Customer::findOrFail($id);
            
            // Delete branches first
            Branch::whereIn('customer_area_id', 
                CustomerArea::where('customer_id', $customer->id)->pluck('customer_area_id')
            )->delete();
            
            // Delete customer areas
            $customer->customerAreas()->delete();
            
            // Delete customer
            $customer->delete();
            
            DB::commit();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete customer', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to delete customer', 'message' => $e->getMessage()], 500);
        }
    }

    public function areas()
    {
        $areas = Area::with('branches')->get();
        return response()->json($areas);
    }
}