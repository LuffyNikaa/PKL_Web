<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Users;
use App\Models\Siswa;
use App\Models\Dudi;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class RegisterSiswaController extends Controller
{
    public function register(Request $request)
    {
        // Validasi input
        $validator = Validator::make($request->all(), [
            'nama_siswa' => 'required|string|max:60',
            'email' => 'required|email|unique:users,email_users',
            'password' => 'required|min:6',
            'jk_siswa' => 'required|in:laki-laki,perempuan',
            'jurusan_siswa' => 'required|string|max:50',
            'kelas_siswa' => 'required|string|max:20',
            'nis_siswa' => 'required|string|max:20|unique:siswa,nis_siswa',
            'alamat_siswa' => 'required|string',
            'no_siswa' => 'required|string|max:15',
            'id_dudi' => 'required|exists:dudi,id_dudi'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // Cek apakah DUDI ada
        $dudi = Dudi::find($request->id_dudi);
        if (!$dudi) {
            return response()->json([
                'success' => false,
                'message' => 'DUDI tidak ditemukan'
            ], 404);
        }

        try {
            // Mulai transaction database
            DB::beginTransaction();

            // 1. BUAT USER untuk login
            $user = Users::create([
                'nama_users' => $request->nama_siswa,
                'email_users' => $request->email,
                'password_users' => Hash::make($request->password),
                'role_users' => 'siswa' // role wajib 'siswa' untuk mobile
            ]);

            // 2. BUAT DATA SISWA
            $siswa = Siswa::create([
                'id_user' => $user->id_users,
                'id_dudi' => $request->id_dudi,
                'nama_siswa' => $request->nama_siswa,
                'jk_siwa' => $request->jk_siswa,
                'jurusan_siswa' => $request->jurusan_siswa,
                'kelas_siswa' => $request->kelas_siswa,
                'nis_siswa' => $request->nis_siswa,
                'alamat_siswa' => $request->alamat_siswa,
                'no_siswa' => $request->no_siswa,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Registrasi siswa berhasil',
                'data' => [
                    'user' => [
                        'id_users' => $user->id_users,
                        'nama' => $user->nama_users,
                        'email' => $user->email_users,
                        'role' => $user->role_users
                    ],
                    'siswa' => [
                        'id_siswa' => $siswa->id_siswa,
                        'nama_siswa' => $siswa->nama_siswa,
                        'nis' => $siswa->nis_siswa,
                        'jurusan' => $siswa->jurusan_siswa,
                        'dudi' => $dudi->nama_dudi
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Registrasi gagal: ' . $e->getMessage(),
                'error_detail' => env('APP_DEBUG') ? $e->getTraceAsString() : null
            ], 500);
        }
    }
}
