<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Siswa;
use App\Models\Users;
use App\Models\Penempatan;
use App\Models\Dudi;
use App\Models\Periode;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class SiswaController extends Controller
{
    // =====================
    // GET /api/admin/siswa
    // =====================
    public function index()
    {
        try {
            $siswa = Siswa::with([
                'kelas.jurusan',
                'penempatan.dudi',
                'user'
            ])->get();

            return response()->json([
                'data' => $siswa->map(function ($s) {
                    $kelasName = $s->kelas ? $s->kelas->tingkat_kelas . ' ' . $s->kelas->rombel : '-';
                    
                    // Ambil penempatan aktif (latest)
                    $penempatan = $s->penempatan?->sortByDesc('id_penempatan')->first();
                    
                    return [
                        'id_siswa' => $s->id_siswa,
                        'id_users' => $s->id_users,
                        'id_kelas' => $s->id_kelas,
                        'nama_siswa' => $s->nama_siswa,
                        'nis_siswa' => $s->nis_siswa,
                        'jk_siswa' => $s->jk_siswa,
                        'alamat_siswa' => $s->alamat_siswa,
                        'no_siswa' => $s->no_siswa,
                        'kelas' => $s->kelas ? [
                            'id_kelas' => $s->kelas->id_kelas,
                            'tingkat_kelas' => $s->kelas->tingkat_kelas,
                            'rombel' => $s->kelas->rombel,
                            'jurusan' => [
                                'nama_jurusan' => $s->kelas->jurusan?->nama_jurusan,
                            ],
                        ] : null,
                        'kelas_siswa' => $kelasName,
                        'jurusan_siswa' => $s->kelas?->jurusan?->nama_jurusan ?? '-',
                        'user' => $s->user ? [
                            'email_users' => $s->user->email_users,
                            'status_users' => $s->user->status_users,
                        ] : null,
                        'dudi' => $penempatan ? [
                            'nama_dudi' => $penempatan->dudi?->nama_dudi
                        ] : null,
                    ];
                })
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching siswa',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // =====================
    // POST /api/admin/siswa
    // =====================
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_siswa'   => 'required|string|max:60',
            'email'        => 'required|email|unique:users,email_users',
            'password'     => 'required|min:6',
            'status_users' => 'required|in:aktif,nonaktif',
            'jk_siswa'     => 'required|in:laki-laki,perempuan',
            'id_kelas'     => 'required|exists:kelas,id_kelas',
            'nis_siswa'    => 'required|string|max:20|unique:siswa,nis_siswa',
            'alamat_siswa' => 'required|string',
            'no_siswa'     => 'required|string|max:15',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $user = Users::create([
                'nama_users'     => $request->nama_siswa,
                'email_users'    => $request->email,
                'password_users' => Hash::make($request->password),
                'role_users'     => 'siswa',
                'status_users'   => $request->status_users,
            ]);

            $siswa = Siswa::create([
                'id_users'     => $user->id_users,
                'id_kelas'     => $request->id_kelas,
                'nama_siswa'   => $request->nama_siswa,
                'jk_siswa'     => $request->jk_siswa,
                'nis_siswa'    => $request->nis_siswa,
                'alamat_siswa' => $request->alamat_siswa,
                'no_siswa'     => $request->no_siswa,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Siswa berhasil ditambahkan',
                'data'    => $siswa
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menambahkan siswa',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // =====================
    // PUT /api/admin/siswa/{id}
    // =====================
    public function update(Request $request, int $id)
    {
        $siswa = Siswa::find($id);

        if (!$siswa) {
            return response()->json([
                'message' => 'Siswa tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_siswa'   => 'required|string|max:60',
            'status_users' => 'required|in:aktif,nonaktif',
            'jk_siswa'     => 'required|in:laki-laki,perempuan',
            'id_kelas'     => 'required|exists:kelas,id_kelas',
            'alamat_siswa' => 'required|string',
            'no_siswa'     => 'required|string|max:15',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $siswa->update([
                'id_kelas'     => $request->id_kelas,
                'nama_siswa'   => $request->nama_siswa,
                'jk_siswa'     => $request->jk_siswa,
                'alamat_siswa' => $request->alamat_siswa,
                'no_siswa'     => $request->no_siswa,
            ]);

            $user = Users::find($siswa->id_users);
            if ($user) {
                $user->update([
                    'nama_users'   => $request->nama_siswa,
                    'status_users' => $request->status_users,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Siswa berhasil diperbarui'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal memperbarui siswa',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // =====================
    // DELETE /api/admin/siswa/{id}
    // =====================
    public function destroy(int $id)
    {
        $siswa = Siswa::find($id);

        if (!$siswa) {
            return response()->json([
                'message' => 'Siswa tidak ditemukan'
            ], 404);
        }

        DB::beginTransaction();

        try {
            $idUser = $siswa->id_users;
            $siswa->delete();
            Users::where('id_users', $idUser)->delete();
            DB::commit();

            return response()->json([
                'message' => 'Siswa berhasil dihapus'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menghapus siswa',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // =====================
    // GET /api/mobile/siswa/profile
    // =====================
    public function profile(Request $request)
    {
        try {
            $user = $request->user();

            $siswa = Siswa::with([
                'user',
                'kelas.jurusan'
            ])
            ->where('id_users', $user->id_users)
            ->first();

            if (!$siswa) {
                return response()->json([
                    'message' => 'Data siswa tidak ditemukan'
                ], 404);
            }

            // Cari penempatan aktif - JOIN ke periode
            $penempatan = Penempatan::with(['dudi', 'periode', 'guru'])
                ->where('id_siswa', $siswa->id_siswa)
                ->whereHas('periode', function($q) {
                    $q->where('tanggal_mulai', '<=', Carbon::today())
                    ->where('tanggal_selesai', '>=', Carbon::today())
                    ->where('status_periode', 'aktif');
                })
                ->first();

            // Data DUDI dari penempatan aktif
            $dudiData = null;
            if ($penempatan && $penempatan->dudi) {
                $dudiData = [
                    'id_dudi'       => $penempatan->dudi->id_dudi,
                    'nama_dudi'     => $penempatan->dudi->nama_dudi,
                    'alamat_dudi'   => $penempatan->dudi->alamat_dudi,
                    'latitude_dudi' => $penempatan->dudi->latitude_dudi,
                    'longitude_dudi'=> $penempatan->dudi->longitude_dudi,
                    'kontak_dudi'   => $penempatan->dudi->kontak_dudi,
                ];
            }

            // Response untuk frontend mobile
            return response()->json([
                'data' => [
                    // Data pribadi
                    'id_siswa'      => $siswa->id_siswa,
                    'nama'          => $siswa->nama_siswa,
                    'email'         => $siswa->user?->email_users,
                    'status'        => $siswa->user?->status_users,
                    'nis'           => $siswa->nis_siswa,
                    'jk'            => $siswa->jk_siswa,
                    'alamat'        => $siswa->alamat_siswa,
                    'no_hp'         => $siswa->no_siswa,
                    
                    // Data kelas & jurusan
                    'jurusan'       => $siswa->kelas?->jurusan?->nama_jurusan,
                    'kelas'         => trim(($siswa->kelas?->tingkat_kelas ?? '') . ' ' . ($siswa->kelas?->rombel ?? '')),
                    
                    // Data DUDI dari penempatan aktif (PENTING untuk presensi)
                    'dudi'          => $dudiData['nama_dudi'] ?? null,
                    'dudi_lat'      => $dudiData['latitude_dudi'] ?? null,
                    'dudi_lon'      => $dudiData['longitude_dudi'] ?? null,
                    'dudi_alamat'   => $dudiData['alamat_dudi'] ?? null,
                    'dudi_kontak'   => $dudiData['kontak_dudi'] ?? null,
                    
                    // Data penempatan & periode
                    'id_penempatan' => $penempatan->id_penempatan ?? null,
                    'id_periode'    => $penempatan?->id_periode,
                    'periode'       => $penempatan?->periode?->nama_periode,
                    'tanggal_mulai' => $penempatan?->periode?->tanggal_mulai,
                    'tanggal_selesai'=> $penempatan?->periode?->tanggal_selesai,
                    'guru_pembimbing' => $penempatan?->guru?->nama_guru,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil profile',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}