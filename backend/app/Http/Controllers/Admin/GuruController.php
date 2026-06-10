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
            'id_users'    => 'required|integer|unique:guru,id_users',
            'nama_guru'   => 'required|string|max:60',
            'nip_guru'    => 'required|string|max:30',
            'mapel_guru'  => 'required|string|max:50',
            'jk_guru'     => 'required|in:laki-laki,perempuan',
            'alamat_guru' => 'required',
            'no_guru'     => 'required|max:30',
        ]);

        try {
            Guru::create([
                'id_users'    => $request->id_users,
                'nama_guru'   => $request->nama_guru,
                'nip_guru'    => $request->nip_guru,
                'mapel_guru'  => $request->mapel_guru,
                'jk_guru'     => $request->jk_guru,
                'alamat_guru' => $request->alamat_guru,
                'no_guru'     => $request->no_guru,
            ]);

            return response()->json([
                'message' => 'Guru berhasil ditambahkan'
            ], 201);

        } catch (\Exception $e) {
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
        ]);

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

            return response()->json(['message' => 'Guru berhasil diperbarui'], 200);
        } catch (\Exception $e) {
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

        try {
            $guru->delete();
            return response()->json(['message' => 'Guru berhasil dihapus'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus guru',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
