<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Siswa extends Model
{
    protected $table = 'siswa';
    protected $primaryKey = 'id_siswa';
    public $timestamps = false;

    protected $fillable = [
        'id_users',
        'id_kelas',
        'nama_siswa',
        'jk_siswa',
        'nis_siswa',
        'alamat_siswa',
        'no_siswa',
    ];

    // =========================
    // RELASI USER
    // =========================
    public function user()
    {
        return $this->belongsTo(
            Users::class,
            'id_users',
            'id_users'
        );
    }

    // =========================
    // RELASI KELAS
    // =========================
    public function kelas()
    {
        return $this->belongsTo(
            Kelas::class,
            'id_kelas',
            'id_kelas'
        );
    }

    // =========================
    // RELASI PENEMPATAN
    // =========================
    public function penempatan()
    {
        return $this->hasMany(
            Penempatan::class,
            'id_siswa',
            'id_siswa'
        );
    }
}