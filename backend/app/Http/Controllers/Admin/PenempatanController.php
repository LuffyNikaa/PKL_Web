<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Penempatan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PenempatanController extends Controller
{
    // =========================
    // GET ALL
    // =========================
    public function index()
    {
        $penempatan = Penempatan::with([
            'siswa.user',
            'siswa.kelas.jurusan',
            'dudi',
            'guru',
            'periode'
        ])
        ->orderBy('id_penempatan', 'desc')
        ->get();

        return response()->json([
            'data' => $penempatan
        ], 200);
    }

    // =========================
    // STORE
    // =========================
    public function store(Request $request)
    {
        try {

            $validated = $request->validate([
                'id_siswa' => [
                    'required',
                    'exists:siswa,id_siswa',
                    Rule::unique('penempatan', 'id_siswa')
                ],

                'id_dudi' => 'required|exists:dudi,id_dudi',
                'id_guru' => 'required|exists:guru,id_guru',
                'id_periode' => 'required|exists:periode,id_periode',
            ], [
                'id_siswa.unique' => 'Siswa sudah memiliki penempatan'
            ]);

            $penempatan = Penempatan::create($validated);

            return response()->json([
                'message' => 'Penempatan berhasil ditambahkan',
                'data' => $penempatan
            ], 201);

        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Error',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    // =========================
    // DETAIL
    // =========================
    public function show(int $id)
    {
        $penempatan = Penempatan::with([
            'siswa.user',
            'siswa.kelas.jurusan',
            'dudi',
            'guru',
            'periode'
        ])->find($id);

        if (!$penempatan) {
            return response()->json([
                'message' => 'Penempatan tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'data' => $penempatan
        ], 200);
    }

    // =========================
    // UPDATE
    // =========================
    public function update(Request $request, int $id)
    {
        $penempatan = Penempatan::find($id);

        if (!$penempatan) {
            return response()->json([
                'message' => 'Penempatan tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'id_siswa' => [
                'required',
                'exists:siswa,id_siswa',
                Rule::unique('penempatan', 'id_siswa')
                    ->ignore($id, 'id_penempatan')
            ],

            'id_dudi'    => 'required|exists:dudi,id_dudi',
            'id_guru'    => 'required|exists:guru,id_guru',
            'id_periode' => 'required|exists:periode,id_periode',
        ], [
            'id_siswa.unique' => 'Siswa sudah memiliki penempatan'
        ]);

        $penempatan->update([
            'id_siswa'   => $request->id_siswa,
            'id_dudi'    => $request->id_dudi,
            'id_guru'    => $request->id_guru,
            'id_periode' => $request->id_periode,
        ]);

        return response()->json([
            'message' => 'Penempatan berhasil diperbarui'
        ], 200);
    }

    // =========================
    // DELETE
    // =========================
    public function destroy(int $id)
    {
        $penempatan = Penempatan::find($id);

        if (!$penempatan) {
            return response()->json([
                'message' => 'Penempatan tidak ditemukan'
            ], 404);
        }

        $penempatan->delete();

        return response()->json([
            'message' => 'Penempatan berhasil dihapus'
        ], 200);
    }
}