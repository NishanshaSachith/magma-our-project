<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Area;

class AreaController extends Controller
{
    public function index()
    {
        $areas = Area::with('branches')->get();
        return response()->json($areas);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:areas,name',
        ]);

        $area = Area::create([
            'name' => $validated['name'],
        ]);

        return response()->json($area, 201);
    }

    public function show($id)
    {
        $area = Area::with('branches')->findOrFail($id);
        return response()->json($area);
    }

    public function update(Request $request, $id)
    {
        $area = Area::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:areas,name,' . $area->id,
        ]);

        $area->update([
            'name' => $validated['name'],
        ]);

        return response()->json($area);
    }

    public function destroy($id)
    {
        $area = Area::findOrFail($id);
        $area->delete();
        return response()->json(null, 204);
    }
}
