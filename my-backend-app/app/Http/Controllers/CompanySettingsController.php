<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage; // Make sure to use Storage for file handling if needed, though we're doing base64

class CompanySettingsController extends Controller
{
    /**
     * Display the current company settings.
     */
    public function show()
    {
        $settings = CompanySetting::first();

        if (!$settings) {
            return response()->json([
                'company_name' => 'Add Company Name',
                'logo_url' => null,
                'account_name' => null,
                'account_number' => null,
                'bank_name' => null,
                'bank_branch' => null,
                'head_of_technical_name' => null,
                'head_of_technical_contact' => null,
            ]);
        }

        $logoUrl = $settings->logo
            ? route('company.logo', ['id' => $settings->id, 't' => $settings->updated_at->timestamp])
            : null;

        return response()->json([
            'company_name' => $settings->company_name,
            'logo_url' => $logoUrl,
            'account_name' => $settings->account_name,
            'account_number' => $settings->account_number,
            'bank_name' => $settings->bank_name,
            'bank_branch' => $settings->bank_branch,
            'head_of_technical_name' => $settings->head_of_technical_name,
            'head_of_technical_contact' => $settings->head_of_technical_contact,
        ]);
    }

    /**
     * Update the company settings.
     */
    public function update(Request $request)
    {
        $request->validate([
            'company_name' => 'nullable|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'remove_logo' => 'nullable|boolean',
            'account_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'bank_branch' => 'nullable|string|max:255',
            'head_of_technical_name' => 'nullable|string|max:255',
            'head_of_technical_contact' => 'nullable|string|max:255',
        ]);

        $settings = CompanySetting::firstOrCreate([]);

        $settings->company_name = $request->input('company_name', $settings->company_name);
        $settings->account_name = $request->input('account_name', $settings->account_name);
        $settings->account_number = $request->input('account_number', $settings->account_number);
        $settings->bank_name = $request->input('bank_name', $settings->bank_name);
        $settings->bank_branch = $request->input('bank_branch', $settings->bank_branch);
        $settings->head_of_technical_name = $request->input('head_of_technical_name', $settings->head_of_technical_name);
        $settings->head_of_technical_contact = $request->input('head_of_technical_contact', $settings->head_of_technical_contact);

        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $settings->logo = base64_encode(file_get_contents($file->getRealPath()));
            $settings->logo_mime = $file->getMimeType();
        } elseif ($request->boolean('remove_logo')) {
            $settings->logo = null;
            $settings->logo_mime = null;
        }

        $settings->save();

        $logoUrl = $settings->logo
            ? route('company.logo', ['id' => $settings->id, 't' => $settings->updated_at->timestamp])
            : null;

        return response()->json([
            'message' => 'Company settings updated successfully!',
            'settings' => [
                'company_name' => $settings->company_name,
                'logo_url' => $logoUrl,
                'account_name' => $settings->account_name,
                'account_number' => $settings->account_number,
                'bank_name' => $settings->bank_name,
                'bank_branch' => $settings->bank_branch,
                'head_of_technical_name' => $settings->head_of_technical_name,
                'head_of_technical_contact' => $settings->head_of_technical_contact,
            ],
        ]);
    }

    /**
     * Serve the company logo.
     */
    public function logo($id)
    {
        $settings = CompanySetting::findOrFail($id);

        if (!$settings->logo) {
            abort(404, 'Logo not found.');
        }

        $mime = $settings->logo_mime ?? 'image/png';

        // BASE64 DECODE the stored data before returning as a binary response
        return Response::make(base64_decode($settings->logo), 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="logo"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => 'Fri, 01 Jan 1990 00:00:00 GMT',
        ]);
    }
}