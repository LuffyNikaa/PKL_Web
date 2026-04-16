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
        'id_siswa',
        'id_user',
        'id_dudi',
        'tanggal_jurnal_mingguan',
        'kegiatan_jurnal_mingguan',
        'dokumentasi_jurnal_mingguan',
    ];

    protected $casts = [
        'tanggal_jurnal_mingguan' => 'date',
    ];

    public function siswa() { return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa'); }
    public function user()  { return $this->belongsTo(Users::class, 'id_user', 'id_users'); }
    public function dudi()  { return $this->belongsTo(Dudi::class, 'id_dudi', 'id_dudi'); }
}