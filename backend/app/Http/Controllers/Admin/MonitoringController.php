<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Monitoring;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\Penempatan;
use Carbon\Carbon;

class MonitoringController extends Controller
{
    // GET /api/admin/monitoring
    public function index(Request $request)
    {
        $query = Monitoring::with(['penempatan.siswa', 'penempatan.dudi', 'penempatan.guru']);

        if ($request->filled('nama')) {
            $query->whereHas('penempatan.siswa', fn($q) =>
                $q->where('nama_siswa', 'like', '%' . $request->nama . '%')
            );
        }
        if ($request->filled('status')) {
            $query->where('status_monitoring', $request->status);
        }
        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal_monitoring', $request->tanggal);
        }

        return response()->json([
            'data' => $query->orderBy('tanggal_monitoring', 'desc')->get()->map(fn($m) => $this->format($m))
        ]);
    }

    // POST /api/admin/monitoring
    public function store(Request $request)
    {
        $request->validate([
            'id_siswa'           => 'required|exists:siswa,id_siswa',
            'tanggal_monitoring' => 'required|date',
            'jam_monitoring'     => 'required',
            'lokasi_monitoring'  => 'required|string|max:150',
            'alasan_monitoring'  => 'nullable|string',
            'status_monitoring'  => 'required|in:dijadwalkan,selesai',
        ], [
            'id_siswa.required'           => 'Siswa wajib dipilih',
            'tanggal_monitoring.required' => 'Tanggal wajib diisi',
            'jam_monitoring.required'     => 'Jam wajib diisi',
            'lokasi_monitoring.required'  => 'Lokasi wajib diisi',
        ]);

        try {
            $user = $request->user();
            
            // Cari penempatan aktif siswa
            $penempatan = Penempatan::with('guru')
                ->where('id_siswa', $request->id_siswa)
                ->whereHas('periode', function($q) {
                    $q->where('tanggal_mulai', '<=', Carbon::today())
                      ->where('tanggal_selesai', '>=', Carbon::today())
                      ->where('status_periode', 'aktif');
                })
                ->first();

            if (!$penempatan) {
                return response()->json(['message' => 'Siswa belum memiliki penempatan aktif'], 422);
            }

            $monitoring = Monitoring::create([
                'id_penempatan'      => $penempatan->id_penempatan,
                'tanggal_monitoring' => $request->tanggal_monitoring,
                'jam_monitoring'     => $request->jam_monitoring,
                'lokasi_monitoring'  => $request->lokasi_monitoring,
                'alasan_monitoring'  => $request->alasan_monitoring,
                'status_monitoring'  => $request->status_monitoring,
            ]);

            return response()->json([
                'message' => 'Jadwal monitoring berhasil ditambahkan', 
                'data' => $this->format($monitoring->load(['penempatan.siswa', 'penempatan.dudi', 'penempatan.guru']))
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/admin/monitoring/{id}
    public function update(Request $request, int $id)
    {
        $monitoring = Monitoring::find($id);
        if (!$monitoring) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        $request->validate([
            'tanggal_monitoring' => 'required|date',
            'jam_monitoring'     => 'required',
            'lokasi_monitoring'  => 'required|string|max:150',
            'alasan_monitoring'  => 'nullable|string',
            'status_monitoring'  => 'required|in:dijadwalkan,selesai',
        ]);

        try {
            $monitoring->update($request->only([
                'tanggal_monitoring',
                'jam_monitoring',
                'lokasi_monitoring',
                'alasan_monitoring',
                'status_monitoring'
            ]));
            
            return response()->json(['message' => 'Jadwal monitoring berhasil diperbarui']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // DELETE /api/admin/monitoring/{id}
    public function destroy(int $id)
    {
        $monitoring = Monitoring::find($id);
        if (!$monitoring) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }
        $monitoring->delete();
        return response()->json(['message' => 'Jadwal monitoring berhasil dihapus']);
    }

    // GET /api/mobile/monitoring
    public function mySiswa(Request $request)
    {
        try {
            $user = $request->user();
            $siswa = Siswa::where('id_users', $user->id_users)->first();
            
            if (!$siswa) {
                return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
            }

            // Cari penempatan aktif
            $penempatan = Penempatan::with('guru')
                ->where('id_siswa', $siswa->id_siswa)
                ->whereHas('periode', function($q) {
                    $q->where('tanggal_mulai', '<=', Carbon::today())
                    ->where('tanggal_selesai', '>=', Carbon::today())
                    ->where('status_periode', 'aktif');
                })
                ->first();

            if (!$penempatan) {
                return response()->json(['ada_jadwal' => false, 'data' => []]);
            }

            $data = Monitoring::with(['penempatan.guru'])
                ->where('id_penempatan', $penempatan->id_penempatan)
                ->orderBy('tanggal_monitoring', 'desc')
                ->get();

            $adaJadwal = $data->where('status_monitoring', 'dijadwalkan')->count() > 0;

            return response()->json([
                'ada_jadwal' => $adaJadwal,
                'data'       => $data->map(fn($m) => [
                    'id_monitoring'  => $m->id_monitoring,
                    'nama_guru'      => $m->penempatan?->guru?->nama_guru ?? '-',
                    'tanggal'        => $m->tanggal_monitoring ? Carbon::parse($m->tanggal_monitoring)->translatedFormat('d F Y') : '-',
                    'tanggal_raw'    => $m->tanggal_monitoring ? Carbon::parse($m->tanggal_monitoring)->format('Y-m-d') : null,
                    'jam'            => $m->jam_monitoring,
                    'lokasi'         => $m->lokasi_monitoring,
                    'alasan'         => $m->alasan_monitoring,
                    'status'         => $m->status_monitoring,
                ])
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function format(Monitoring $m): array
    {
        $siswa = $m->penempatan?->siswa;
        $dudi  = $m->penempatan?->dudi;
        $guru  = $m->penempatan?->guru;
        
        return [
            'id_monitoring'  => $m->id_monitoring,
            'nama_siswa'     => $siswa?->nama_siswa ?? '-',
            'kelas_siswa'    => $siswa?->kelas?->tingkat_kelas . ' ' . ($siswa?->kelas?->rombel ?? ''),
            'jurusan_siswa'  => $siswa?->kelas?->jurusan?->nama_jurusan ?? '-',
            'tempat_pkl'     => $dudi?->nama_dudi ?? '-',
            'nama_guru'      => $guru?->nama_guru ?? '-',
            'tanggal'        => $m->tanggal_monitoring ? Carbon::parse($m->tanggal_monitoring)->format('d-m-Y') : '-',
            'tanggal_raw'    => $m->tanggal_monitoring ? Carbon::parse($m->tanggal_monitoring)->format('Y-m-d') : null,
            'jam'            => $m->jam_monitoring,
            'lokasi'         => $m->lokasi_monitoring,
            'alasan'         => $m->alasan_monitoring,
            'status'         => $m->status_monitoring,
        ];
    }
}