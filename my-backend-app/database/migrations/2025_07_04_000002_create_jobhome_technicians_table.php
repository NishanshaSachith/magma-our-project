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
        Schema::create('jobhome_technicians', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('jobhome_id');
            $table->unsignedBigInteger('user_id');
            $table->string('technician_name');
            $table->date('assign_date');
            $table->timestamps();

            $table->foreign('jobhome_id')->references('id')->on('job_homes')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jobhome_technicians');
    }
};
