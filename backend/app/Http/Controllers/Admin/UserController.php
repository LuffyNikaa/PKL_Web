<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Users;
use App\Models\Guru;
use App\Models\Siswa;
use App\Models\Dudi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    // List all users
    public function index()
    {
        try {
            $users = Users::with(['guru', 'siswa.kelas.jurusan', 'dudi'])->orderBy('id_users', 'desc')->get();
            return response()->json([
                'data' => $users
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil data user',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // Get unlinked users for a specific role
    public function unlinked(Request $request)
    {
        try {
            $role = $request->query('role');
            if (!in_array($role, ['guru', 'siswa', 'dudi'])) {
                return response()->json([
                    'message' => 'Role tidak valid'
                ], 400);
            }

            $query = Users::where('role_users', $role);

            if ($role === 'guru') {
                $query->whereDoesntHave('guru');
            } elseif ($role === 'siswa') {
                $query->whereDoesntHave('siswa');
            } elseif ($role === 'dudi') {
                $query->whereDoesntHave('dudi');
            }

            $users = $query->orderBy('nama_users', 'asc')->get();

            return response()->json([
                'data' => $users
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil data user unlinked',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // Create a new user (Strictly users table only)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_users'   => 'required|string|max:60',
            'email_users'  => 'required|email|unique:users,email_users',
            'password'     => 'required|min:6',
            'role_users'   => 'required|in:admin,guru,siswa,dudi',
            'status_users' => 'required|in:aktif,nonaktif',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $user = Users::create([
                'nama_users'     => $request->nama_users,
                'email_users'    => $request->email_users,
                'password_users' => Hash::make($request->password),
                'role_users'     => $request->role_users,
                'status_users'   => $request->status_users,
            ]);

            return response()->json([
                'message' => 'User berhasil ditambahkan',
                'data'    => $user
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menambahkan user',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // Update user (Strictly users table only)
    public function update(Request $request, int $id)
    {
        $user = Users::find($id);
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_users'   => 'required|string|max:60',
            'email_users'  => 'required|email|unique:users,email_users,' . $id . ',id_users',
            'status_users' => 'required|in:aktif,nonaktif',
            'password'     => 'nullable|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {
            $updateData = [
                'nama_users'   => $request->nama_users,
                'email_users'  => $request->email_users,
                'status_users' => $request->status_users,
            ];

            if ($request->filled('password')) {
                $updateData['password_users'] = Hash::make($request->password);
            }

            $user->update($updateData);

            // Synchronize name in related profile if exists
            if ($user->role_users === 'guru') {
                Guru::where('id_users', $id)->update(['nama_guru' => $request->nama_users]);
            } elseif ($user->role_users === 'siswa') {
                Siswa::where('id_users', $id)->update(['nama_siswa' => $request->nama_users]);
            } elseif ($user->role_users === 'dudi') {
                Dudi::where('id_users', $id)->update(['nama_dudi' => $request->nama_users]);
            }

            return response()->json([
                'message' => 'User berhasil diperbarui'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui user',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // Delete user (also cleans up profile in transaction to avoid DB constraint failures)
    public function destroy(int $id)
    {
        $user = Users::find($id);
        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        DB::beginTransaction();
        try {
            if ($user->role_users === 'guru') {
                Guru::where('id_users', $id)->delete();
            } elseif ($user->role_users === 'siswa') {
                Siswa::where('id_users', $id)->delete();
            } elseif ($user->role_users === 'dudi') {
                Dudi::where('id_users', $id)->update(['id_users' => null]);
            }

            $user->delete();

            DB::commit();

            return response()->json([
                'message' => 'User berhasil dihapus'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menghapus user',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
