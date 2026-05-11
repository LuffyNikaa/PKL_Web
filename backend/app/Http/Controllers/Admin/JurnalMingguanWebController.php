<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JurnalMingguan;
use App\Models\Penempatan;
use App\Models\Siswa;
use Carbon\Carbon;

class JurnalMingguanWebController extends Controller
{
    // GET /api/admin/jurnal-mingguan
    public function index(Request $request)
    {
        $query = JurnalMingguan::with(['penempatan.siswa', 'penempatan.dudi']);

        if ($request->filled('nama')) {
            $query->whereHas('penempatan.siswa', function ($q) use ($request) {
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
                $siswa    = $j->penempatan?->siswa;
                $dudi     = $j->penempatan?->dudi;

                // Hitung minggu ke-
                $mingguKe = $this->hitungMinggu($j->penempatan?->id_penempatan, $tanggal);

                return [
                    'id_jurnal_mingguan' => $j->id_jurnal_mingguan,
                    'nama'               => $siswa?->nama_siswa ?? '-',
                    'kelas'              => $siswa?->kelas?->tingkat_kelas . ' ' . ($siswa?->kelas?->rombel ?? ''),
                    'tempat_pkl'         => $dudi?->nama_dudi ?? '-',
                    'tanggal'            => $tanggal->format('d-m-Y'),
                    'range_tanggal'      => $senin->format('d-m-Y') . ' s/d ' . $mingguAkhir->format('d-m-Y'),
                    'minggu_ke'          => $mingguKe,
                    'kegiatan'           => $j->kegiatan_jurnal_mingguan,
                    'dokumentasi'        => $j->dokumentasi_jurnal_mingguan
                                            ? asset('storage/' . $j->dokumentasi_jurnal_mingguan)
                                            : null,
                ];
            }),
        ]);
    }

    // Hitung minggu ke- berdasarkan penempatan
    private function hitungMinggu(int $idPenempatan, Carbon $tanggal): int
    {
        if (!$idPenempatan) return 1;
        
        $pertama = JurnalMingguan::where('id_penempatan', $idPenempatan)
            ->orderBy('tanggal_jurnal_mingguan', 'asc')
            ->value('tanggal_jurnal_mingguan');

        if (!$pertama) return 1;

        $awal = Carbon::parse($pertama)->startOfWeek(Carbon::MONDAY);
        $mingguIni = $tanggal->copy()->startOfWeek(Carbon::MONDAY);

        return (int) $awal->diffInWeeks($mingguIni) + 1;
    }

    // GET /api/admin/jurnal-mingguan/siswa/{id_siswa}
    public function getBySiswa(int $id_siswa, Request $request)
    {
        // Cari penempatan aktif siswa
        $penempatan = Penempatan::where('id_siswa', $id_siswa)
            ->first();

        if (!$penempatan) {
            return response()->json(['data' => []]);
        }

        $query = JurnalMingguan::where('id_penempatan', $penempatan->id_penempatan)
            ->orderBy('tanggal_jurnal_mingguan', 'asc');

        $jurnal = $query->get()->map(function ($j, $index) {
            $tanggal = Carbon::parse($j->tanggal_jurnal_mingguan);
            $senin   = $tanggal->copy()->startOfWeek(Carbon::MONDAY);
            $minggu  = $tanggal->copy()->endOfWeek(Carbon::SUNDAY);

            return [
                'minggu_ke'     => $index + 1,
                'tanggal'       => $j->tanggal_jurnal_mingguan,
                'range_tanggal' => $senin->format('d-m-Y') . ' s/d ' . $minggu->format('d-m-Y'),
                'kegiatan'      => $j->kegiatan_jurnal_mingguan,
                'dokumentasi'   => $j->dokumentasi_jurnal_mingguan 
                                    ? asset('storage/' . $j->dokumentasi_jurnal_mingguan) 
                                    : null,
            ];
        });

        return response()->json(['data' => $jurnal]);
    }
}