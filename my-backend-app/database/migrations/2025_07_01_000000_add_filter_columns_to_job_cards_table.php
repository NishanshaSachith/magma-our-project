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
        Schema::table('job_cards', function (Blueprint $table) {
            $table->boolean('oil_filter_state')->default(false);
            $table->string('oil_filter_value')->nullable();
            $table->boolean('air_filter_state')->default(false);
            $table->string('air_filter_value')->nullable();
            $table->boolean('oil_state')->default(false);
            $table->string('oil_value')->nullable();
            $table->boolean('fuel_filter_state')->default(false);
            $table->string('fuel_filter_value')->nullable();
            $table->boolean('battery_charge_state')->default(false);
            $table->string('battery_charge_value')->nullable();
            $table->string('battery_value')->nullable();
            $table->string('other_value')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_cards', function (Blueprint $table) {
            $table->dropColumn([
                'oil_filter_state',
                'oil_filter_value',
                'air_filter_state',
                'air_filter_value',
                'oil_state',
                'oil_value',
                'fuel_filter_state',
                'fuel_filter_value',
                'battery_charge_state',
                'battery_charge_value',
                'battery_value',
                'other_value',
            ]);
        });
    }
};
