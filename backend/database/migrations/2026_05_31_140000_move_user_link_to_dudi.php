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
        // If users.id_dudi exists and dudi.id_users not present, move link
        if (Schema::hasColumn('users', 'id_dudi') && !Schema::hasColumn('dudi', 'id_users')) {
            Schema::table('dudi', function (Blueprint $table) {
                $table->unsignedBigInteger('id_users')->nullable()->after('id_dudi');
            });

            // copy mapping from users -> dudi
            DB::statement("UPDATE dudi d JOIN users u ON u.id_dudi = d.id_dudi SET d.id_users = u.id_users");

            // add FK
            Schema::table('dudi', function (Blueprint $table) {
                $table->foreign('id_users')->references('id_users')->on('users')->nullOnDelete();
            });

            // drop column from users
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'id_dudi')) {
                    $table->dropColumn('id_dudi');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('dudi', 'id_users')) {
            // recreate users.id_dudi
            if (!Schema::hasColumn('users', 'id_dudi')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->unsignedBigInteger('id_dudi')->nullable()->after('id_users');
                });

                // copy back
                DB::statement("UPDATE users u JOIN dudi d ON d.id_users = u.id_users SET u.id_dudi = d.id_dudi");
            }

            // drop FK then column from dudi
            Schema::table('dudi', function (Blueprint $table) {
                try {
                    $table->dropForeign(['id_users']);
                } catch (\Exception $e) {
                    // ignore
                }
                $table->dropColumn('id_users');
            });
        }
    }
};
