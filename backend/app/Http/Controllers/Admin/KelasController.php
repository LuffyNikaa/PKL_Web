<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use Illuminate\Http\Request;


class KelasController extends Controller
{
    public function index()
    {
        $kelas = Kelas::with('jurusan')->get();

        return response()->json([
            'data' => $kelas
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_jurusan' => 'required|exists:jurusan,id_jurusan',
            'tingkat_kelas' => 'required|max:10',
            'rombel' => 'required|max:20',
        ]);

        Kelas::create([
            'id_jurusan' => $request->id_jurusan,
            'tingkat_kelas' => $request->tingkat_kelas,
            'rombel' => $request->rombel,
        ]);

        return response()->json([
            'message' => 'Kelas berhasil ditambahkan'
        ]);
    }

    public function update(Request $request, int $id)
    {
        $kelas = Kelas::find($id);

        if (!$kelas) {
            return response()->json([
                'message' => 'Kelas tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'id_jurusan' => 'required|exists:jurusan,id_jurusan',
            'tingkat_kelas' => 'required|max:10',
            'rombel' => 'required|max:20',
        ]);

        $kelas->update([
            'id_jurusan' => $request->id_jurusan,
            'tingkat_kelas' => $request->tingkat_kelas,
            'rombel' => $request->rombel,
        ]);

        return response()->json([
            'message' => 'Kelas berhasil diperbarui'
        ]);
    }

    public function destroy(int $id)
    {
        $kelas = Kelas::find($id);

        if (!$kelas) {
            return response()->json([
                'message' => 'Kelas tidak ditemukan'
            ], 404);
        }

        $kelas->delete();

        return response()->json([
            'message' => 'Kelas berhasil dihapus'
        ]);
    }
}