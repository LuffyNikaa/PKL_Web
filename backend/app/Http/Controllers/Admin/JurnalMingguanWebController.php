<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JurnalMingguan;
use Carbon\Carbon;

class JurnalMingguanWebController extends Controller
{
    // GET /api/admin/jurnal-mingguan
    public function index(Request $request)
    {
        $query = JurnalMingguan::with(['siswa', 'siswa.dudi']);

        if ($request->filled('nama')) {
            $query->whereHas('siswa', function ($q) use ($request) {
                $q->where('nama_siswa', 'like', '%' . $request->nama . '%');
            });
        }

        if ($request->filled('tanggal')) {
            $tanggal = Carbon::parse($request->tanggal);
            $senin   = $tanggal->copy()->startOfWeek(Carbon::MONDAY);
            $minggu  = $tanggal->copy()->endOfWeek(Carbon::SUNDAY);
            $query->whereBetween('tanggal_jurnal_mingguan', [
                $senin->toDateString(),
                $minggu->toDateString(),
            ]);
        }

        $jurnal = $query->orderBy('tanggal_jurnal_mingguan', 'desc')->get();

        return response()->json([
            'data' => $jurnal->map(function ($j) {
                $tanggal  = Carbon::parse($j->tanggal_jurnal_mingguan);
                $senin    = $tanggal->copy()->startOfWeek(Carbon::MONDAY);
                $mingguAkhir = $tanggal->copy()->endOfWeek(Carbon::SUNDAY);

                return [
                    'id_jurnal_mingguan' => $j->id_jurnal_mingguan,
                    'nama'               => $j->siswa?->nama_siswa,
                    'tempat_pkl'         => $j->siswa?->dudi?->nama_dudi,
                    'tanggal'            => $j->tanggal_jurnal_mingguan
                                            ? $tanggal->format('d-m-Y') : '-',
                    'range_tanggal'      => $senin->format('d-m-Y') . ' s/d ' . $mingguAkhir->format('d-m-Y'),
                    'kegiatan'           => $j->kegiatan_jurnal_mingguan,
                    'dokumentasi'        => $j->dokumentasi_jurnal_mingguan
                                            ? asset('storage/' . $j->dokumentasi_jurnal_mingguan)
                                            : null,
                ];
            }),
        ]);
    }
}