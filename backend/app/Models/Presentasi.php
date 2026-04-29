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
        'tanggal_presentasi',
        'jam_presentasi',
        'ruangan_presentasi',
        'status_presentasi',
        'siswa_id_siswa',
        'siswa_id_user',
        'siswa_id_dudi',
    ];

    protected $casts = ['tanggal_presentasi' => 'date'];

    public function siswa() { return $this->belongsTo(Siswa::class, 'siswa_id_siswa', 'id_siswa'); }
}