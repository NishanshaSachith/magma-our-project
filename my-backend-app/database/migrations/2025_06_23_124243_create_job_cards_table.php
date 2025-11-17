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
        Schema::create('job_cards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_home_id');
            $table->date('selected_date');
            $table->string('customer_name');
            $table->string('fam_no');
            $table->string('contact_person')->nullable();
            $table->string('area')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('branch_sc')->nullable();
            $table->string('generator_make')->nullable();
            $table->string('kva')->nullable();
            $table->string('engine_make')->nullable();
            $table->string('last_service')->nullable();
            $table->string('alternator_make')->nullable();
            $table->string('gen_model')->nullable();
            $table->string('controller_module')->nullable();
            $table->string('avr')->nullable();
            $table->string('ats_info')->nullable();
            $table->text('job_description')->nullable();
            $table->text('filters')->nullable();
            $table->timestamps();

            $table->foreign('job_home_id')->references('id')->on('job_homes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_cards');
    }
};
