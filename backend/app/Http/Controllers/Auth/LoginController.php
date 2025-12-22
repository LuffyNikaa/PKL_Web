<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Users;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class LoginController extends Controller
{
    public function loginWeb(Request $request)
    {
        $request->validate([
            'email_users' => 'required|email',
            'password' => 'required'
        ]);

        $user = Users::where('email_users', $request->email_users)->first();

        if (!$user || !Hash::check($request->password, $user->password_users)) {
            return response()->json(['message' => 'Login gagal'], 401);
        }

        if (!in_array($user->role_users, ['admin', 'guru'])) {
            return response()->json(['message' => 'Akses CMS ditolak'], 403);
        }

        $user->tokens()->where('name', 'web-token')->delete();

        $token = $user->createToken('web-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'role' => $user->role_users,
            'user' => [
                'id' => $user->id_users,
                'name' => $user->nama_users,
                'email' => $user->email_users
            ]
        ]);
    }

    public function loginMobile(Request $request)
{
    $request->validate([
        'email' => 'required|email', // pastikan field name sama
        'password' => 'required'
    ]);

    // Gunakan model Users langsung
    $user = Users::where('email_users', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password_users)) {
        return response()->json(['message' => 'Login gagal'], 401);
    }

    // Cek role untuk mobile (admin atau siswa)
    if (!in_array($user->role_users, ['admin', 'siswa'])) {
        return response()->json(['message' => 'Akses Mobile ditolak'], 403);
    }

    // Hapus token lama jika ada
    $user->tokens()->where('name', 'mobile-token')->delete();

    $responseData = [
        'token' => $user->createToken('mobile-token')->plainTextToken,
        'role' => $user->role_users,
        'user' => [
            'id_users' => $user->id_users,
            'nama' => $user->nama_users,
            'email' => $user->email_users,
        ]
    ];

    // Jika role siswa, tambahkan data siswa
    if ($user->role_users === 'siswa' && $user->siswa) {
        $responseData['siswa'] = [
            'id_siswa' => $user->siswa->id_siswa,
            'nama_siswa' => $user->siswa->nama_siswa,
            'nis_siswa' => $user->siswa->nis_siswa,
            'jurusan_siswa' => $user->siswa->jurusan_siswa,
            'dudi' => $user->siswa->dudi ? $user->siswa->dudi->nama_dudi : null
        ];
    }

    return response()->json($responseData);
}

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil']);
    }
}