<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Periode extends Model
{
    protected $table = 'periode';
    protected $primaryKey = 'id_periode';
    public $timestamps = false;

    protected $fillable = [
        'nama_periode',
        'tanggal_mulai',
        'tanggal_selesai',
        'status_periode',
    ];

    // =========================
    // RELASI PENEMPATAN
    // =========================
    public function penempatan()
    {
        return $this->hasMany(
            Penempatan::class,
            'id_periode',
            'id_periode'
        );
    }
}