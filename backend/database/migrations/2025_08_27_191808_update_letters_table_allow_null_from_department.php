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
        Schema::table('letters', function (Blueprint $table) {
            // Drop the existing foreign key constraint
            $table->dropForeign(['from_department_id']);
            
            // Drop the column
            $table->dropColumn('from_department_id');
            
            // Recreate the column as nullable
            $table->foreignId('from_department_id')->nullable()->constrained('departments')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('letters', function (Blueprint $table) {
            // Drop the nullable column
            $table->dropForeign(['from_department_id']);
            $table->dropColumn('from_department_id');
            
            // Recreate the original non-nullable column
            $table->foreignId('from_department_id')->constrained('departments')->cascadeOnDelete();
        });
    }
};
