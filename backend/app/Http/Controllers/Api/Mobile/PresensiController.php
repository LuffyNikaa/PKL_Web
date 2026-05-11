<?php

namespace App\Http\Controllers\API\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Siswa;
use App\Models\Presensi;
use App\Models\JurnalHarian;
use App\Models\Penempatan;
use App\Models\Periode;
use Carbon\Carbon;

class PresensiController extends Controller
{
    private function hitungJarak(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $R    = 6371000;
        $phi1 = deg2rad($lat1);
        $phi2 = deg2rad($lat2);
        $dphi = deg2rad($lat2 - $lat1);
        $dlam = deg2rad($lon2 - $lon1);
        $a    = sin($dphi / 2) ** 2 + cos($phi1) * cos($phi2) * sin($dlam / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    // GET /api/mobile/absensi/status
    public function status(Request $request)
    {
        try {
            $user = $request->user();
            $siswa = Siswa::where('id_users', $user->id_users)->first();
            
            if (!$siswa) {
                return response()->json(['status' => 'belum']);
            }

            // ✅ Cari penempatan aktif dengan join ke periode
            $penempatan = Penempatan::with(['periode'])
                ->where('id_siswa', $siswa->id_siswa)
                ->whereHas('periode', function($q) {
                    $q->where('tanggal_mulai', '<=', Carbon::today())
                      ->where('tanggal_selesai', '>=', Carbon::today())
                      ->where('status_periode', 'aktif');
                })
                ->first();

            if (!$penempatan) {
                return response()->json(['status' => 'belum', 'message' => 'Belum memiliki penempatan aktif']);
            }

            $absensi = Presensi::where('id_penempatan', $penempatan->id_penempatan)
                ->whereDate('tanggal_absensi', today())->first();

            if (!$absensi) {
                return response()->json(['status' => 'belum']);
            }
            if ($absensi->waktu_pulang) {
                return response()->json(['status' => 'sudah_pulang']);
            }
            return response()->json(['status' => 'sudah_masuk']);
            
        } catch (\Exception $e) {
            return response()->json(['status' => 'belum', 'error' => $e->getMessage()]);
        }
    }

    // POST /api/mobile/absensi
    public function store(Request $request)
    {
        try {
            $request->validate([
                'status_absensi'    => 'required|in:hadir,izin,sakit',
                'latitude_absensi'  => 'required|numeric',
                'longitude_absensi' => 'required|numeric',
                'alasan_absensi'    => 'required_if:status_absensi,izin,sakit|nullable|string',
                'foto_surat'        => 'required_if:status_absensi,izin,sakit|nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            ]);

            $user = $request->user();
            $siswa = Siswa::where('id_users', $user->id_users)->first();

            if (!$siswa) {
                return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
            }

            // ✅ Cari penempatan aktif dengan join ke periode
            $penempatan = Penempatan::with(['dudi', 'periode'])
                ->where('id_siswa', $siswa->id_siswa)
                ->whereHas('periode', function($q) {
                    $q->where('tanggal_mulai', '<=', Carbon::today())
                      ->where('tanggal_selesai', '>=', Carbon::today())
                      ->where('status_periode', 'aktif');
                })
                ->first();

            if (!$penempatan) {
                return response()->json(['message' => 'Siswa belum memiliki penempatan aktif'], 422);
            }

            // Validasi radius hanya untuk hadir
            if ($request->status_absensi === 'hadir') {
                $dudi = $penempatan->dudi;
                if (!$dudi || !$dudi->latitude_dudi || !$dudi->longitude_dudi) {
                    return response()->json(['message' => 'Koordinat DUDI belum diatur oleh admin'], 422);
                }
                $jarak = $this->hitungJarak(
                    (float) $request->latitude_absensi,
                    (float) $request->longitude_absensi,
                    (float) $dudi->latitude_dudi,
                    (float) $dudi->longitude_dudi
                );
                if ($jarak > 100) {
                    return response()->json([
                        'message' => 'Anda berada di luar radius 100 meter dari tempat PKL',
                        'jarak'   => round($jarak) . ' meter',
                    ], 422);
                }
            }

            // Cek absensi hari ini
            $already = Presensi::where('id_penempatan', $penempatan->id_penempatan)
                ->whereDate('tanggal_absensi', today())->first();

            if ($already) {
                return response()->json(['message' => 'Anda sudah melakukan absensi hari ini'], 400);
            }

            // Upload foto surat jika ada
            $fotoPath = null;
            if ($request->hasFile('foto_surat')) {
                $fotoPath = $request->file('foto_surat')->store('surat_absensi', 'public');
            }

            Presensi::create([
                'id_penempatan'     => $penempatan->id_penempatan,
                'tanggal_absensi'   => today()->toDateString(),
                'waktu_absensi'     => now()->format('H:i:s'),
                'waktu_pulang'      => null,
                'latitude_absensi'  => $request->latitude_absensi,
                'longitude_absensi' => $request->longitude_absensi,
                'status_absensi'    => $request->status_absensi,
                'alasan_absensi'    => $request->alasan_absensi, null,
                'foto_surat'        => $fotoPath, null,
            ]);

            // Auto buat jurnal untuk izin/sakit
            if (in_array($request->status_absensi, ['izin', 'sakit'])) {
                $keterangan = $request->status_absensi === 'izin' ? 'Izin' : 'Sakit';
                $alasan = $request->alasan_absensi ? " - {$request->alasan_absensi}" : '';

                JurnalHarian::create([
                    'id_penempatan'          => $penempatan->id_penempatan,
                    'tanggal_jurnal_harian'  => today()->toDateString(),
                    'kegiatan_jurnal_harian' => $keterangan . $alasan,
                ]);
            }

            return response()->json(['message' => 'Absensi berhasil']);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // POST /api/mobile/absensi/pulang
    public function pulang(Request $request)
    {
        try {
            $user = $request->user();
            $siswa = Siswa::where('id_users', $user->id_users)->first();
            
            if (!$siswa) {
                return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
            }

            // ✅ Cari penempatan aktif dengan join ke periode
            $penempatan = Penempatan::where('id_siswa', $siswa->id_siswa)
                ->whereHas('periode', function($q) {
                    $q->where('tanggal_mulai', '<=', Carbon::today())
                      ->where('tanggal_selesai', '>=', Carbon::today())
                      ->where('status_periode', 'aktif');
                })
                ->first();

            if (!$penempatan) {
                return response()->json(['message' => 'Tidak ada penempatan aktif'], 404);
            }

            $absensi = Presensi::where('id_penempatan', $penempatan->id_penempatan)
                ->whereDate('tanggal_absensi', today())->first();

            if (!$absensi) {
                return response()->json(['message' => 'Belum absen masuk hari ini'], 400);
            }
            if ($absensi->waktu_pulang) {
                return response()->json(['message' => 'Sudah absen pulang hari ini'], 400);
            }

            // Cek jurnal untuk status hadir
            if ($absensi->status_absensi === 'hadir') {
                $jurnal = JurnalHarian::where('id_penempatan', $penempatan->id_penempatan)
                    ->whereDate('tanggal_jurnal_harian', today())
                    ->first();

                if (!$jurnal) {
                    return response()->json([
                        'message' => 'Isi jurnal harian hari ini terlebih dahulu sebelum absen pulang',
                    ], 422);
                }
            }

            $absensi->update([
                'waktu_pulang' => now()->format('H:i:s'),
            ]);

            return response()->json(['message' => 'Absensi pulang berhasil']);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}