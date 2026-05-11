<?php
namespace App\Http\Controllers\API\Mobile;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Siswa;
use App\Models\JurnalMingguan;
use App\Models\Penempatan;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class JurnalMingguanController extends Controller
{
    // Hitung minggu ke-berapa sejak PKL dimulai (berdasarkan jurnal pertama)
    private function hitungMinggu(int $idPenempatan, Carbon $tanggal): int
    {
        $pertama = JurnalMingguan::where('id_penempatan', $idPenempatan)
            ->orderBy('tanggal_jurnal_mingguan', 'asc')
            ->value('tanggal_jurnal_mingguan');

        if (!$pertama) return 1;

        $awal = Carbon::parse($pertama)->startOfWeek(Carbon::MONDAY);
        $mingguIni = $tanggal->copy()->startOfWeek(Carbon::MONDAY);

        return (int) $awal->diffInWeeks($mingguIni) + 1;
    }

    // Bisa edit jika masih dalam minggu yang sama dan belum lewat minggu ini
    private function bisaEdit(string $tanggal): bool
    {
        $senin  = Carbon::parse($tanggal)->startOfWeek(Carbon::MONDAY);
        $minggu = Carbon::parse($tanggal)->endOfWeek(Carbon::SUNDAY);
        return now()->between($senin, $minggu);
    }

    // GET /api/mobile/jurnal-mingguan
    public function index(Request $request)
    {
        try {
            $user  = $request->user();
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
            $query = JurnalMingguan::where('id_penempatan', $penempatan->id_penempatan)
                ->orderBy('tanggal_jurnal_mingguan', 'desc');

            if ($request->filled('search')) {
                $query->where('kegiatan_jurnal_mingguan', 'like', '%' . $request->search . '%');
            }

            $jurnal = $query->get()->map(function ($j) use ($penempatan) {
                $tanggal   = Carbon::parse($j->tanggal_jurnal_mingguan);
                $senin     = $tanggal->copy()->startOfWeek(Carbon::MONDAY);
                $minggu    = $tanggal->copy()->endOfWeek(Carbon::SUNDAY);
                $mingguKe  = $this->hitungMinggu($penempatan->id_penempatan, $tanggal);

                return [
                    'id_jurnal_mingguan'   => $j->id_jurnal_mingguan,
                    'tanggal'              => $j->tanggal_jurnal_mingguan->format('Y-m-d'),
                    'minggu_ke'            => $mingguKe,
                    'range_tanggal'        => $senin->translatedFormat('j F') . ' - ' . $minggu->translatedFormat('j F Y'),
                    'kegiatan'             => $j->kegiatan_jurnal_mingguan,
                    'dokumentasi'          => $j->dokumentasi_jurnal_mingguan
                        ? asset('storage/' . $j->dokumentasi_jurnal_mingguan)
                        : null,
                    'bisa_edit'            => $this->bisaEdit($j->tanggal_jurnal_mingguan),
                ];
            });

            return response()->json(['data' => $jurnal]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // POST /api/mobile/jurnal-mingguan
    public function store(Request $request)
    {
        try {
            $request->validate([
                'kegiatan_jurnal_mingguan'  => 'required|string',
                'dokumentasi_jurnal_mingguan' => 'nullable|file|mimes:jpg,jpeg,png|max:3072',
            ], [
                'kegiatan_jurnal_mingguan.required' => 'Kegiatan wajib diisi',
                'dokumentasi_jurnal_mingguan.mimes' => 'Foto harus berformat JPG atau PNG',
                'dokumentasi_jurnal_mingguan.max'   => 'Ukuran foto maksimal 3MB',
            ]);

            $user = $request->user();
            $siswa = Siswa::where('id_users', $user->id_users)->first();
            
            if (!$siswa) {
                return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
            }

            // Cari penempatan aktif
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

            // ✅ Otomatis pakai hari ini untuk menentukan minggu
            $today = Carbon::today();
            $senin = $today->copy()->startOfWeek(Carbon::MONDAY);
            $minggu = $today->copy()->endOfWeek(Carbon::SUNDAY);

            // 1 minggu hanya 1 jurnal
            $already = JurnalMingguan::where('id_penempatan', $penempatan->id_penempatan)
                ->whereBetween('tanggal_jurnal_mingguan', [
                    $senin->toDateString(),
                    $minggu->toDateString(),
                ])
                ->first();

            if ($already) {
                return response()->json([
                    'message' => 'Jurnal minggu ini sudah ada, gunakan fitur edit untuk mengubahnya',
                ], 400);
            }

            // Upload dokumentasi
            $dokPath = null;
            if ($request->hasFile('dokumentasi_jurnal_mingguan')) {
                $dokPath = $request->file('dokumentasi_jurnal_mingguan')
                    ->store('dokumentasi_mingguan', 'public');
            }

            // ✅ Gunakan tanggal hari ini (atau bisa pakai tanggal senin)
            JurnalMingguan::create([
                'id_penempatan'                => $penempatan->id_penempatan,
                'tanggal_jurnal_mingguan'     => $today->toDateString(),  // ✅ Otomatis
                'kegiatan_jurnal_mingguan'    => $request->kegiatan_jurnal_mingguan,
                'dokumentasi_jurnal_mingguan' => $dokPath,
            ]);

            return response()->json(['message' => 'Jurnal mingguan berhasil ditambahkan']);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal', 
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/mobile/jurnal-mingguan/{id}
    public function update(Request $request, int $id)
    {
        try {
            $request->validate([
                'kegiatan_jurnal_mingguan'    => 'required|string',
                'dokumentasi_jurnal_mingguan' => 'nullable|file|mimes:jpg,jpeg,png|max:3072',  // ✅ nullable
            ]);

            $user   = $request->user();
            $siswa  = Siswa::where('id_users', $user->id_users)->first();
            
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

            $jurnal = JurnalMingguan::where('id_jurnal_mingguan', $id)
                ->where('id_penempatan', $penempatan->id_penempatan)
                ->first();

            if (!$jurnal) {
                return response()->json(['message' => 'Jurnal tidak ditemukan'], 404);
            }

            // Cek masih dalam minggu yang sama
            $tanggalJurnal = Carbon::parse($jurnal->tanggal_jurnal_mingguan);
            $senin = $tanggalJurnal->copy()->startOfWeek(Carbon::MONDAY);
            $minggu = $tanggalJurnal->copy()->endOfWeek(Carbon::SUNDAY);
            
            if (!now()->between($senin, $minggu)) {
                return response()->json(['message' => 'Jurnal hanya bisa diedit dalam minggu yang sama'], 422);
            }

            // Update kegiatan
            $data = ['kegiatan_jurnal_harian' => $request->kegiatan_jurnal_mingguan];

            // Handle upload file jika ada
            if ($request->hasFile('dokumentasi_jurnal_mingguan')) {
                // Hapus file lama jika ada
                if ($jurnal->dokumentasi_jurnal_mingguan) {
                    Storage::disk('public')->delete($jurnal->dokumentasi_jurnal_mingguan);
                }
                $data['dokumentasi_jurnal_mingguan'] = $request->file('dokumentasi_jurnal_mingguan')
                    ->store('dokumentasi_mingguan', 'public');
            }
            // ✅ Jika tidak ada file, biarkan tetap menggunakan file lama (tidak diupdate)

            $jurnal->update($data);

            return response()->json(['message' => 'Jurnal mingguan berhasil diperbarui']);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal', 
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}