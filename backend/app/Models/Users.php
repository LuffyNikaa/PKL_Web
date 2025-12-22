<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
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
    ];

    protected $hidden = [
        'password_users',
    ];

    /**
     * PENTING: override kolom password
     */
    public function getAuthPassword()
    {
        return $this->password_users;
    }

    /**
     * PENTING: override kolom email untuk Auth::attempt
     */
    public function getAuthIdentifierName()
    {
        return 'email_users';
    }
}
