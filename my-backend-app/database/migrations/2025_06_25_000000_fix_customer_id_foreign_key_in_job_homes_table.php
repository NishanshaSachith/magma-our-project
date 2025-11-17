<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class FixCustomerIdForeignKeyInJobHomesTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('job_homes', function (Blueprint $table) {
            // Drop existing foreign key if exists
            $table->dropForeign(['customer_id']);
            // Drop the customer_id column
            $table->dropColumn('customer_id');

            // Add customer_id column with correct type
            $table->unsignedBigInteger('customer_id')->nullable()->after('id');

            // Add foreign key constraint
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_homes', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn('customer_id');
        });
    }
}
