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
        'nama_dudi',
        'alamat_dudi',
        'kontak_dudi',
        'latitude_dudi',
        'longitude_dudi',
    ];

    // relasi ke siswa
    public function siswa()
    {
        return $this->hasOne(Siswa::class, 'id_dudi', 'id_dudi');
    }
}
