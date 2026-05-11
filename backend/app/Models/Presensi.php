<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Presensi extends Model
{
    use HasFactory;
    protected $table      = 'absensi';
    protected $primaryKey = 'id_absensi';
    public $timestamps = false; // karena pakai created_at/updated_at manual

    protected $fillable = [
        'id_penempatan',
        'tanggal_absensi', 'waktu_absensi', 'waktu_pulang',
        'latitude_absensi', 'longitude_absensi',
        'status_absensi', 'alasan_absensi', 'foto_surat',
    ];

    protected $casts = [
        'tanggal_absensi' => 'date',
    ];

    // Relasi ke penempatan
    public function penempatan() 
    { 
        return $this->belongsTo(Penempatan::class, 'id_penempatan', 'id_penempatan'); 
    }
}
