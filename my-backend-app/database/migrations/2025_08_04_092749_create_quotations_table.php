<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateQuotationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_card_id');
            $table->string('attention')->nullable();
            $table->string('quotation_no')->nullable();
            $table->date('select_date')->nullable();
            $table->string('region')->nullable();
            $table->string('ref_qtn')->nullable();
            $table->string('site')->nullable();
            $table->date('job_date')->nullable();
            $table->string('fam_no')->nullable();
            $table->text('complain_nature')->nullable();
            $table->string('po_no')->nullable();
            $table->date('po_date')->nullable();
            $table->text('actual_break_down')->nullable();
            $table->string('tender_no')->nullable();
            $table->date('signed_date')->nullable();
            $table->decimal('total_without_tax', 10, 2)->nullable();
            $table->decimal('vat', 10, 2)->nullable();
            $table->decimal('total_with_tax', 10, 2)->nullable();
            $table->decimal('discount', 10, 2)->nullable();
            $table->decimal('total_with_tax_vs_disc', 10, 2)->nullable();
            $table->text('special_note')->nullable();
            $table->timestamps();

            $table->foreign('job_card_id')->references('id')->on('job_cards')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('quotations');
    }
}