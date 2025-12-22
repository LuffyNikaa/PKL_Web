<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Dudi;
use Illuminate\Http\Request;

class DudiController extends Controller
{
    // GET /api/admin/dudi
    public function index()
    {
        return response()->json(Dudi::all());
    }

    // POST /api/admin/dudi
    public function store(Request $request)
    {
        $request->validate([
            'nama_dudi' => 'required|string|max:100',
            'alamat_dudi' => 'required|string',
            'kontak_dudi' => 'required|string|max:50',
            'latitude_dudi' => 'nullable|numeric',
            'longitude_dudi' => 'nullable|numeric',
        ]);

        $dudi = Dudi::create($request->all());

        return response()->json([
            'message' => 'DUDI berhasil ditambahkan',
            'data' => $dudi
        ], 201);
    }
}
