<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Jurusan;
use Illuminate\Http\Request;

class JurusanController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Jurusan::orderBy('id_jurusan', 'desc')->get()
        ]);
    }

        public function store(Request $request)
    {
        $request->validate([
            'nama_jurusan' => 'required|max:50'
        ]);

        Jurusan::create([
            'nama_jurusan' => $request->nama_jurusan
        ]);

        return response()->json([
            'message' => 'Jurusan berhasil ditambahkan'
        ]);
    }

    public function update(Request $request, int $id)
    {
        $jurusan = Jurusan::find($id);

        if (!$jurusan) {
            return response()->json([
                'message' => 'Jurusan tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'nama_jurusan' => 'required|max:50'
        ]);

        $jurusan->update([
            'nama_jurusan' => $request->nama_jurusan
        ]);

        return response()->json([
            'message' => 'Jurusan berhasil diperbarui'
        ]);
    }

    public function destroy(int $id)
    {
        $jurusan = Jurusan::find($id);

        if (!$jurusan) {
            return response()->json([
                'message' => 'Jurusan tidak ditemukan'
            ], 404);
        }

        $jurusan->delete();

        return response()->json([
            'message' => 'Jurusan berhasil dihapus'
        ]);
    }
}