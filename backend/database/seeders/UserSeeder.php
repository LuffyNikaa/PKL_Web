<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Users;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        // Nonaktifkan timestamps sementara
        Users::withoutTimestamps(function () {
            Users::create([
                'nama_users' => 'Administrator',
                'email_users' => 'admin@sekolah.com',
                'password_users' => Hash::make('admin123'),
                'role_users' => 'admin'
            ]);
        });
    }
}
