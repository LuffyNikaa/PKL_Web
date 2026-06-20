<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Presentasi;
use App\Models\Siswa;
use App\Models\Penempatan;
use Carbon\Carbon;

class PresentasiController extends Controller
{
    // GET /api/admin/presentasi
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Presentasi::with(['penempatan.siswa.kelas.jurusan', 'penempatan.dudi']);

        if ($user && $user->role_users === 'guru') {
            $guru = \App\Models\Guru::where('id_users', $user->id_users)->first();
            if ($guru) {
                $query->whereHas('penempatan', function ($q) use ($guru) {
                    $q->where('id_guru', $guru->id_guru);
                });
            } else {
                return response()->json(['data' => []], 200);
            }
        }

        if ($request->filled('nama')) {
            $query->whereHas('penempatan.siswa', fn($q) =>
                $q->where('nama_siswa', 'like', '%' . $request->nama . '%')
            );
        }
        if ($request->filled('status')) {
            $query->where('status_presentasi', $request->status);
        }
        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal_presentasi', $request->tanggal);
        }

        return response()->json([
            'data' => $query->orderBy('tanggal_presentasi', 'desc')
                            ->orderBy('id_presentasi', 'desc')
                            ->get()->map(fn($p) => $this->format($p))
        ]);
    }

    // POST /api/admin/presentasi
    public function store(Request $request)
    {
        $request->validate([
            'id_siswa'             => 'required|exists:siswa,id_siswa',
            'tanggal_presentasi'   => 'required|date',
            'jam_presentasi'       => 'required',
            'ruangan_presentasi'   => 'required|string|max:30',
            'status_presentasi'    => 'required|in:dijadwalkan,selesai',
        ], [
            'id_siswa.required'            => 'Siswa wajib dipilih',
            'tanggal_presentasi.required'  => 'Tanggal wajib diisi',
            'jam_presentasi.required'      => 'Jam wajib diisi',
            'ruangan_presentasi.required'  => 'Ruangan wajib diisi',
        ]);

        try {
            // Cari penempatan aktif siswa
            $penempatan = Penempatan::where('id_siswa', $request->id_siswa)
                ->whereHas('periode', function($q) {
                    $q->where('tanggal_mulai', '<=', Carbon::today())
                      ->where('tanggal_selesai', '>=', Carbon::today())
                      ->where('status_periode', 'aktif');
                })
                ->first();

            if (!$penempatan) {
                return response()->json(['message' => 'Siswa belum memiliki penempatan aktif'], 422);
            }

            $presentasi = Presentasi::create([
                'id_penempatan'        => $penempatan->id_penempatan,
                'tanggal_presentasi'   => $request->tanggal_presentasi,
                'jam_presentasi'       => $request->jam_presentasi,
                'ruangan_presentasi'   => $request->ruangan_presentasi,
                'status_presentasi'    => $request->status_presentasi,
            ]);

            return response()->json([
                'message' => 'Jadwal presentasi berhasil ditambahkan', 
                'data' => $this->format($presentasi->load(['penempatan.siswa', 'penempatan.dudi']))
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/admin/presentasi/{id}
    public function update(Request $request, int $id)
    {
        $presentasi = Presentasi::find($id);
        if (!$presentasi) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        $request->validate([
            'tanggal_presentasi'   => 'required|date',
            'jam_presentasi'       => 'required',
            'ruangan_presentasi'   => 'required|string|max:30',
            'status_presentasi'    => 'required|in:dijadwalkan,selesai',
        ]);

        try {
            $presentasi->update($request->only([
                'tanggal_presentasi',
                'jam_presentasi',
                'ruangan_presentasi',
                'status_presentasi'
            ]));
            
            return response()->json(['message' => 'Jadwal presentasi berhasil diperbarui']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // DELETE /api/admin/presentasi/{id}
    public function destroy(int $id)
    {
        $presentasi = Presentasi::find($id);
        if (!$presentasi) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }
        $presentasi->delete();
        return response()->json(['message' => 'Jadwal presentasi berhasil dihapus']);
    }

    // GET /api/mobile/presentasi
    public function mySiswa(Request $request)
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
                return response()->json(['ada_jadwal' => false, 'data' => []]);
            }

            $data = Presentasi::where('id_penempatan', $penempatan->id_penempatan)
                ->orderBy('tanggal_presentasi', 'desc')
                ->get();

            $adaJadwal = $data->where('status_presentasi', 'dijadwalkan')->count() > 0;

            return response()->json([
                'ada_jadwal' => $adaJadwal,
                'data'       => $data->map(fn($p) => $this->format($p)),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function format(Presentasi $p): array
    {
        $siswa = $p->penempatan?->siswa;
        $dudi  = $p->penempatan?->dudi;
        
        return [
            'id_presentasi'     => $p->id_presentasi,
            'nama_siswa'        => $siswa?->nama_siswa ?? '-',
            'kelas_siswa'       => $siswa?->kelas 
                ? trim(preg_replace('/\s+/', ' ', $siswa->kelas->tingkat_kelas . ' ' . ($siswa->kelas->jurusan?->singkatan_jurusan ?? $siswa->kelas->jurusan?->nama_jurusan ?? '') . ' ' . ($siswa->kelas->rombel ?? ''))) 
                : '-',
            'tempat_pkl'        => $dudi?->nama_dudi ?? '-',
            'tanggal'           => $p->tanggal_presentasi ? Carbon::parse($p->tanggal_presentasi)->format('d-m-Y') : '-',
            'tanggal_raw'       => $p->tanggal_presentasi ? Carbon::parse($p->tanggal_presentasi)->format('Y-m-d') : null,
            'jam'               => $p->jam_presentasi,
            'ruangan'           => $p->ruangan_presentasi,
            'status'            => $p->status_presentasi,
        ];
    }
}