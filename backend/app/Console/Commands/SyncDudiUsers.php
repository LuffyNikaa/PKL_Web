<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Dudi;
use App\Models\Users;
use Illuminate\Support\Str;

class SyncDudiUsers extends Command
{
    protected $signature = 'dudi:sync-users {--create : Create missing user accounts for Dudi}';
    protected $description = 'Link Dudi entries to Users. Optionally create Users for Dudi without accounts.';

    public function handle()
    {
        $this->info('Scanning Dudi records...');

        $list = Dudi::all();
        $missing = $list->filter(fn($d) => empty($d->id_users));

        $this->info('Total Dudi: ' . $list->count());
        $this->info('Unlinked Dudi: ' . $missing->count());

        if ($missing->isEmpty()) {
            $this->info('Nothing to do.');
            return 0;
        }

        if (!$this->option('create')) {
            $this->table(['id_dudi','nama_dudi'], $missing->map(fn($d) => [$d->id_dudi, $d->nama_dudi])->toArray());
            $this->info('Run with --create to create user accounts for these Dudi.');
            return 0;
        }

        foreach ($missing as $dudi) {
            $baseEmail = Str::slug($dudi->nama_dudi ?: 'dudi') . '.' . $dudi->id_dudi . '@dudi.local';
            $email = $baseEmail;
            $i = 1;
            while (Users::where('email_users', $email)->exists()) {
                $email = Str::slug($dudi->nama_dudi ?: 'dudi') . '.' . $dudi->id_dudi . '+' . $i . '@dudi.local';
                $i++;
            }

            $password = Str::random(10);

            // Don't force a status value here; use DB default to avoid enum mismatch
            $user = Users::create([
                'nama_users' => $dudi->nama_dudi,
                'email_users' => $email,
                'password_users' => $password,
                'role_users' => 'dudi',
            ]);

            $dudi->update(['id_users' => $user->id_users]);

            $this->info("Created user {$user->id_users} for dudi {$dudi->id_dudi} ({$email}) with password: {$password}");
        }

        $this->info('Done. Please securely communicate the generated credentials to the DuDi accounts and consider forcing password reset on first login.');

        return 0;
    }
}
