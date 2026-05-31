<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Users;
use App\Models\Guru;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class GuruController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'nama_guru'   => 'required|string|max:60',
            'nip_guru'    => 'required|string|max:30',
            'mapel_guru'  => 'required|string|max:50',
            'jk_guru'     => 'required|in:laki-laki,perempuan',
            'alamat_guru' => 'required',
            'no_guru'     => 'required|max:30',

            // akun login guru
            'email_users' => 'required|email|unique:users,email_users',
            'password'    => 'required|min:6',
            'status_users' => 'required|in:aktif,nonaktif',
        ]);

        DB::beginTransaction();

        try {
            // 1️⃣ BUAT AKUN LOGIN (users)
            $user = Users::create([
                'nama_users'     => $request->nama_guru,
                'email_users'    => $request->email_users,
                'password_users' => Hash::make($request->password),
                'role_users'     => 'guru',
                'status_users'   => $request->status_users,
            ]);

            // 2️⃣ BUAT DATA GURU
            Guru::create([
                'id_users'     => $user->id_users,
                'nama_guru'   => $request->nama_guru,
                'nip_guru'    => $request->nip_guru,
                'mapel_guru'  => $request->mapel_guru,
                'jk_guru'     => $request->jk_guru,
                'alamat_guru' => $request->alamat_guru,
                'no_guru'     => $request->no_guru,

            ]);

            DB::commit();

            return response()->json([
                'message' => 'Guru berhasil ditambahkan'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Gagal menambahkan guru',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function index()
    {
        $gurus = Guru::with('user')->orderBy('id_guru', 'desc')->get();
        return response()->json([
            'data' => $gurus
        ]);
    }

    public function update(Request $request, int $id)
    {
        $guru = Guru::find($id);
        if (!$guru) {
            return response()->json(['message' => 'Guru tidak ditemukan'], 404);
        }

        $request->validate([
            'nama_guru'   => 'required|string|max:60',
            'nip_guru'    => 'required|string|max:30',
            'mapel_guru'  => 'required|string|max:50',
            'jk_guru'     => 'required|in:laki-laki,perempuan',
            'alamat_guru' => 'required',
            'no_guru'     => 'required|max:30',
            'email_users' => 'nullable|email|unique:users,email_users,' . $guru->id_users . ',id_users',
            'status_users' => 'nullable|in:aktif,nonaktif',
        ]);

        DB::beginTransaction();
        try {
            // Update data guru
            $guru->update([
                'nama_guru'   => $request->nama_guru,
                'nip_guru'    => $request->nip_guru,
                'mapel_guru'  => $request->mapel_guru,
                'jk_guru'     => $request->jk_guru,
                'alamat_guru' => $request->alamat_guru,
                'no_guru'     => $request->no_guru,

            ]);

            // Update data user terkait (nama, email, status)
            $user = Users::find($guru->id_users);
            $updateUser = [
                'nama_users'   => $request->nama_guru,
                'status_users' => $request->status_users ?? $user->status_users,
            ];
            if ($request->filled('email_users')) {
                $updateUser['email_users'] = $request->email_users;
            }
            $user->update($updateUser);

            DB::commit();

            return response()->json(['message' => 'Guru berhasil diperbarui'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal memperbarui guru',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(int $id)
    {
        $guru = Guru::find($id);
        if (!$guru) {
            return response()->json(['message' => 'Guru tidak ditemukan'], 404);
        }

        DB::beginTransaction();
        try {
            // ✅ Hapus data guru dulu
            $guru->delete();

            // ✅ Hapus akun login terkait
            $user = Users::find($guru->id_users);
            if ($user) {
                $user->delete();
            }

            DB::commit();
            return response()->json(['message' => 'Guru berhasil dihapus'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menghapus guru',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
