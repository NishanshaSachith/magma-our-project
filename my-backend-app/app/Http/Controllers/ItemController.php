<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $items = Item::all();
        return response()->json($items);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'itemName' => 'required|string|max:255',
                'serviceTimeout' => 'nullable|string|max:255',
                'icon' => 'nullable|string|max:255',
            ]);

            $item = Item::create([
                'name' => $validatedData['itemName'],
                'service_timeout' => $validatedData['serviceTimeout'],
                'icon' => $validatedData['icon'],
            ]);

            return response()->json([
                'message' => 'Item added successfully!',
                'item' => $item
            ], 201); // 201 Created
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation Error',
                'errors' => $e->errors()
            ], 422); // 422 Unprocessable Entity
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while adding the item.',
                'error' => $e->getMessage()
            ], 500); // 500 Internal Server Error
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
public function update(Request $request, string $id)
    {
        try {
            $item = Item::findOrFail($id);

            $item->name = $request['itemName'];
            $item->service_timeout = $request['serviceTimeout'];
            $item->icon = $request['icon'];
            
            $item->save();

            return response()->json([
                'message' => 'Item updated successfully!',
                'item' => $item
            ], 200); // 200 OK
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation Error',
                'errors' => $e->errors()
            ], 422); // 422 Unprocessable Entity
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while updating the item.',
                'error' => $e->getMessage()
            ], 500); // 500 Internal Server Error
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $item = Item::findOrFail($id);
            $item->delete();

            return response()->json([
                'message' => 'Item deleted successfully!'
            ], 200); // 200 OK
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while deleting the item.',
                'error' => $e->getMessage()
            ], 500); // 500 Internal Server Error
        }
    }
}