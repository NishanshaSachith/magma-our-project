<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Description;
use App\Models\Image;
use Illuminate\Support\Facades\Storage;

class ImageUploadController extends Controller
{
    /**
     * Display images for a specific job_home_id
     *
     * @param  int  $jobHomeId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getImages($jobHomeId)
    {
        try {
            // Get all images for this job_home through descriptions
            $images = Image::select('images.*', 'descriptions.description', 'descriptions.job_home_id')
                ->join('descriptions', 'images.description_id', '=', 'descriptions.id')
                ->where('descriptions.job_home_id', $jobHomeId)
                ->orderBy('images.created_at', 'desc')
                ->get()
                ->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'image_path' => $image->image_path,
                        'original_name' => $image->original_name,
                        'file_size' => $image->file_size,
                        'description' => $image->description,
                        'created_at' => $image->created_at,
                        'updated_at' => $image->updated_at
                    ];
                });

            return response()->json([
                'images' => $images
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch images',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of descriptions with their images.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $request->validate([
            'job_home_id' => 'required|integer|exists:job_homes,id'
        ]);

        $descriptions = Description::with('images')
            ->where('job_home_id', $request->job_home_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $descriptions
        ]);
    }

    /**
     * Store a newly created description with images.
     *
     * @param  int  $jobHomeId
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store($jobHomeId, Request $request)
    {
        try {
            $request->validate([
                'description' => 'nullable|string|max:1000',
                'images' => 'required|array',
                'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:20480'
            ]);

            // Create the description
            $description = Description::create([
                'job_home_id' => $jobHomeId,
                'description' => $request->description ?? 'No description provided'
            ]);

            // Handle image uploads
            $uploadedImages = [];
           
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $path = $image->store('images', 'public');
                   
                    $imageRecord = Image::create([
                        'description_id' => $description->id,
                        'image_path' => Storage::url($path),
                        'original_name' => $image->getClientOriginalName(),
                        'file_size' => $image->getSize()
                    ]);

                    // Format the response to match frontend expectations
                    $uploadedImages[] = [
                        'id' => $imageRecord->id,
                        'image_path' => $imageRecord->image_path,
                        'original_name' => $imageRecord->original_name,
                        'file_size' => $imageRecord->file_size,
                        'description' => $description->description,
                        'created_at' => $imageRecord->created_at,
                        'updated_at' => $imageRecord->updated_at
                    ];
                }
            }

            return response()->json([
                'message' => 'Images uploaded successfully',
                'description' => $description,
                'images' => $uploadedImages
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified image from storage.
     *
     * @param  int  $jobHomeId
     * @param  int  $imageId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($jobHomeId, $imageId)
    {
        try {
            // Find the image and verify it belongs to the correct job_home
            $image = Image::select('images.*')
                ->join('descriptions', 'images.description_id', '=', 'descriptions.id')
                ->where('descriptions.job_home_id', $jobHomeId)
                ->where('images.id', $imageId)
                ->firstOrFail();
           
            // Delete the file from storage
            $path = str_replace('/storage/', '', $image->image_path);
            Storage::disk('public')->delete($path);
           
            // Delete the database record
            $image->delete();

            // Check if the description has no more images, optionally delete it
            $description = Description::find($image->description_id);
            if ($description && $description->images()->count() === 0) {
                $description->delete();
            }
           
            return response()->json([
                'message' => 'Image deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete image',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}