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
        'tanggal_monitoring',
        'jam_monitoring',
        'lokasi_monitoring',
        'alasan_monitoring',
        'status_monitoring',
        'siswa_id_siswa',
        'siswa_id_user',
        'siswa_id_dudi',
        'guru_id_guru',
        'guru_id_users',
    ];

    protected $casts = ['tanggal_monitoring' => 'date'];

    public function siswa() { return $this->belongsTo(Siswa::class, 'siswa_id_siswa', 'id_siswa'); }
    public function guru()  { return $this->belongsTo(Guru::class, 'guru_id_guru', 'id_guru'); }
}