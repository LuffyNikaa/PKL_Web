<?php
namespace App\Http\Controllers\API\Mobile;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Siswa;
use App\Models\JurnalHarian;
use App\Models\Presensi;
use App\Models\Penempatan;
use Carbon\Carbon;

class JurnalHarianController extends Controller
{
    // GET /api/mobile/jurnal-harian
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $siswa = Siswa::where('id_users', $user->id_users)->first();
            
            if (!$siswa) {
                return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
            }

            // Cari penempatan aktif
            $penempatan = Penempatan::where('id_siswa', $siswa->id_siswa)
                ->whereHas('periode', function($q) {
                    $q->where('tanggal_mulai', '<=', Carbon::today())
                      ->where('tanggal_selesai', '>=', Carbon::today())
                      ->where('status_periode', 'aktif');
                })
                ->first();

            if (!$penempatan) {
                return response()->json(['message' => 'Siswa belum memiliki penempatan aktif'], 404);
            }

            // Query jurnal berdasarkan id_penempatan
            $query = JurnalHarian::with('approver')
                ->where('id_penempatan', $penempatan->id_penempatan)
                ->orderBy('tanggal_jurnal_harian', 'desc');

            if ($request->filled('search')) {
                $query->where('kegiatan_jurnal_harian', 'like', '%' . $request->search . '%');
            }

            // Ambil absensi hari ini untuk cek bisa edit atau tidak
            $absensiHariIni = Presensi::where('id_penempatan', $penempatan->id_penempatan)
                ->whereDate('tanggal_absensi', today())
                ->first();

            $sudahPulang = $absensiHariIni?->waktu_pulang !== null;

            $jurnal = $query->get()->map(function ($j) use ($sudahPulang) {
                $isHariIni = Carbon::parse($j->tanggal_jurnal_harian)->isToday();
                // ✅ Jurnal hanya bisa diedit jika statusnya pending dan di hari yang sama sebelum absen pulang
                $bisaEdit = $isHariIni && !$sudahPulang && ($j->status_jurnal_harian ?? 'pending') === 'pending';

                return [
                    'id_jurnal_harian'      => $j->id_jurnal_harian,
                    'tanggal'               => Carbon::parse($j->tanggal_jurnal_harian)->format('Y-m-d'),
                    'tanggal_format'        => Carbon::parse($j->tanggal_jurnal_harian)->translatedFormat('l, j F Y'),
                    'kegiatan'              => $j->kegiatan_jurnal_harian,
                    'bisa_edit'             => $bisaEdit,
                    'status_jurnal_harian'  => $j->status_jurnal_harian ?? 'pending',
                    'approved_by_name'      => $j->approver?->nama_users,
                    'approved_at'           => $j->approved_at ? Carbon::parse($j->approved_at)->format('d-m-Y H:i') : null,
                    'catatan_approval'      => $j->catatan_approval,
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
                'kegiatan_jurnal_harian' => 'required|string',
            ], [
                'kegiatan_jurnal_harian.required' => 'Kegiatan wajib diisi',
            ]);

            $user = $request->user();
            $siswa = Siswa::where('id_users', $user->id_users)->first();

            if (!$siswa) {
                return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
            }

            // Cari penempatan aktif
            $penempatan = Penempatan::with('dudi', 'periode')
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

            // Cek absensi hari ini
            $absensi = Presensi::where('id_penempatan', $penempatan->id_penempatan)
                ->whereDate('tanggal_absensi', today())
                ->first();

            if (!$absensi) {
                return response()->json(['message' => 'Absen masuk terlebih dahulu sebelum mengisi jurnal'], 422);
            }

            // Cek sudah absen pulang
            if ($absensi->waktu_pulang) {
                return response()->json(['message' => 'Tidak bisa mengisi jurnal setelah absen pulang'], 422);
            }

            // Cek izin/sakit — tidak perlu isi jurnal
            if (in_array($absensi->status_absensi, ['izin', 'sakit'])) {
                return response()->json(['message' => 'Siswa izin/sakit tidak perlu mengisi jurnal harian'], 422);
            }

            // 1 hari hanya 1 jurnal
            $already = JurnalHarian::where('id_penempatan', $penempatan->id_penempatan)
                ->whereDate('tanggal_jurnal_harian', today())
                ->first();

            if ($already) {
                return response()->json([
                    'message' => 'Jurnal hari ini sudah ada, gunakan fitur edit untuk mengubahnya',
                ], 400);
            }

            // Create jurnal dengan id_penempatan
            JurnalHarian::create([
                'id_penempatan'              => $penempatan->id_penempatan,
                'tanggal_jurnal_harian'      => today()->toDateString(),
                'kegiatan_jurnal_harian'     => $request->kegiatan_jurnal_harian,
            ]);

            return response()->json(['message' => 'Jurnal berhasil ditambahkan']);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/mobile/jurnal-harian/{id}
    public function update(Request $request, int $id)
    {
        try {
            $request->validate([
                'kegiatan_jurnal_harian' => 'required|string',
            ], [
                'kegiatan_jurnal_harian.required' => 'Kegiatan wajib diisi',
            ]);

            $user = $request->user();
            $siswa = Siswa::where('id_users', $user->id_users)->first();
            
            if (!$siswa) {
                return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
            }

            // Cari penempatan aktif
            $penempatan = Penempatan::where('id_siswa', $siswa->id_siswa)
                ->whereHas('periode', function($q) {
                    $q->where('tanggal_mulai', '<=', Carbon::today())
                      ->where('tanggal_selesai', '>=', Carbon::today())
                      ->where('status_periode', 'aktif');
                })
                ->first();

            if (!$penempatan) {
                return response()->json(['message' => 'Siswa belum memiliki penempatan aktif'], 404);
            }

            // Cari jurnal
            $jurnal = JurnalHarian::where('id_jurnal_harian', $id)
                ->where('id_penempatan', $penempatan->id_penempatan)
                ->first();

            if (!$jurnal) {
                return response()->json(['message' => 'Jurnal tidak ditemukan'], 404);
            }

            // Cek jurnal harus hari ini
            if (!Carbon::parse($jurnal->tanggal_jurnal_harian)->isToday()) {
                return response()->json(['message' => 'Jurnal hanya bisa diedit di hari yang sama'], 422);
            }

            // Cek sudah absen pulang
            $absensi = Presensi::where('id_penempatan', $penempatan->id_penempatan)
                ->whereDate('tanggal_absensi', today())
                ->first();

            if ($absensi?->waktu_pulang) {
                return response()->json(['message' => 'Tidak bisa mengedit jurnal setelah absen pulang'], 422);
            }

            // Cek status jurnal harian harus pending
            if (($jurnal->status_jurnal_harian ?? 'pending') !== 'pending') {
                return response()->json(['message' => 'Jurnal yang sudah disetujui/ditolak tidak dapat diedit'], 422);
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