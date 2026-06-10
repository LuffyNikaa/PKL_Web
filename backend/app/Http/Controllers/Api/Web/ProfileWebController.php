<?php
namespace App\Http\Controllers\API\Web;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Guru;
use App\Models\Siswa;
use App\Models\Kelas;
use App\Models\Jurusan;

class ProfileWebController extends Controller
{
    // GET /api/profile
    public function show(Request $request)
    {
        try {
            $user = $request->user();
            $base = [
                'nama'   => $user->nama_users,
                'email'  => $user->email_users,
                'role'   => $user->role_users,
                'status' => $user->status_users,
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
                $siswa = Siswa::where('id_users', $user->id_users)->first();
                if (!$siswa) {
                    return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);
                }

                $request->validate([
                    'nama'     => 'required|string|max:60',
                    'email'    => 'required|email|unique:users,email_users,' . $user->id_users . ',id_users',
                    'no_hp'    => 'nullable|string|max:15',
                    'alamat'   => 'nullable|string',
                    'nis'      => 'required|string|max:20|unique:siswa,nis_siswa,' . $siswa->id_siswa . ',id_siswa',
                    'id_kelas' => 'required|exists:kelas,id_kelas',
                    'password' => 'nullable|string|min:6',
                ], [
                    'nama.required' => 'Nama wajib diisi',
                    'email.required' => 'Email wajib diisi',
                    'email.email' => 'Format email tidak valid',
                    'email.unique' => 'Email sudah digunakan',
                    'nis.required' => 'NIS wajib diisi',
                    'nis.unique' => 'NIS sudah digunakan',
                    'id_kelas.required' => 'Kelas wajib diisi',
                    'id_kelas.exists' => 'Kelas tidak valid',
                    'password.min' => 'Password minimal 6 karakter',
                ]);

                $userFields = [
                    'nama_users' => $request->nama,
                    'email_users' => $request->email,
                ];
                if ($request->filled('password')) {
                    $userFields['password_users'] = \Illuminate\Support\Facades\Hash::make($request->password);
                }
                $user->update($userFields);

                $siswa->update([
                    'nama_siswa'   => $request->nama,
                    'no_siswa'     => $request->no_hp,
                    'alamat_siswa' => $request->alamat,
                    'nis_siswa'    => $request->nis,
                    'id_kelas'     => $request->id_kelas,
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