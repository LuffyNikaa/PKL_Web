<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Penempatan extends Model
{
    protected $table = 'penempatan';
    protected $primaryKey = 'id_penempatan';
    public $timestamps = false;

    protected $fillable = [
        'id_siswa',
        'id_dudi',
        'id_guru',
        'id_periode',
    ];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'id_siswa');
    }

    public function dudi()
    {
        return $this->belongsTo(Dudi::class, 'id_dudi');
    }

    public function guru()
    {
        return $this->belongsTo(Guru::class, 'id_guru');
    }

    public function periode()
    {
        return $this->belongsTo(Periode::class, 'id_periode');
    }

    public function presensi()
    {
        return $this->hasMany(Presensi::class, 'id_penempatan');
    }

    public function jurnalHarian()
    {
        return $this->hasMany(JurnalHarian::class, 'id_penempatan');
    }

    public function jurnalMingguan()
    {
        return $this->hasMany(JurnalMingguan::class, 'id_penempatan');
    }

    public function monitoring()
    {
        return $this->hasMany(Monitoring::class, 'id_penempatan');
    }

    public function presentasi()
    {
        return $this->hasMany(Presentasi::class, 'id_penempatan');
    }
}