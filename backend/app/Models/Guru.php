<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Guru extends Model
{
    protected $table = 'guru';
    protected $primaryKey = 'id_guru';
    public $timestamps = false;

    protected $fillable = [
        'id_users',
        'nama_guru',
        'nip_guru',
        'mapel_guru',
        'jk_guru',
        'alamat_guru',
        'no_guru',
    ];

    // relasi ke user (1-1)
    public function user()
    {
        return $this->belongsTo(Users::class, 'id_users', 'id_users');
    }
}
