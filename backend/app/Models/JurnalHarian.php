<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JurnalHarian extends Model
{
    use HasFactory;
    protected $table      = 'jurnal_harian';
    protected $primaryKey = 'id_jurnal_harian';
    public $timestamps    = false; // tabel tidak punya created_at & updated_at

    protected $fillable = [
        'id_penempatan',              // ✅ Ganti dengan id_penempatan
        'tanggal_jurnal_harian',
        'kegiatan_jurnal_harian',
    ];

    protected $casts = [
        'tanggal_jurnal_harian' => 'date',
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