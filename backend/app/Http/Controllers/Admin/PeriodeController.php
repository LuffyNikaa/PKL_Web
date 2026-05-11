<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Periode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PeriodeController extends Controller
{
    // =========================
    // GET /api/admin/periode
    // =========================
    public function index()
    {
        $periode = Periode::orderBy('id_periode', 'desc')->get();

        return response()->json([
            'data' => $periode
        ], 200);
    }

    // =========================
    // POST /api/admin/periode
    // =========================
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_periode'    => 'required|string|max:30',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'status_periode'  => 'required|in:aktif,selesai'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {

            // hanya 1 periode aktif
            if ($request->status_periode === 'aktif') {

                Periode::where('status_periode', 'aktif')
                    ->update([
                        'status_periode' => 'selesai'
                    ]);
            }

            $periode = Periode::create([
                'nama_periode'    => $request->nama_periode,
                'tanggal_mulai'   => $request->tanggal_mulai,
                'tanggal_selesai' => $request->tanggal_selesai,
                'status_periode'  => $request->status_periode,
            ]);

            return response()->json([
                'message' => 'Periode berhasil ditambahkan',
                'data'    => $periode
            ], 201);

        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Gagal menambahkan periode',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // =========================
    // PUT /api/admin/periode/{id}
    // =========================
    public function update(Request $request, int $id)
    {
        $periode = Periode::find($id);

        if (!$periode) {
            return response()->json([
                'message' => 'Periode tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_periode'    => 'required|string|max:30',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'status_periode'  => 'required|in:aktif,selesai'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        try {

            // hanya 1 periode aktif
            if ($request->status_periode === 'aktif') {

                Periode::where('status_periode', 'aktif')
                    ->where('id_periode', '!=', $id)
                    ->update([
                        'status_periode' => 'selesai'
                    ]);
            }

            $periode->update([
                'nama_periode'    => $request->nama_periode,
                'tanggal_mulai'   => $request->tanggal_mulai,
                'tanggal_selesai' => $request->tanggal_selesai,
                'status_periode'  => $request->status_periode,
            ]);

            return response()->json([
                'message' => 'Periode berhasil diperbarui',
                'data'    => $periode
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Gagal memperbarui periode',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // =========================
    // DELETE /api/admin/periode/{id}
    // =========================
    public function destroy(int $id)
    {
        $periode = Periode::find($id);

        if (!$periode) {
            return response()->json([
                'message' => 'Periode tidak ditemukan'
            ], 404);
        }

        try {

            // cek relasi penempatan
            if ($periode->penempatan()->count() > 0) {

                return response()->json([
                    'message' => 'Periode tidak dapat dihapus karena sudah digunakan pada data penempatan'
                ], 422);
            }

            $periode->delete();

            return response()->json([
                'message' => 'Periode berhasil dihapus'
            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'message' => 'Gagal menghapus periode',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}