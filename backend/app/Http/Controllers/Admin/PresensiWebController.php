<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Presensi;

class PresensiWebController extends Controller
{
    // GET /api/admin/presensi
    public function index(Request $request)
    {
        $query = Presensi::with(['siswa', 'siswa.dudi']);

        // Filter status
        if ($request->filled('status')) {
            $query->where('status_absensi', $request->status);
        }

        // Filter tanggal
        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal_absensi', $request->tanggal);
        }

        // Filter nama siswa
        if ($request->filled('nama')) {
            $query->whereHas('siswa', function ($q) use ($request) {
                $q->where('nama_siswa', 'like', '%' . $request->nama . '%');
            });
        }

        $presensi = $query->orderBy('tanggal_absensi', 'desc')->get();

        return response()->json([
            'data' => $presensi->map(function ($p) {
                return [
                    'id_absensi'        => $p->id_absensi,
                    'nama'              => $p->siswa?->nama_siswa,
                    'tempat_pkl'        => $p->siswa?->dudi?->nama_dudi,
                    'tanggal_absensi'   => $p->tanggal_absensi?->format('d-m-Y'),
                    'waktu_absensi'     => $p->waktu_absensi,
                    'waktu_pulang'      => $p->waktu_pulang,
                    'latitude_absensi'  => $p->latitude_absensi,
                    'longitude_absensi' => $p->longitude_absensi,
                    'status_absensi'    => $p->status_absensi,
                    'alasan_absensi'    => $p->alasan_absensi,
                    'foto_surat'        => $p->foto_surat ? asset('storage/' . $p->foto_surat) : null,
                ];
            }),
        ]);
    }
}