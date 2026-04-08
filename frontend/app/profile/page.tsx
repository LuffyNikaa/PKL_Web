"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { Button, Label, TextInput, Select, Textarea, Modal, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";
import Image from "next/image";

type ProfileData = {
  nama: string;
  email: string;
  role: string;
  nip?: string;
  mapel?: string;
  jk?: string;
  alamat?: string;
  no_hp?: string;
};

type User = { name: string; email: string };

function getDiceBearAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?backgroundColor=b6e3f4&seed=${encodeURIComponent(seed)}`;
}

function roleLabel(role: string) {
  switch (role) {
    case "admin": return "Administrator";
    case "guru":  return "Guru";
    default:      return role;
  }
}

function roleBadgeColor(role: string) {
  switch (role) {
    case "admin": return "bg-purple-100 text-purple-700";
    case "guru":  return "bg-blue-100 text-blue-700";
    default:      return "bg-gray-100 text-gray-600";
  }
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-inter mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800 font-inter bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 min-h-[38px]">
        {value || "-"}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser]         = useState<User | null>(null);
  const [profile, setProfile]   = useState<ProfileData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState<Partial<ProfileData>>({});

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/profile", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setProfile(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => {
    if (!profile) return;
    setForm({
      nama:   profile.nama,
      nip:    profile.nip,
      mapel:  profile.mapel,
      jk:     profile.jk,
      alamat: profile.alamat,
      no_hp:  profile.no_hp,
    });
    setShowEdit(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan");

      // Update localStorage nama jika berubah
      if (form.nama && user) {
        const updatedUser = { ...user, name: form.nama };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      await fetchProfile();
      setShowEdit(false);
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Profil Saya" userName={user.name} />

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400 text-sm font-inter">Memuat profil...</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">

              {/* ===== CARD AVATAR ===== */}
              <div className="bg-white rounded-xl p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-5">
                  <Image
                    src={getDiceBearAvatar(profile.email)}
                    alt="avatar"
                    width={90}
                    height={90}
                    className="rounded-full bg-blue-50 border-4 border-blue-100 flex-shrink-0"
                    unoptimized
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 font-inter">{profile.nama}</h2>
                    <p className="text-sm text-gray-500 font-inter mt-0.5">{profile.email}</p>
                    <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${roleBadgeColor(profile.role)}`}>
                      {roleLabel(profile.role)}
                    </span>
                  </div>
                </div>

                {/* Tombol Edit */}
                <button
                  onClick={openEdit}
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-inter"
                >
                  ✏️ Edit Profil
                </button>
              </div>

              {/* ===== ADMIN: hanya info dasar ===== */}
              {profile.role === "admin" && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 font-inter mb-4 pb-2 border-b border-gray-100">
                    Informasi Akun
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Nama Lengkap" value={profile.nama} />
                    <Field label="Email" value={profile.email} />
                    <Field label="Role" value={roleLabel(profile.role)} />
                  </div>
                </div>
              )}

              {/* ===== GURU: info akun + info guru ===== */}
              {profile.role === "guru" && (
                <>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 font-inter mb-4 pb-2 border-b border-gray-100">
                      Informasi Akun
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Nama Lengkap" value={profile.nama} />
                      <Field label="Email" value={profile.email} />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 font-inter mb-4 pb-2 border-b border-gray-100">
                      Informasi Guru
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="NIP" value={profile.nip} />
                      <Field label="Mata Pelajaran" value={profile.mapel} />
                      <Field label="Jenis Kelamin" value={profile.jk === "laki-laki" ? "Laki-laki" : "Perempuan"} />
                      <Field label="No. HP" value={profile.no_hp} />
                      <div className="col-span-2">
                        <Field label="Alamat" value={profile.alamat} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400 text-sm font-inter">Gagal memuat profil</p>
            </div>
          )}
        </div>
      </main>

      {/* ===== MODAL EDIT ===== */}
      <Modal dismissible show={showEdit} size="lg" onClose={() => setShowEdit(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          Edit Profil
        </ModalHeader>
        <ModalBody className="px-6 py-4">
          {profile?.role === "admin" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="nama">Nama Lengkap</Label>
                <TextInput
                  id="nama" name="nama"
                  value={form.nama ?? ""}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className="mt-1"
                />
              </div>
              {/* Email & password tidak bisa diedit */}
              <div>
                <Label>Email</Label>
                <TextInput value={profile.email} readOnly className="mt-1 bg-gray-50" />
                <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
              </div>
            </div>
          )}

          {profile?.role === "guru" && (
            <form className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nama">Nama Lengkap</Label>
                <TextInput id="nama" name="nama" value={form.nama ?? ""} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <TextInput value={profile.email} readOnly className="mt-1 bg-gray-50" />
                <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
              </div>
              <div>
                <Label htmlFor="nip">NIP</Label>
                <TextInput id="nip" name="nip" value={form.nip ?? ""} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="mapel">Mata Pelajaran</Label>
                <TextInput id="mapel" name="mapel" value={form.mapel ?? ""} onChange={handleChange} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="jk">Jenis Kelamin</Label>
                <Select id="jk" name="jk" value={form.jk ?? ""} onChange={handleChange} className="mt-1">
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="no_hp">No. HP</Label>
                <TextInput id="no_hp" name="no_hp" value={form.no_hp ?? ""} onChange={handleChange} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Textarea id="alamat" name="alamat" value={form.alamat ?? ""} onChange={handleChange} rows={3} className="mt-1" />
              </div>
            </form>
          )}
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <Button color="blue" onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button color="light" onClick={() => setShowEdit(false)}>Batal</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}