<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Users extends Model
{
    use HasApiTokens, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'id_users';
    public $timestamps = false;

    protected $fillable = [
        'nama_users',
        'email_users',
        'password_users',
        'role_users',
        'status_users'
    ];

    // 🔒 Sembunyikan password
    protected $hidden = [
        'password_users'
    ];

    // 🔐 Auto hash password (Laravel 10+)
    protected $casts = [
        'password_users' => 'hashed'
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATION
    |--------------------------------------------------------------------------
    */

    // 1 user punya 1 siswa
    public function siswa()
    {
        return $this->hasOne(Siswa::class, 'id_users', 'id_users');
    }

    // 1 user punya 1 guru
    public function guru()
    {
        return $this->hasOne(Guru::class, 'id_users', 'id_users');
    }

    // jika user adalah akun DuDi, hubungkan ke tabel dudi (1 user -> 1 dudi)
    public function dudi()
    {
        return $this->hasOne(Dudi::class, 'id_users', 'id_users');
    }
}