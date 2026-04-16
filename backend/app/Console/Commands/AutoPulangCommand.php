<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Presensi;
use App\Models\JurnalHarian;

class AutoPulangCommand extends Command
{
    protected $signature   = 'absensi:auto-pulang';
    protected $description = 'Otomatis isi waktu_pulang jam 23:59 untuk siswa yang belum absen pulang';

    public function handle()
    {
        $belumPulang = Presensi::whereDate('tanggal_absensi', today())
            ->whereNotNull('waktu_absensi')
            ->whereNull('waktu_pulang')
            ->get();

        if ($belumPulang->isEmpty()) {
            $this->info('Tidak ada siswa yang perlu di-auto pulang.');
            return;
        }

        foreach ($belumPulang as $absensi) {
            // Cek jurnal hari ini — hadir wajib punya jurnal sebelum auto pulang
            if ($absensi->status_absensi === 'hadir') {
                $jurnal = JurnalHarian::where('id_siswa', $absensi->id_siswa)
                    ->whereDate('tanggal_jurnal_harian', today())
                    ->first();

                // Kalau belum ada jurnal, auto buat jurnal kosong
                if (!$jurnal) {
                    JurnalHarian::create([
                        'id_siswa'               => $absensi->id_siswa,
                        'id_user'                => $absensi->id_user,
                        'id_dudi'                => $absensi->id_dudi,
                        'tanggal_jurnal_harian'  => today()->toDateString(),
                        'kegiatan_jurnal_harian' => 'Tidak mengisi jurnal harian',
                    ]);
                }
            }

            $absensi->update(['waktu_pulang' => '23:59:00']);
        }

        $this->info("Auto pulang berhasil untuk {$belumPulang->count()} siswa.");
    }
}