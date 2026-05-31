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
        // Load presensi dengan relasi penempatan > siswa > kelas > jurusan & penempatan > dudi
        $query = Presensi::with([
            'penempatan' => function ($q) {
                $q->with([
                    'siswa' => function ($q2) {
                        $q2->with('kelas.jurusan');
                    },
                    'dudi'
                ]);
            }
        ]);

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
            $query->whereHas('penempatan.siswa', function ($q) use ($request) {
                $q->where('nama_siswa', 'like', '%' . $request->nama . '%');
            });
        }

        $presensi = $query->orderBy('tanggal_absensi', 'desc')
                          ->orderBy('id_absensi', 'desc')
                          ->get();

        return response()->json([
            'data' => $presensi->map(function ($p) {
                $siswa = $p->penempatan?->siswa;
                $dudi = $p->penempatan?->dudi;
                
                return [
                    'id_absensi'        => $p->id_absensi,
                    'nama'              => $siswa?->nama_siswa,
                    'tempat_pkl'        => $dudi?->nama_dudi,
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