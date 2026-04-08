<?php
namespace App\Http\Controllers\API\Mobile;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Siswa;
use App\Models\JurnalHarian;
use App\Models\Presensi;

class JurnalHarianController extends Controller
{
    // GET /api/mobile/jurnal-harian
    public function index(Request $request)
    {
        try {
            $user  = $request->user();
            $siswa = Siswa::where('id_user', $user->id_users)->first();
            if (!$siswa) return response()->json(['message' => 'Siswa tidak ditemukan'], 404);

            $query = JurnalHarian::where('id_siswa', $siswa->id_siswa)
                ->orderBy('tanggal_jurnal_harian', 'desc');

            if ($request->filled('search')) {
                $query->where('kegiatan_jurnal_harian', 'like', '%' . $request->search . '%');
            }

            // Ambil absensi hari ini untuk cek bisa edit atau tidak
            $absensiHariIni = Presensi::where('id_siswa', $siswa->id_siswa)
                ->whereDate('tanggal_absensi', today())
                ->first();

            $sudahPulang = $absensiHariIni?->waktu_pulang !== null;

            $jurnal = $query->get()->map(function ($j) use ($sudahPulang) {
                $isHariIni = $j->tanggal_jurnal_harian->isToday();
                // Bisa edit jika: jurnal hari ini DAN belum absen pulang
                $bisaEdit  = $isHariIni && !$sudahPulang;

                return [
                    'id_jurnal_harian' => $j->id_jurnal_harian,
                    'tanggal'          => $j->tanggal_jurnal_harian->format('Y-m-d'),
                    'tanggal_format'   => \Carbon\Carbon::parse($j->tanggal_jurnal_harian)
                                            ->translatedFormat('l, j F Y'),
                    'kegiatan'         => $j->kegiatan_jurnal_harian,
                    'bisa_edit'        => $bisaEdit,
                ];
            });

            return response()->json(['data' => $jurnal]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // POST /api/mobile/jurnal-harian
    public function store(Request $request)
    {
        try {
            $request->validate([
                'tanggal_jurnal_harian'  => 'required|date',
                'kegiatan_jurnal_harian' => 'required|string',
            ], [
                'tanggal_jurnal_harian.required'  => 'Tanggal wajib diisi',
                'kegiatan_jurnal_harian.required' => 'Kegiatan wajib diisi',
            ]);

            $user  = $request->user();
            $siswa = Siswa::where('id_user', $user->id_users)->first();

            if (!$siswa)          return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
            if (!$siswa->id_dudi) return response()->json(['message' => 'Siswa belum memiliki DUDI'], 422);

            // Cek hanya bisa tambah jurnal hari ini
            $tanggalInput = \Carbon\Carbon::parse($request->tanggal_jurnal_harian)->toDateString();
            if ($tanggalInput !== today()->toDateString()) {
                return response()->json([
                    'message' => 'Jurnal hanya bisa diisi untuk hari ini',
                ], 422);
            }

            // Cek sudah absen masuk hari ini
            $absensi = Presensi::where('id_siswa', $siswa->id_siswa)
                ->whereDate('tanggal_absensi', today())
                ->first();

            if (!$absensi) {
                return response()->json(['message' => 'Absen masuk terlebih dahulu sebelum mengisi jurnal'], 422);
            }

            // Cek belum absen pulang
            if ($absensi->waktu_pulang) {
                return response()->json(['message' => 'Tidak bisa mengisi jurnal setelah absen pulang'], 422);
            }

            // Cek izin/sakit — tidak perlu isi jurnal
            if (in_array($absensi->status_absensi, ['izin', 'sakit'])) {
                return response()->json(['message' => 'Siswa izin/sakit tidak perlu mengisi jurnal harian'], 422);
            }

            // 1 hari hanya 1 jurnal
            $already = JurnalHarian::where('id_siswa', $siswa->id_siswa)
                ->whereDate('tanggal_jurnal_harian', today())
                ->first();

            if ($already) {
                return response()->json([
                    'message' => 'Jurnal hari ini sudah ada, gunakan fitur edit untuk mengubahnya',
                ], 400);
            }

            JurnalHarian::create([
                'id_siswa'               => $siswa->id_siswa,
                'id_user'                => $user->id_users,
                'id_dudi'                => $siswa->id_dudi,
                'tanggal_jurnal_harian'  => today()->toDateString(),
                'kegiatan_jurnal_harian' => $request->kegiatan_jurnal_harian,
            ]);

            return response()->json(['message' => 'Jurnal berhasil ditambahkan']);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/mobile/jurnal-harian/{id}
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'kegiatan_jurnal_harian' => 'required|string',
            ], [
                'kegiatan_jurnal_harian.required' => 'Kegiatan wajib diisi',
            ]);

            $user   = $request->user();
            $siswa  = Siswa::where('id_user', $user->id_users)->first();
            $jurnal = JurnalHarian::where('id_jurnal_harian', $id)
                ->where('id_siswa', $siswa->id_siswa)
                ->first();

            if (!$jurnal) return response()->json(['message' => 'Jurnal tidak ditemukan'], 404);

            // Cek jurnal harus hari ini
            if (!$jurnal->tanggal_jurnal_harian->isToday()) {
                return response()->json(['message' => 'Jurnal hanya bisa diedit di hari yang sama'], 422);
            }

            // Cek belum absen pulang
            $absensi = Presensi::where('id_siswa', $siswa->id_siswa)
                ->whereDate('tanggal_absensi', today())
                ->first();

            if ($absensi?->waktu_pulang) {
                return response()->json(['message' => 'Tidak bisa mengedit jurnal setelah absen pulang'], 422);
            }

            $jurnal->update(['kegiatan_jurnal_harian' => $request->kegiatan_jurnal_harian]);

            return response()->json(['message' => 'Jurnal berhasil diperbarui']);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}