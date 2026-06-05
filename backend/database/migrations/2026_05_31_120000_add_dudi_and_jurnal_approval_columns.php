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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'id_dudi')) {
                $table->unsignedBigInteger('id_dudi')->nullable()->after('id_users');
            }
        });

        Schema::table('jurnal_harian', function (Blueprint $table) {
            if (!Schema::hasColumn('jurnal_harian', 'status_jurnal_harian')) {
                $table->enum('status_jurnal_harian', ['pending', 'approved', 'rejected'])->default('pending')->after('kegiatan_jurnal_harian');
            }
            if (!Schema::hasColumn('jurnal_harian', 'approved_by')) {
                $table->unsignedBigInteger('approved_by')->nullable()->after('status_jurnal_harian');
            }
            if (!Schema::hasColumn('jurnal_harian', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            }
            if (!Schema::hasColumn('jurnal_harian', 'catatan_approval')) {
                $table->text('catatan_approval')->nullable()->after('approved_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jurnal_harian', function (Blueprint $table) {
            if (Schema::hasColumn('jurnal_harian', 'catatan_approval')) {
                $table->dropColumn('catatan_approval');
            }
            if (Schema::hasColumn('jurnal_harian', 'approved_at')) {
                $table->dropColumn('approved_at');
            }
            if (Schema::hasColumn('jurnal_harian', 'approved_by')) {
                $table->dropColumn('approved_by');
            }
            if (Schema::hasColumn('jurnal_harian', 'status_jurnal_harian')) {
                $table->dropColumn('status_jurnal_harian');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'id_dudi')) {
                $table->dropColumn('id_dudi');
            }
        });
    }
};
