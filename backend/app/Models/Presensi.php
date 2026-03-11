<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Presensi extends Model
{
    use HasFactory;
    protected $table      = 'absensi';
    protected $primaryKey = 'id_absensi';

    protected $fillable = [
        'id_siswa', 'id_user', 'id_dudi',
        'tanggal_absensi', 'waktu_absensi', 'waktu_pulang',
        'latitude_absensi', 'longitude_absensi',
        'status_absensi', 'alasan_absensi', 'foto_surat',
    ];

    protected $casts = ['tanggal_absensi' => 'date'];

    public function siswa() { return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa'); }
    public function user()  { return $this->belongsTo(Users::class, 'id_user', 'id_users'); }
    public function dudi()  { return $this->belongsTo(Dudi::class, 'id_dudi', 'id_dudi'); }
}