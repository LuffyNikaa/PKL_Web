<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JurnalMingguan extends Model
{
    use HasFactory;
    protected $table      = 'jurnal_mingguan';
    protected $primaryKey = 'id_jurnal_mingguan';
    public $timestamps    = false;

    protected $fillable = [
        'id_penempatan',                    // ✅ Ganti dengan id_penempatan
        'tanggal_jurnal_mingguan',
        'kegiatan_jurnal_mingguan',
        'dokumentasi_jurnal_mingguan',
    ];

    protected $casts = [
        'tanggal_jurnal_mingguan' => 'date',
    ];

    // Relasi ke penempatan
    public function penempatan() 
    { 
        return $this->belongsTo(Penempatan::class, 'id_penempatan', 'id_penempatan'); 
    }
    
    // Relasi ke siswa (via penempatan)
    public function siswa() 
    { 
        return $this->hasOneThrough(
            Siswa::class,
            Penempatan::class,
            'id_penempatan',
            'id_siswa',
            'id_penempatan',
            'id_siswa'
        );
    }
    
    // Relasi ke dudi (via penempatan)
    public function dudi() 
    { 
        return $this->hasOneThrough(
            Dudi::class,
            Penempatan::class,
            'id_penempatan',
            'id_dudi',
            'id_penempatan',
            'id_dudi'
        );
    }
}