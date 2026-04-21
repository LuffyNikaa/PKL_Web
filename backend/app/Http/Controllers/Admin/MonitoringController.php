<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Monitoring;
use App\Models\Siswa;
use App\Models\Guru;

class MonitoringController extends Controller
{
    // GET /api/admin/monitoring
    public function index(Request $request)
    {
        $query = Monitoring::with(['siswa', 'siswa.dudi', 'guru']);

        if ($request->filled('nama')) {
            $query->whereHas('siswa', fn($q) =>
                $q->where('nama_siswa', 'like', '%' . $request->nama . '%')
            );
        }
        if ($request->filled('status'))  $query->where('status_monitoring', $request->status);
        if ($request->filled('tanggal')) $query->whereDate('tanggal_monitoring', $request->tanggal);

        return response()->json([
            'data' => $query->orderBy('tanggal_monitoring', 'desc')->get()->map(fn($m) => $this->format($m))
        ]);
    }

    // POST /api/admin/monitoring
    public function store(Request $request)
    {
        $request->validate([
            'siswa_id_siswa'     => 'required|exists:siswa,id_siswa',
            'tanggal_monitoring' => 'required|date',
            'jam_monitoring'     => 'required',
            'lokasi_monitoring'  => 'required|string|max:150',
            'alasan_monitoring'  => 'nullable|string',
            'status_monitoring'  => 'required|in:dijadwalkan,selesai',
        ], [
            'siswa_id_siswa.required'     => 'Siswa wajib dipilih',
            'tanggal_monitoring.required' => 'Tanggal wajib diisi',
            'jam_monitoring.required'     => 'Jam wajib diisi',
            'lokasi_monitoring.required'  => 'Lokasi wajib diisi',
        ]);

        try {
            $user  = $request->user();
            $guru  = Guru::where('id_users', $user->id_users)->first();
            $siswa = Siswa::find($request->siswa_id_siswa);

            $m = Monitoring::create([
                'siswa_id_siswa'     => $siswa->id_siswa,
                'siswa_id_user'      => $siswa->id_user,
                'siswa_id_dudi'      => $siswa->id_dudi,
                'guru_id_guru'       => $guru?->id_guru,
                'guru_id_users'      => $user->id_users,
                'tanggal_monitoring' => $request->tanggal_monitoring,
                'jam_monitoring'     => $request->jam_monitoring,
                'lokasi_monitoring'  => $request->lokasi_monitoring,
                'alasan_monitoring'  => $request->alasan_monitoring,
                'status_monitoring'  => $request->status_monitoring,
            ]);

            return response()->json(['message' => 'Jadwal monitoring berhasil ditambahkan', 'data' => $this->format($m->load(['siswa', 'siswa.dudi', 'guru']))], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/admin/monitoring/{id}
    public function update(Request $request, $id)
    {
        $m = Monitoring::find($id);
        if (!$m) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        $request->validate([
            'tanggal_monitoring' => 'required|date',
            'jam_monitoring'     => 'required',
            'lokasi_monitoring'  => 'required|string|max:150',
            'alasan_monitoring'  => 'nullable|string',
            'status_monitoring'  => 'required|in:dijadwalkan,selesai',
        ]);

        try {
            $m->update($request->only(['tanggal_monitoring','jam_monitoring','lokasi_monitoring','alasan_monitoring','status_monitoring']));
            return response()->json(['message' => 'Jadwal monitoring berhasil diperbarui']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // DELETE /api/admin/monitoring/{id}
    public function destroy($id)
    {
        $m = Monitoring::find($id);
        if (!$m) return response()->json(['message' => 'Data tidak ditemukan'], 404);
        $m->delete();
        return response()->json(['message' => 'Jadwal monitoring berhasil dihapus']);
    }

    // GET /api/mobile/monitoring
    public function mySiswa(Request $request)
    {
        try {
            $user  = $request->user();
            $siswa = Siswa::where('id_user', $user->id_users)->first();
            if (!$siswa) return response()->json(['message' => 'Siswa tidak ditemukan'], 404);

            $data = Monitoring::with(['guru'])
                ->where('siswa_id_siswa', $siswa->id_siswa)
                ->orderBy('tanggal_monitoring', 'desc')
                ->get();

            // Cek apakah ada jadwal dijadwalkan
            $adaJadwal = $data->where('status_monitoring', 'dijadwalkan')->count() > 0;

            return response()->json([
                'ada_jadwal' => $adaJadwal,
                'data'       => $data->map(fn($m) => $this->format($m)),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    private function format(Monitoring $m): array
    {
        return [
            'id_monitoring'  => $m->id_monitoring,
            'nama_siswa'     => $m->siswa?->nama_siswa,
            'tempat_pkl'     => $m->siswa?->dudi?->nama_dudi,
            'nama_guru'      => $m->guru?->nama_guru,
            'tanggal'        => $m->tanggal_monitoring?->format('d-m-Y'),
            'tanggal_raw'    => $m->tanggal_monitoring?->format('Y-m-d'),
            'jam'            => $m->jam_monitoring,
            'lokasi'         => $m->lokasi_monitoring,
            'alasan'         => $m->alasan_monitoring,
            'status'         => $m->status_monitoring,
        ];
    }
}