<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Presentasi extends Model
{
    use HasFactory;
    protected $table      = 'presentasi';
    protected $primaryKey = 'id_presentasi';
    public $timestamps    = false;

    protected $fillable = [
        'id_penempatan',           // ✅ Ganti dengan id_penempatan
        'tanggal_presentasi',
        'jam_presentasi',
        'ruangan_presentasi',
        'status_presentasi',
    ];

    protected $casts = [
        'tanggal_presentasi' => 'date',
    ];

    // Relasi ke penempatan
    public function penempatan() 
    { 
        return $this->belongsTo(Penempatan::class, 'id_penempatan', 'id_penempatan'); 
    }
}