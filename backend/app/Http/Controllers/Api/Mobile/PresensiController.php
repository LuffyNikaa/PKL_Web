<?php
namespace App\Http\Controllers\API\Mobile;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Siswa;
use App\Models\Presensi;

class PresensiController extends Controller
{
    // Hitung jarak pakai Haversine formula (hasil dalam meter)
    private function hitungJarak($lat1, $lon1, $lat2, $lon2): float
    {
        $R = 6371000;
        $phi1 = deg2rad($lat1);
        $phi2 = deg2rad($lat2);
        $dphi = deg2rad($lat2 - $lat1);
        $dlam = deg2rad($lon2 - $lon1);
        $a = sin($dphi / 2) ** 2 + cos($phi1) * cos($phi2) * sin($dlam / 2) ** 2;
        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    // GET /api/mobile/absensi/status
    public function status(Request $request)
    {
        try {
            $user  = $request->user();
            $siswa = Siswa::where('id_user', $user->id_users)->first();

            if (!$siswa) return response()->json(['status' => 'belum']);

            $absensi = Presensi::where('id_siswa', $siswa->id_siswa)
                ->whereDate('tanggal_absensi', today())
                ->first();

            if (!$absensi)              return response()->json(['status' => 'belum']);
            if ($absensi->waktu_pulang) return response()->json(['status' => 'sudah_pulang']);

            return response()->json(['status' => 'sudah_masuk']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'belum', 'error' => $e->getMessage()]);
        }
    }

    // POST /api/mobile/absensi — validasi radius hanya saat masuk
    public function store(Request $request)
    {
        try {
            $request->validate([
                'status_absensi'    => 'required|in:hadir,izin,sakit',
                'latitude_absensi'  => 'required|numeric',
                'longitude_absensi' => 'required|numeric',
                'alasan_absensi'    => 'nullable|string',
            ]);

            $user  = $request->user();
            $siswa = Siswa::with('dudi')->where('id_user', $user->id_users)->first();

            if (!$siswa)          return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
            if (!$siswa->id_dudi) return response()->json(['message' => 'Siswa belum memiliki DUDI'], 422);

            // ✅ Validasi radius hanya untuk status hadir
            if ($request->status_absensi === 'hadir') {
                $dudi = $siswa->dudi;

                if (!$dudi || !$dudi->latitude_dudi || !$dudi->longitude_dudi) {
                    return response()->json(['message' => 'Koordinat DUDI belum diatur oleh admin'], 422);
                }

                $jarak = $this->hitungJarak(
                    $request->latitude_absensi,
                    $request->longitude_absensi,
                    $dudi->latitude_dudi,
                    $dudi->longitude_dudi
                );

                if ($jarak > 100) {
                    return response()->json([
                        'message' => 'Anda berada di luar radius 100 meter dari tempat PKL',
                        'jarak'   => round($jarak) . ' meter',
                    ], 422);
                }
            }

            $already = Presensi::where('id_siswa', $siswa->id_siswa)
                ->whereDate('tanggal_absensi', today())->first();

            if ($already) return response()->json(['message' => 'Anda sudah melakukan absensi hari ini'], 400);

            Presensi::create([
                'id_siswa'          => $siswa->id_siswa,
                'id_user'           => $user->id_users,
                'id_dudi'           => $siswa->id_dudi,
                'tanggal_absensi'   => today()->toDateString(),
                'waktu_absensi'     => now()->format('H:i:s'),
                'latitude_absensi'  => $request->latitude_absensi,
                'longitude_absensi' => $request->longitude_absensi,
                'status_absensi'    => $request->status_absensi,
                'alasan_absensi'    => $request->alasan_absensi,
            ]);

            return response()->json(['message' => 'Absensi masuk berhasil']);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // POST /api/mobile/absensi/pulang — tidak perlu lokasi
    public function pulang(Request $request)
    {
        try {
            $user  = $request->user();
            $siswa = Siswa::where('id_user', $user->id_users)->first();

            if (!$siswa) return response()->json(['message' => 'Siswa tidak ditemukan'], 404);

            $absensi = Presensi::where('id_siswa', $siswa->id_siswa)
                ->whereDate('tanggal_absensi', today())->first();

            if (!$absensi)              return response()->json(['message' => 'Belum absen masuk hari ini'], 400);
            if ($absensi->waktu_pulang) return response()->json(['message' => 'Sudah absen pulang hari ini'], 400);

            $absensi->update(['waktu_pulang' => now()->format('H:i:s')]);

            return response()->json(['message' => 'Absensi pulang berhasil']);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}