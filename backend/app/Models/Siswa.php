<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Siswa extends Model
{
    protected $table = 'siswa';
    protected $primaryKey = 'id_siswa';
    public $timestamps = false;

    protected $fillable = [
        'id_user',
        'id_dudi',
        'nama_siswa',
        'jk_siwa',
        'jurusan_siswa',
        'kelas_siswa',
        'nis_siswa',
        'alamat_siswa',
        'no_siswa'
    ];

    public function user()
    {
        return $this->belongsTo(Users::class, 'id_user', 'id_users');
    }

    public function dudi()
    {
        return $this->belongsTo(Dudi::class, 'id_dudi', 'id_dudi');
    }
}
