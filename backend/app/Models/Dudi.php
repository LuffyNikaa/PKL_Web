<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dudi extends Model
{
    protected $table = 'dudi';
    protected $primaryKey = 'id_dudi';
    public $timestamps = false;

    protected $fillable = [
        'id_users',
        'nama_dudi',
        'alamat_dudi',
        'kontak_dudi',
        'latitude_dudi',
        'longitude_dudi',
    ];

    protected $casts = [
        'latitude_dudi' => 'decimal:8',
        'longitude_dudi' => 'decimal:8',
    ];

    // hubungkan ke user jika akun DuDi terdaftar
    public function user()
    {
        return $this->belongsTo(Users::class, 'id_users', 'id_users');
    }

    // relasi ke siswa
    public function siswa()
    {
        return $this->hasOne(Siswa::class, 'id_dudi', 'id_dudi');
    }
}
