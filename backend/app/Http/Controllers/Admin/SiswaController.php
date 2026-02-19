<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Users;
use App\Models\Siswa;
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
        $siswa = Siswa::with(['user', 'dudi'])->get();

        return response()->json([
            'data' => $siswa
        ], 200);
    }

    // =====================
    // POST /api/admin/siswa
    // =====================
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_siswa'     => 'required|string|max:60',
            'email'          => 'required|email|unique:users,email_users',
            'password'       => 'required|min:6',
            'jk_siwa'       => 'required|in:laki-laki,perempuan',
            'jurusan_siswa'  => 'required|string|max:50',
            'kelas_siswa'    => 'required|string|max:20',
            'nis_siswa'      => 'required|string|max:20|unique:siswa,nis_siswa',
            'alamat_siswa'   => 'required|string',
            'no_siswa'       => 'required|string|max:15',
            'id_dudi'        => 'required|exists:dudi,id_dudi'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // 1️⃣ BUAT USER
            $user = Users::create([
                'nama_users'     => $request->nama_siswa,
                'email_users'    => $request->email,
                'password_users' => Hash::make($request->password),
                'role_users'     => 'siswa'
            ]);

            // 2️⃣ BUAT SISWA
            $siswa = Siswa::create([
                'id_user'        => $user->id_users,
                'id_dudi'        => $request->id_dudi,
                'nama_siswa'     => $request->nama_siswa,
                'jk_siwa'        => $request->jk_siwa, // ⬅ sesuai tabel
                'jurusan_siswa'  => $request->jurusan_siswa,
                'kelas_siswa'    => $request->kelas_siswa,
                'nis_siswa'      => $request->nis_siswa,
                'alamat_siswa'   => $request->alamat_siswa,
                'no_siswa'       => $request->no_siswa,
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
    public function update(Request $request, $id)
    {
        $siswa = Siswa::find($id);
        if (!$siswa) {
            return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_siswa'     => 'required|string|max:60',
            'jk_siwa'       => 'required|in:laki-laki,perempuan',
            'jurusan_siswa'  => 'required|string|max:50',
            'kelas_siswa'    => 'required|string|max:20',
            'alamat_siswa'   => 'required|string',
            'no_siswa'       => 'required|string|max:15',
            'id_dudi'        => 'required|exists:dudi,id_dudi'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update siswa
            $siswa->update([
                'id_dudi'        => $request->id_dudi,
                'nama_siswa'     => $request->nama_siswa,
                'jk_siwa'        => $request->jk_siwa,
                'jurusan_siswa'  => $request->jurusan_siswa,
                'kelas_siswa'    => $request->kelas_siswa,
                'alamat_siswa'   => $request->alamat_siswa,
                'no_siswa'       => $request->no_siswa,
            ]);

            // Sinkron nama di users
            $user = Users::find($siswa->id_user);
            if ($user) {
                $user->update([
                    'nama_users' => $request->nama_siswa
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
    public function destroy($id)
    {
        $siswa = Siswa::find($id);
        if (!$siswa) {
            return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
        }

        DB::beginTransaction();
        try {
            // Hapus siswa
            $siswa->delete();

            // Hapus akun user
            $user = Users::find($siswa->id_user);
            if ($user) {
                $user->delete();
            }

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
        // user yang sedang login (sanctum)
        $user = $request->user();

        // ambil siswa berdasarkan user login
        $siswa = Siswa::where('id_user', $user->id_users)->first();

        // ambil siswa + relasi dudi
        $siswa = Siswa::with('dudi')->where('id_user', $user->id_users)->first();

        if (!$siswa) {
            return response()->json([
                'message' => 'Data siswa tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'data' => [
                'nama'    => $siswa->nama_siswa,
                'email'   => $siswa->user?->email_users,
                'jurusan' => $siswa->jurusan_siswa,
                'kelas'   => $siswa->kelas_siswa,
                'nis'     => $siswa->nis_siswa,
                'alamat'  => $siswa->alamat_siswa,
                'no_hp'   => $siswa->no_siswa,
                'dudi'    => $siswa->dudi ? $siswa->dudi->nama_dudi : null,
            ]
        ], 200);
    }
}
