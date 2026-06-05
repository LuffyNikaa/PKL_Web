<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL, alter enum to include 'dudi'
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            // Adjust default and enum set as appropriate
            DB::statement("ALTER TABLE `users` MODIFY `role_users` ENUM('admin','guru','siswa','dudi') NOT NULL DEFAULT 'siswa'");
        } else {
            // For other DBs (sqlite/postgres), attempt safe strategy: add column new_role_users, copy, drop old, rename
            if (Schema::hasColumn('users', 'role_users')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('role_users_tmp', 50)->nullable();
                });

                // copy existing values
                DB::statement("UPDATE users SET role_users_tmp = role_users");

                Schema::table('users', function (Blueprint $table) {
                    $table->dropColumn('role_users');
                });

                Schema::table('users', function (Blueprint $table) {
                    $table->enum('role_users', ['admin','guru','siswa','dudi'])->default('siswa');
                });

                DB::statement("UPDATE users SET role_users = role_users_tmp");

                Schema::table('users', function (Blueprint $table) {
                    $table->dropColumn('role_users_tmp');
                });
            }
        }

        // Add foreign key if column exists and foreign key not present
        if (Schema::hasColumn('users', 'id_dudi') && Schema::hasTable('dudi')) {
            Schema::table('users', function (Blueprint $table) {
                // ensure index exists
                $table->unsignedBigInteger('id_dudi')->nullable()->change();
                $table->foreign('id_dudi')->references('id_dudi')->on('dudi')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            // Revert to original set without 'dudi' (admin,guru,siswa)
            DB::statement("ALTER TABLE `users` MODIFY `role_users` ENUM('admin','guru','siswa') NOT NULL DEFAULT 'siswa'");
        } else {
            if (Schema::hasColumn('users', 'role_users')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('role_users_tmp', 50)->nullable();
                });

                DB::statement("UPDATE users SET role_users_tmp = role_users");

                Schema::table('users', function (Blueprint $table) {
                    $table->dropColumn('role_users');
                });

                Schema::table('users', function (Blueprint $table) {
                    $table->enum('role_users', ['admin','guru','siswa'])->default('siswa');
                });

                DB::statement("UPDATE users SET role_users = role_users_tmp");

                Schema::table('users', function (Blueprint $table) {
                    $table->dropColumn('role_users_tmp');
                });
            }
        }

        // Drop foreign key if exists
        if (Schema::hasColumn('users', 'id_dudi')) {
            Schema::table('users', function (Blueprint $table) {
                $sm = Schema::getConnection()->getDoctrineSchemaManager();
                // attempt to drop foreign key if exists
                try {
                    $table->dropForeign(['id_dudi']);
                } catch (\Exception $e) {
                    // ignore if not exists
                }
            });
        }
    }
};
