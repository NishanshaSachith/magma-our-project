<?php

use App\Models\CompanySetting;
use Illuminate\Support\Facades\Log;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Starting UTF-8 cleaning for company_name in company_settings table...\n";

$settings = CompanySetting::all();

foreach ($settings as $setting) {
    $original = $setting->company_name;
    // Remove invalid UTF-8 characters
    $cleaned = mb_convert_encoding($original, 'UTF-8', 'UTF-8');
    $cleaned = preg_replace('/[^\P{C}\n]+/u', '', $cleaned);

    if ($original !== $cleaned) {
        echo "Cleaning company_name for ID {$setting->id}: '{$original}' => '{$cleaned}'\n";
        $setting->company_name = $cleaned;
        $setting->save();
    }
}

echo "UTF-8 cleaning completed.\n";
