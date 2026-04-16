<?php
namespace App\Http\Controllers\API\Web;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Guru;
use App\Models\Siswa;

class ProfileWebController extends Controller
{
    // GET /api/profile
    public function show(Request $request)
    {
        try {
            $user = $request->user();
            $base = [
                'nama'  => $user->nama_users,
                'email' => $user->email_users,
                'role'  => $user->role_users,
            ];

            if ($user->role_users === 'guru') {
                $guru = Guru::where('id_users', $user->id_users)->first();
                if ($guru) {
                    $base = array_merge($base, [
                        'nip'    => $guru->nip_guru,
                        'mapel'  => $guru->mapel_guru,
                        'jk'     => $guru->jk_guru,
                        'alamat' => $guru->alamat_guru,
                        'no_hp'  => $guru->no_guru,
                    ]);
                }
            }

            return response()->json(['data' => $base]);

        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    // PUT /api/profile
    public function update(Request $request)
    {
        try {
            $user = $request->user();

            // ===== ADMIN =====
            if ($user->role_users === 'admin') {
                $request->validate([
                    'nama' => 'required|string|max:60',
                ]);

                $user->update(['nama_users' => $request->nama]);

                return response()->json(['message' => 'Profil berhasil diperbarui']);
            }

            // ===== GURU =====
            if ($user->role_users === 'guru') {
                $request->validate([
                    'nama'   => 'required|string|max:60',
                    'nip'    => 'required|string|max:30',
                    'mapel'  => 'required|string|max:50',
                    'jk'     => 'required|in:laki-laki,perempuan',
                    'alamat' => 'required|string',
                    'no_hp'  => 'required|string|max:15',
                ]);

                $user->update(['nama_users' => $request->nama]);

                Guru::where('id_users', $user->id_users)->update([
                    'nama_guru'   => $request->nama,
                    'nip_guru'    => $request->nip,
                    'mapel_guru'  => $request->mapel,
                    'jk_guru'     => $request->jk,
                    'alamat_guru' => $request->alamat,
                    'no_guru'     => $request->no_hp,
                ]);

                return response()->json(['message' => 'Profil berhasil diperbarui']);
            }

            // ===== SISWA =====
            if ($user->role_users === 'siswa') {
                $request->validate([
                    'nama'   => 'required|string|max:60',
                    'no_hp'  => 'nullable|string|max:15',
                    'alamat' => 'nullable|string',
                ]);

                $user->update(['nama_users' => $request->nama]);

                Siswa::where('id_user', $user->id_users)->update([
                    'nama_siswa'   => $request->nama,
                    'no_siswa'     => $request->no_hp,
                    'alamat_siswa' => $request->alamat,
                ]);

                return response()->json(['message' => 'Profil berhasil diperbarui']);
            }

            return response()->json(['message' => 'Role tidak dikenali'], 422);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}