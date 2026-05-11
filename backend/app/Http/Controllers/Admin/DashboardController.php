<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\Dudi;
use App\Models\Jurusan;

class DashboardController extends Controller
{
    // GET /api/admin/dashboard
    public function index()
    {
        try {
            // Hitung siswa per jurusan dengan join
            $siswaPerJurusan = Siswa::selectRaw('jurusan.nama_jurusan as label, COUNT(*) as total')
                ->join('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->join('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->groupBy('jurusan.nama_jurusan')
                ->get()
                ->map(fn($s) => [
                    'label' => $s->label,
                    'total' => $s->total,
                ]);

            return response()->json([
                'data' => [
                    'total_siswa'       => Siswa::count(),
                    'total_guru'        => Guru::count(),
                    'total_dudi'        => Dudi::count(),
                    'siswa_per_jurusan' => $siswaPerJurusan,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}