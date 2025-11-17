<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('job_homes', function (Blueprint $table) {
            $table->id();
            $table->string('job_no')->unique()->nullable(); // will be filled after creation
            $table->string('job_type');
            $table->boolean('service_start')->default(false);
            $table->boolean('service_end')->default(false);
            $table->boolean('customer_ok')->default(false);
            $table->boolean('special_approve')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_homes');
    }
};
