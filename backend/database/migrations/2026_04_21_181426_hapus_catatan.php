<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monitoring', function (Blueprint $table) {
            $table->dropColumn('catatan_monitoring');
        });
    }

    public function down(): void
    {
        Schema::table('monitoring', function (Blueprint $table) {
            $table->string('catatan_monitoring', 100)->nullable();
        });
    }
};