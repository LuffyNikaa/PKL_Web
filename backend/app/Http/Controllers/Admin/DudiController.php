<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dudi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DudiController extends Controller
{
    // =====================
    // GET /api/admin/dudi
    // =====================
    public function index()
    {
        $dudi = Dudi::all();

        return response()->json([
            'data' => $dudi
        ], 200);
    }

    // =====================
    // POST /api/admin/dudi
    // =====================
    public function store(Request $request)
    {
        $request->validate([
            'nama_dudi'      => 'required|string|max:100',
            'alamat_dudi'    => 'required|string',
            'kontak_dudi'    => 'required|string|max:50',
            'latitude_dudi'  => 'nullable|numeric',
            'longitude_dudi' => 'nullable|numeric',
        ]);

        DB::beginTransaction();
        try {
            $dudi = Dudi::create([
                'nama_dudi'      => $request->nama_dudi,
                'alamat_dudi'    => $request->alamat_dudi,
                'kontak_dudi'    => $request->kontak_dudi,
                'latitude_dudi'  => $request->latitude_dudi,
                'longitude_dudi' => $request->longitude_dudi,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'DUDI berhasil ditambahkan',
                'data'    => $dudi
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menambahkan DUDI',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // =====================
    // PUT /api/admin/dudi/{id}
    // =====================
    public function update(Request $request, $id)
    {
        $dudi = Dudi::find($id);
        if (!$dudi) {
            return response()->json([
                'message' => 'DUDI tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'nama_dudi'      => 'required|string|max:100',
            'alamat_dudi'    => 'required|string',
            'kontak_dudi'    => 'required|string|max:50',
            'latitude_dudi'  => 'nullable|numeric',
            'longitude_dudi' => 'nullable|numeric',
        ]);

        DB::beginTransaction();
        try {
            $dudi->update([
                'nama_dudi'      => $request->nama_dudi,
                'alamat_dudi'    => $request->alamat_dudi,
                'kontak_dudi'    => $request->kontak_dudi,
                'latitude_dudi'  => $request->latitude_dudi,
                'longitude_dudi' => $request->longitude_dudi,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'DUDI berhasil diperbarui'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal memperbarui DUDI',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // =====================
    // DELETE /api/admin/dudi/{id}
    // =====================
    public function destroy($id)
    {
        $dudi = Dudi::find($id);
        if (!$dudi) {
            return response()->json([
                'message' => 'DUDI tidak ditemukan'
            ], 404);
        }

        DB::beginTransaction();
        try {
            $dudi->delete();

            DB::commit();

            return response()->json([
                'message' => 'DUDI berhasil dihapus'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menghapus DUDI',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
