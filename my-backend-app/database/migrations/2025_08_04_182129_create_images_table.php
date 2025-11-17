<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('description_id')->constrained('descriptions')->cascadeOnDelete();
            $table->string('image_path');
            $table->string('original_name')->nullable(); // Add this
            $table->integer('file_size')->nullable();    // And this
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('images');
    }
};