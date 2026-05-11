<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Monitoring extends Model
{
    use HasFactory;
    protected $table      = 'monitoring';
    protected $primaryKey = 'id_monitoring';
    public $timestamps    = false;

    protected $fillable = [
        'id_penempatan',           // ✅ FK ke penempatan
        'tanggal_monitoring',
        'jam_monitoring',
        'lokasi_monitoring',
        'alasan_monitoring',
        'status_monitoring',
    ];

    protected $casts = [
        'tanggal_monitoring' => 'date',
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
            'id_penempatan',  // Foreign key di penempatan (yang nyambung ke monitoring)
            'id_siswa',       // Foreign key di siswa (yang nyambung ke penempatan)
            'id_penempatan',  // Local key di monitoring
            'id_siswa'        // Local key di penempatan
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