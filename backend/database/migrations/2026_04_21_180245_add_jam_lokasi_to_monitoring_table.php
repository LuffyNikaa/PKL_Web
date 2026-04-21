<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monitoring', function (Blueprint $table) {
            $table->time('jam_monitoring')->nullable()->after('tanggal_monitoring');
            $table->string('lokasi_monitoring', 150)->nullable()->after('jam_monitoring');
            // Ubah status jadi dijadwalkan/selesai
            $table->enum('status_monitoring', ['dijadwalkan', 'selesai'])
                ->default('dijadwalkan')->change();
        });
    }

    public function down(): void
    {
        Schema::table('monitoring', function (Blueprint $table) {
            $table->dropColumn(['jam_monitoring', 'lokasi_monitoring']);
        });
    }
};