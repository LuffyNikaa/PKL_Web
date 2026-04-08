<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JurnalHarian extends Model
{
    use HasFactory;
    protected $table      = 'jurnal_harian';
    protected $primaryKey = 'id_jurnal_harian';
    public $timestamps    = false; // ✅ tabel tidak punya created_at & updated_at

    protected $fillable = [
        'id_siswa',
        'id_user',
        'id_dudi',
        'tanggal_jurnal_harian',
        'kegiatan_jurnal_harian',
    ];

    protected $casts = [
        'tanggal_jurnal_harian' => 'date',
    ];

    public function siswa() { return $this->belongsTo(Siswa::class, 'id_siswa', 'id_siswa'); }
    public function user()  { return $this->belongsTo(Users::class, 'id_user', 'id_users'); }
    public function dudi()  { return $this->belongsTo(Dudi::class, 'id_dudi', 'id_dudi'); }
}