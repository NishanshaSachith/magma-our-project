<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAreaBranchCustomerTables extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create areas table
        Schema::create('areas', function (Blueprint $table) {
            $table->id(); // same as AUTO_INCREMENT PRIMARY KEY
            $table->string('name', 100)->unique();
            $table->timestamps();
        });

        // 2. Create customers table
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name', 100);
            $table->string('email', 100)->unique()->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('address', 255)->nullable();
            $table->timestamps();
        });

        // 3. Create customer_area table
        Schema::create('customer_area', function (Blueprint $table) {
            $table->id('customer_area_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('area_id');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('area_id')->references('id')->on('areas')->onDelete('cascade');
        });

        // 4. Create branches table
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('phone_no', 20)->nullable();
            $table->unsignedBigInteger('customer_area_id');
            $table->timestamps();

            $table->foreign('customer_area_id')->references('customer_area_id')->on('customer_area')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branches');
        Schema::dropIfExists('customer_area');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('areas');
    }
}
