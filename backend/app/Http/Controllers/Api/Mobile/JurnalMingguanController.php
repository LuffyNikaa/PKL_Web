<?php
namespace App\Http\Controllers\API\Mobile;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Siswa;
use App\Models\JurnalMingguan;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class JurnalMingguanController extends Controller
{
    // Hitung minggu ke-berapa sejak PKL dimulai (berdasarkan jurnal pertama)
    private function hitungMinggu(Siswa $siswa, Carbon $tanggal): int
    {
        $pertama = JurnalMingguan::where('id_siswa', $siswa->id_siswa)
            ->orderBy('tanggal_jurnal_mingguan', 'asc')
            ->value('tanggal_jurnal_mingguan');

        if (!$pertama) return 1;

        $awal = Carbon::parse($pertama)->startOfWeek(Carbon::MONDAY);
        $mingguIni = $tanggal->copy()->startOfWeek(Carbon::MONDAY);

        return (int) $awal->diffInWeeks($mingguIni) + 1;
    }

    // GET /api/mobile/jurnal-mingguan
    public function index(Request $request)
    {
        try {
            $user  = $request->user();
            $siswa = Siswa::where('id_user', $user->id_users)->first();
            if (!$siswa) return response()->json(['message' => 'Siswa tidak ditemukan'], 404);

            $query = JurnalMingguan::where('id_siswa', $siswa->id_siswa)
                ->orderBy('tanggal_jurnal_mingguan', 'desc');

            if ($request->filled('search')) {
                $query->where('kegiatan_jurnal_mingguan', 'like', '%' . $request->search . '%');
            }

            $jurnal = $query->get()->map(function ($j) use ($siswa) {
                $tanggal   = Carbon::parse($j->tanggal_jurnal_mingguan);
                $senin     = $tanggal->copy()->startOfWeek(Carbon::MONDAY);
                $minggu    = $tanggal->copy()->endOfWeek(Carbon::SUNDAY);
                $mingguKe  = $this->hitungMinggu($siswa, $tanggal);

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

    // Bisa edit jika masih dalam minggu yang sama dan belum lewat minggu ini
    private function bisaEdit($tanggal): bool
    {
        $senin  = Carbon::parse($tanggal)->startOfWeek(Carbon::MONDAY);
        $minggu = Carbon::parse($tanggal)->endOfWeek(Carbon::SUNDAY);
        return now()->between($senin, $minggu);
    }

    // POST /api/mobile/jurnal-mingguan
    public function store(Request $request)
    {
        try {
            $request->validate([
                'tanggal_jurnal_mingguan'   => 'required|date',
                'kegiatan_jurnal_mingguan'  => 'required|string',
                'dokumentasi_jurnal_mingguan' => 'nullable|file|mimes:jpg,jpeg,png|max:3072',
            ], [
                'kegiatan_jurnal_mingguan.required'  => 'Kegiatan wajib diisi',
                'dokumentasi_jurnal_mingguan.mimes'  => 'Foto harus berformat JPG atau PNG',
                'dokumentasi_jurnal_mingguan.max'    => 'Ukuran foto maksimal 3MB',
            ]);

            $user  = $request->user();
            $siswa = Siswa::where('id_user', $user->id_users)->first();
            if (!$siswa)          return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
            if (!$siswa->id_dudi) return response()->json(['message' => 'Siswa belum memiliki DUDI'], 422);

            $tanggal = Carbon::parse($request->tanggal_jurnal_mingguan);
            $senin   = $tanggal->copy()->startOfWeek(Carbon::MONDAY);
            $minggu  = $tanggal->copy()->endOfWeek(Carbon::SUNDAY);

            // 1 minggu hanya 1 jurnal
            $already = JurnalMingguan::where('id_siswa', $siswa->id_siswa)
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

            JurnalMingguan::create([
                'id_siswa'                    => $siswa->id_siswa,
                'id_user'                     => $user->id_users,
                'id_dudi'                     => $siswa->id_dudi,
                'tanggal_jurnal_mingguan'     => $tanggal->toDateString(),
                'kegiatan_jurnal_mingguan'    => $request->kegiatan_jurnal_mingguan,
                'dokumentasi_jurnal_mingguan' => $dokPath,
            ]);

            return response()->json(['message' => 'Jurnal mingguan berhasil ditambahkan']);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/mobile/jurnal-mingguan/{id}
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'kegiatan_jurnal_mingguan'    => 'required|string',
                'dokumentasi_jurnal_mingguan' => 'nullable|file|mimes:jpg,jpeg,png|max:3072',
            ]);

            $user   = $request->user();
            $siswa  = Siswa::where('id_user', $user->id_users)->first();
            $jurnal = JurnalMingguan::where('id_jurnal_mingguan', $id)
                ->where('id_siswa', $siswa->id_siswa)->first();

            if (!$jurnal) return response()->json(['message' => 'Jurnal tidak ditemukan'], 404);

            // Cek masih dalam minggu yang sama
            if (!$this->bisaEdit($jurnal->tanggal_jurnal_mingguan)) {
                return response()->json(['message' => 'Jurnal hanya bisa diedit dalam minggu yang sama'], 422);
            }

            $data = ['kegiatan_jurnal_mingguan' => $request->kegiatan_jurnal_mingguan];

            if ($request->hasFile('dokumentasi_jurnal_mingguan')) {
                // Hapus foto lama jika ada
                if ($jurnal->dokumentasi_jurnal_mingguan) {
                    Storage::disk('public')->delete($jurnal->dokumentasi_jurnal_mingguan);
                }
                $data['dokumentasi_jurnal_mingguan'] = $request->file('dokumentasi_jurnal_mingguan')
                    ->store('dokumentasi_mingguan', 'public');
            }

            $jurnal->update($data);

            return response()->json(['message' => 'Jurnal mingguan berhasil diperbarui']);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}