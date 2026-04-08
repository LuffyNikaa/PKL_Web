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
        $query = JurnalHarian::with(['siswa', 'siswa.dudi']);

        // Filter nama siswa
        if ($request->filled('nama')) {
            $query->whereHas('siswa', function ($q) use ($request) {
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
                return [
                    'id_jurnal_harian' => $j->id_jurnal_harian,
                    'nama'             => $j->siswa?->nama_siswa,
                    'tempat_pkl'       => $j->siswa?->dudi?->nama_dudi,
                    'tanggal'          => $j->tanggal_jurnal_harian
                                            ? \Carbon\Carbon::parse($j->tanggal_jurnal_harian)->format('d-m-Y')
                                            : '-',
                    'kegiatan'         => $j->kegiatan_jurnal_harian,
                ];
            }),
        ]);
    }
}