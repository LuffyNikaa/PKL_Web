<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Users;
use App\Models\Dudi;
use Illuminate\Support\Facades\DB;

class RegisterDudiController extends Controller
{
    // POST /api/register/dudi
    public function register(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|unique:users,email_users',
            'password' => 'required|string|min:8',
            'id_dudi' => 'required|integer|exists:dudi,id_dudi',
        ]);

        // find dudi
        $dudi = Dudi::find($data['id_dudi']);
        if (!$dudi) {
            return response()->json(['message' => 'Dudi tidak ditemukan'], 404);
        }

        if (!is_null($dudi->id_users)) {
            return response()->json(['message' => 'Dudi sudah memiliki akun terdaftar'], 422);
        }

        DB::beginTransaction();
        try {
            $user = Users::create([
                'nama_users' => $dudi->nama_dudi ?: 'DuDi',
                'email_users' => $data['email'],
                'password_users' => $data['password'],
                'role_users' => 'dudi',
            ]);

            $dudi->id_users = $user->id_users;
            $dudi->save();

            DB::commit();

            $token = $user->createToken('dudi-web')->plainTextToken;

            // refresh dudi to include id_users
            $dudi->refresh();

            return response()->json([
                'message' => 'Akun DuDi berhasil dibuat',
                'data' => [
                    'user' => $user,
                    'dudi' => $dudi,
                    'token' => $token,
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal membuat akun', 'error' => $e->getMessage()], 500);
        }
    }

    // GET /api/register/dudi
    // Return DuDi entries available for registration (not linked to users)
    public function available(Request $request)
    {
        $query = Dudi::select('id_dudi', 'nama_dudi', 'alamat_dudi', 'kontak_dudi')
            ->whereNull('id_users')
            ->orderBy('nama_dudi');

        if ($request->filled('q')) {
            $query->where('nama_dudi', 'like', '%' . $request->q . '%');
        }

        return response()->json(['data' => $query->get()]);
    }
}
