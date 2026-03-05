<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Presensi;

class AutoPulangCommand extends Command
{
    protected $signature   = 'absensi:auto-pulang';
    protected $description = 'Otomatis isi waktu_pulang jam 23:59 untuk siswa yang belum absen pulang';

    public function handle()
    {
        // Ambil semua absensi hari ini yang sudah masuk tapi belum pulang
        $belumPulang = Presensi::whereDate('tanggal_absensi', today())
            ->whereNotNull('waktu_absensi')
            ->whereNull('waktu_pulang')
            ->get();

        if ($belumPulang->isEmpty()) {
            $this->info('Tidak ada siswa yang perlu di-auto pulang.');
            return;
        }

        foreach ($belumPulang as $absensi) {
            $absensi->update(['waktu_pulang' => '23:59:00']);
        }

        $this->info("Auto pulang berhasil untuk {$belumPulang->count()} siswa.");
    }
}