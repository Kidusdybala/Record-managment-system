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
            // Add document-related fields
            $table->string('document_path')->nullable()->after('body'); // Path to stored document file
            $table->string('document_name')->nullable()->after('document_path'); // Original filename
            $table->string('document_type')->nullable()->after('document_name'); // File type (pdf, doc, docx)
            $table->integer('document_size')->nullable()->after('document_type'); // File size in bytes
            $table->text('description')->nullable()->after('document_size'); // Brief description of the document
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('letters', function (Blueprint $table) {
            // Remove document-related fields
            $table->dropColumn(['document_path', 'document_name', 'document_type', 'document_size', 'description']);
        });
    }
};
