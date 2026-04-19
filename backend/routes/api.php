<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\GuruController;
use App\Http\Controllers\Admin\SiswaController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Admin\DudiController;
use App\Http\Controllers\API\Mobile\PresensiController;
use App\Http\Controllers\Admin\PresensiWebController;
use App\Http\Controllers\API\Mobile\JurnalHarianController;
use App\Http\Controllers\Admin\JurnalHarianWebController;
use App\Http\Controllers\API\Web\ProfileWebController;
use App\Http\Controllers\API\Mobile\JurnalMingguanController;
use App\Http\Controllers\Admin\JurnalMingguanWebController;
use App\Http\Controllers\Admin\DashboardController;

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
    // profile
    Route::get('/profile', [ProfileWebController::class, 'show']);
    Route::get('/profile', [ProfileWebController::class, 'show']);
    Route::put('/profile', [ProfileWebController::class, 'update']);

    // =====================
    // ADMIN & GURU
    // =====================

    Route::middleware('role:admin,guru')->group(function () {
        Route::post('/admin/siswa', [SiswaController::class, 'store']);
        Route::get('/admin/siswa', [SiswaController::class, 'index']);
        Route::put('/admin/siswa/{id}', [SiswaController::class, 'update']);
        Route::delete('/admin/siswa/{id}', [SiswaController::class, 'destroy']);
        Route::get('/admin/presensi', [PresensiWebController::class, 'index']);
        Route::get('/admin/dudi', [DudiController::class, 'index']);
        Route::get('/admin/jurnal-harian', [JurnalHarianWebController::class, 'index']);
        Route::get('/admin/jurnal-mingguan', [JurnalMingguanWebController::class, 'index']);
        Route::get('/admin/dashboard', [DashboardController::class, 'index']);
    });

    // =====================
    // ADMIN ONLY (CMS)
    // =====================
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/guru', [GuruController::class, 'index']);
        Route::post('/admin/guru', [GuruController::class, 'store']);
        Route::put('/admin/guru/{id}', [GuruController::class, 'update']);   
        Route::delete('/admin/guru/{id}', [GuruController::class, 'destroy']);

        Route::post('/admin/dudi', [DudiController::class, 'store']);
        Route::put('/admin/dudi/{id}', [DudiController::class, 'update']);
        Route::delete('/admin/dudi/{id}', [DudiController::class, 'destroy']);
    });

    // =====================
    // MOBILE - SISWA
    // =====================
    Route::prefix('mobile')->group(function () {
        Route::get('/siswa/profile', [SiswaController::class, 'profile']);
        Route::get('/absensi/status', [PresensiController::class, 'status']);   // cek status hari ini
        Route::post('/absensi', [PresensiController::class, 'store']);          // absen masuk
        Route::post('/absensi/pulang', [PresensiController::class, 'pulang']);  // absen pulang

        Route::get('/jurnal-harian',        [JurnalHarianController::class, 'index']);
        Route::post('/jurnal-harian',       [JurnalHarianController::class, 'store']);
        Route::put('/jurnal-harian/{id}',   [JurnalHarianController::class, 'update']);

        Route::get('/jurnal-mingguan',        [JurnalMingguanController::class, 'index']);
        Route::post('/jurnal-mingguan',       [JurnalMingguanController::class, 'store']);
        Route::put('/jurnal-mingguan/{id}',   [JurnalMingguanController::class, 'update']);
    });
});
