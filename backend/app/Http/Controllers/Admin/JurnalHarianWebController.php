<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JurnalHarian;

class JurnalHarianWebController extends Controller
{
    // GET /api/admin/jurnal-harian
    public function index(Request $request)
    {
        // Load jurnal dengan relasi penempatan > siswa > kelas > jurusan & penempatan > dudi
        $query = JurnalHarian::with([
            'penempatan' => function ($q) {
                $q->with([
                    'siswa' => function ($q2) {
                        $q2->with('kelas.jurusan');
                    },
                    'dudi'
                ]);
            }
        ]);

        // Filter nama siswa
        if ($request->filled('nama')) {
            $query->whereHas('penempatan.siswa', function ($q) use ($request) {
                $q->where('nama_siswa', 'like', '%' . $request->nama . '%');
            });
        }

        // Filter tanggal
        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal_jurnal_harian', $request->tanggal);
        }

        $jurnal = $query->orderBy('tanggal_jurnal_harian', 'desc')->get();

        return response()->json([
            'data' => $jurnal->map(function ($j) {
                $siswa = $j->penempatan?->siswa;
                $dudi = $j->penempatan?->dudi;
                
                return [
                    'id_jurnal_harian' => $j->id_jurnal_harian,
                    'nama'             => $siswa?->nama_siswa,
                    'tempat_pkl'       => $dudi?->nama_dudi,
                    'tanggal'          => $j->tanggal_jurnal_harian
                                            ? $j->tanggal_jurnal_harian->format('d-m-Y')
                                            : '-',
                    'kegiatan'         => $j->kegiatan_jurnal_harian,
                ];
            }),
        ]);
    }
}