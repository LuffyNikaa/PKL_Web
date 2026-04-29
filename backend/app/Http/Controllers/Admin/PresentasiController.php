<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Presentasi;
use App\Models\Siswa;

class PresentasiController extends Controller
{
    // GET /api/admin/presentasi
    public function index(Request $request)
    {
        $query = Presentasi::with(['siswa', 'siswa.dudi']);

        if ($request->filled('nama')) {
            $query->whereHas('siswa', fn($q) =>
                $q->where('nama_siswa', 'like', '%' . $request->nama . '%')
            );
        }
        if ($request->filled('status'))  $query->where('status_presentasi', $request->status);
        if ($request->filled('tanggal')) $query->whereDate('tanggal_presentasi', $request->tanggal);

        return response()->json([
            'data' => $query->orderBy('tanggal_presentasi', 'desc')->get()->map(fn($p) => $this->format($p))
        ]);
    }

    // POST /api/admin/presentasi
    public function store(Request $request)
    {
        $request->validate([
            'siswa_id_siswa'      => 'required|exists:siswa,id_siswa',
            'tanggal_presentasi'  => 'required|date',
            'jam_presentasi'      => 'required',
            'ruangan_presentasi'  => 'required|string|max:30',
            'status_presentasi'   => 'required|in:dijadwalkan,selesai',
        ], [
            'siswa_id_siswa.required'     => 'Siswa wajib dipilih',
            'tanggal_presentasi.required' => 'Tanggal wajib diisi',
            'jam_presentasi.required'     => 'Jam wajib diisi',
            'ruangan_presentasi.required' => 'Ruangan wajib diisi',
        ]);

        try {
            $siswa = Siswa::find($request->siswa_id_siswa);

            $p = Presentasi::create([
                'siswa_id_siswa'     => $siswa->id_siswa,
                'siswa_id_user'      => $siswa->id_user,
                'siswa_id_dudi'      => $siswa->id_dudi,
                'tanggal_presentasi' => $request->tanggal_presentasi,
                'jam_presentasi'     => $request->jam_presentasi,
                'ruangan_presentasi' => $request->ruangan_presentasi,
                'status_presentasi'  => $request->status_presentasi,
            ]);

            return response()->json(['message' => 'Jadwal presentasi berhasil ditambahkan', 'data' => $this->format($p->load(['siswa', 'siswa.dudi']))], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/admin/presentasi/{id}
    public function update(Request $request, $id)
    {
        $p = Presentasi::find($id);
        if (!$p) return response()->json(['message' => 'Data tidak ditemukan'], 404);

        $request->validate([
            'tanggal_presentasi'  => 'required|date',
            'jam_presentasi'      => 'required',
            'ruangan_presentasi'  => 'required|string|max:30',
            'status_presentasi'   => 'required|in:dijadwalkan,selesai',
        ]);

        try {
            $p->update($request->only(['tanggal_presentasi','jam_presentasi','ruangan_presentasi','status_presentasi']));
            return response()->json(['message' => 'Jadwal presentasi berhasil diperbarui']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // DELETE /api/admin/presentasi/{id}
    public function destroy($id)
    {
        $p = Presentasi::find($id);
        if (!$p) return response()->json(['message' => 'Data tidak ditemukan'], 404);
        $p->delete();
        return response()->json(['message' => 'Jadwal presentasi berhasil dihapus']);
    }

    // GET /api/mobile/presentasi
    public function mySiswa(Request $request)
    {
        try {
            $user  = $request->user();
            $siswa = Siswa::where('id_user', $user->id_users)->first();
            if (!$siswa) return response()->json(['message' => 'Siswa tidak ditemukan'], 404);

            $data = Presentasi::where('siswa_id_siswa', $siswa->id_siswa)
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
        return [
            'id_presentasi'     => $p->id_presentasi,
            'nama_siswa'        => $p->siswa?->nama_siswa,
            'tempat_pkl'        => $p->siswa?->dudi?->nama_dudi,
            'tanggal'           => $p->tanggal_presentasi?->format('d-m-Y'),
            'tanggal_raw'       => $p->tanggal_presentasi?->format('Y-m-d'),
            'jam'               => $p->jam_presentasi,
            'ruangan'           => $p->ruangan_presentasi,
            'status'            => $p->status_presentasi,
        ];
    }
}