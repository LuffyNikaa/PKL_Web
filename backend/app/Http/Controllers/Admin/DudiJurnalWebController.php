<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\JurnalHarian;
use Carbon\Carbon;

class DudiJurnalWebController extends Controller
{
    // GET /api/admin/dudi/jurnal-harian
    public function index(Request $request)
    {
        $user = $request->user();

        // ✅ Cek role dudi
        if ($user->role_users !== 'dudi') {
            return response()->json(['message' => 'Akses hanya untuk DUDI'], 403);
        }

        if (!$user->dudi) {
            return response()->json(['message' => 'Akun DUDI belum terhubung ke profil DUDI'], 422);
        }

        $dudiId = $user->dudi->id_dudi;

        $query = JurnalHarian::with([
            'penempatan' => function ($q) {
                $q->with(['siswa.kelas.jurusan', 'dudi']);
            }
        ])->whereHas('penempatan.dudi', function ($q) use ($dudiId) {
            $q->where('id_dudi', $dudiId);
        });

        // Filter by date
        if ($request->filled('tanggal')) {
            $query->whereDate('tanggal_jurnal_harian', $request->tanggal);
        }

        // ✅ Filter by status
        if ($request->filled('status')) {
            $query->where('status_jurnal_harian', $request->status);
        }

        $jurnal = $query->orderBy('tanggal_jurnal_harian', 'desc')
                        ->orderBy('id_jurnal_harian', 'desc')
                        ->get();

        // ✅ Hitung statistik
        $statistik = [
            'total' => $jurnal->count(),
            'pending' => $jurnal->where('status_jurnal_harian', 'pending')->count(),
            'approved' => $jurnal->where('status_jurnal_harian', 'approved')->count(),
            'rejected' => $jurnal->where('status_jurnal_harian', 'rejected')->count(),
        ];

        return response()->json([
            'statistik' => $statistik,
            'data' => $jurnal->map(function ($j) {
                $siswa = $j->penempatan?->siswa;
                $dudi = $j->penempatan?->dudi;

                $tingkat = $siswa?->kelas?->tingkat_kelas ?? '';
                $jurusan = $siswa?->kelas?->jurusan?->singkatan_jurusan ?? $siswa?->kelas?->jurusan?->nama_jurusan ?? '';
                $rombel  = $siswa?->kelas?->rombel ?? '';
                $kelasFormatted = trim(preg_replace('/\s+/', ' ', "$tingkat $jurusan $rombel"));
                if (empty($kelasFormatted)) {
                    $kelasFormatted = '-';
                }

                return [
                    'id_jurnal_harian' => $j->id_jurnal_harian,
                    'nama_siswa'       => $siswa?->nama_siswa ?? '-',
                    'kelas_siswa'      => $kelasFormatted,
                    'nama_dudi'        => $dudi?->nama_dudi ?? '-',
                    'tanggal'          => $j->tanggal_jurnal_harian
                                            ? $j->tanggal_jurnal_harian->format('d-m-Y')
                                            : '-',
                    'tanggal_raw'      => $j->tanggal_jurnal_harian
                                            ? $j->tanggal_jurnal_harian->format('Y-m-d')
                                            : null,
                    'kegiatan'         => $j->kegiatan_jurnal_harian,
                    'status'           => $j->status_jurnal_harian ?? 'pending',
                    'catatan_approval' => $j->catatan_approval,
                    'approved_at'      => $j->approved_at ? Carbon::parse($j->approved_at)->format('d-m-Y H:i') : null,
                ];
            }),
        ]);
    }

    // POST /api/admin/dudi/jurnal-harian/{id}/approve
    public function approve(Request $request, int $id)
    {
        $request->validate([
            'catatan' => 'nullable|string|max:500',
        ]);

        $user = $request->user();

        if ($user->role_users !== 'dudi') {
            return response()->json(['message' => 'Akses hanya untuk DUDI'], 403);
        }

        if (!$user->dudi) {
            return response()->json(['message' => 'Akun DUDI belum terhubung ke profil DUDI'], 422);
        }

        $jurnal = JurnalHarian::with('penempatan.dudi')
            ->where('id_jurnal_harian', $id)
            ->first();

        if (!$jurnal) {
            return response()->json(['message' => 'Jurnal tidak ditemukan'], 404);
        }

        // ✅ Cek kepemilikan
        if ($jurnal->penempatan?->dudi?->id_dudi !== $user->dudi->id_dudi) {
            return response()->json(['message' => 'Akses ditolak, jurnal bukan untuk DUDI Anda'], 403);
        }

        // ✅ Cek apakah sudah di-approve/reject sebelumnya
        if ($jurnal->status_jurnal_harian !== 'pending') {
            return response()->json([
                'message' => 'Jurnal sudah ' . ($jurnal->status_jurnal_harian === 'approved' ? 'disetujui' : 'ditolak') . ' sebelumnya'
            ], 422);
        }

        $jurnal->update([
            'status_jurnal_harian' => 'approved',
            'approved_by' => $user->id_users,
            'approved_at' => Carbon::now(),
            'catatan_approval' => $request->catatan,
        ]);

        return response()->json([
            'message' => 'Jurnal berhasil disetujui',
            'data' => [
                'id_jurnal_harian' => $jurnal->id_jurnal_harian,
                'status' => 'approved',
                'approved_at' => Carbon::now()->format('d-m-Y H:i'),
            ]
        ]);
    }

    // POST /api/admin/dudi/jurnal-harian/{id}/reject
    public function reject(Request $request, int $id)
    {
        $request->validate([
            'catatan' => 'required|string|max:500',
        ], [
            'catatan.required' => 'Catatan penolakan wajib diisi',
        ]);

        $user = $request->user();

        if ($user->role_users !== 'dudi') {
            return response()->json(['message' => 'Akses hanya untuk DUDI'], 403);
        }

        if (!$user->dudi) {
            return response()->json(['message' => 'Akun DUDI belum terhubung ke profil DUDI'], 422);
        }

        $jurnal = JurnalHarian::with('penempatan.dudi')
            ->where('id_jurnal_harian', $id)
            ->first();

        if (!$jurnal) {
            return response()->json(['message' => 'Jurnal tidak ditemukan'], 404);
        }

        // ✅ Cek kepemilikan
        if ($jurnal->penempatan?->dudi?->id_dudi !== $user->dudi->id_dudi) {
            return response()->json(['message' => 'Akses ditolak, jurnal bukan untuk DUDI Anda'], 403);
        }

        // ✅ Cek apakah sudah di-approve/reject sebelumnya
        if ($jurnal->status_jurnal_harian !== 'pending') {
            return response()->json([
                'message' => 'Jurnal sudah ' . ($jurnal->status_jurnal_harian === 'approved' ? 'disetujui' : 'ditolak') . ' sebelumnya'
            ], 422);
        }

        $jurnal->update([
            'status_jurnal_harian' => 'rejected',
            'approved_by' => $user->id_users,
            'approved_at' => Carbon::now(),
            'catatan_approval' => $request->catatan,
        ]);

        return response()->json([
            'message' => 'Jurnal berhasil ditolak',
            'data' => [
                'id_jurnal_harian' => $jurnal->id_jurnal_harian,
                'status' => 'rejected',
                'catatan_approval' => $request->catatan,
            ]
        ]);
    }

    // GET /api/admin/dudi/statistik
    public function statistik(Request $request)
    {
        $user = $request->user();

        if ($user->role_users !== 'dudi') {
            return response()->json(['message' => 'Akses hanya untuk DUDI'], 403);
        }

        if (!$user->dudi) {
            return response()->json(['message' => 'Akun DUDI belum terhubung ke profil DUDI'], 422);
        }

        $dudiId = $user->dudi->id_dudi;

        $total = JurnalHarian::whereHas('penempatan.dudi', function ($q) use ($dudiId) {
            $q->where('id_dudi', $dudiId);
        })->count();

        $pending = JurnalHarian::whereHas('penempatan.dudi', function ($q) use ($dudiId) {
            $q->where('id_dudi', $dudiId);
        })->where('status_jurnal_harian', 'pending')->count();

        $approved = JurnalHarian::whereHas('penempatan.dudi', function ($q) use ($dudiId) {
            $q->where('id_dudi', $dudiId);
        })->where('status_jurnal_harian', 'approved')->count();

        $rejected = JurnalHarian::whereHas('penempatan.dudi', function ($q) use ($dudiId) {
            $q->where('id_dudi', $dudiId);
        })->where('status_jurnal_harian', 'rejected')->count();

        return response()->json([
            'total' => $total,
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
        ]);
    }
}