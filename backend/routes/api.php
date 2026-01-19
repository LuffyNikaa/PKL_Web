<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\GuruController;
use App\Http\Controllers\Admin\SiswaController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Admin\DudiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// =====================
// AUTH (PUBLIC)
// =====================
Route::post('/login/web', [LoginController::class, 'loginWeb']);
Route::post('/login/mobile', [LoginController::class, 'loginMobile']);

// =====================
// MOBILE (PUBLIC)
// =====================
Route::get('/mobile/dudi', function () {
    return \App\Models\Dudi::select('id_dudi', 'nama_dudi')->get();
});

// =====================
// PROTECTED (LOGIN)
// =====================
Route::middleware('auth:sanctum')->group(function () {

    // user login info
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // logout
    Route::post('/logout', [LoginController::class, 'logout']);

    // =====================
    // ADMIN & GURU
    // =====================

    Route::middleware('role:admin,guru')->group(function () {
        Route::post('/admin/siswa', [SiswaController::class, 'store']);
    });

    // =====================
    // ADMIN ONLY (CMS)
    // =====================
    Route::middleware('role:admin')->group(function () {
        Route::post('/admin/guru', [GuruController::class, 'store']);

        Route::get('/admin/dudi', [DudiController::class, 'index']);
        Route::post('/admin/dudi', [DudiController::class, 'store']);
    });
});
