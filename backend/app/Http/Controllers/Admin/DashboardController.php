<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Siswa;
use App\Models\Guru;
use App\Models\Dudi;

class DashboardController extends Controller
{
    // GET /api/admin/dashboard
    public function index()
    {
        try {
            // Hitung siswa per jurusan
            $siswaPerJurusan = Siswa::selectRaw('jurusan_siswa, COUNT(*) as total')
                ->groupBy('jurusan_siswa')
                ->get()
                ->map(fn($s) => [
                    'label' => $s->jurusan_siswa,
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