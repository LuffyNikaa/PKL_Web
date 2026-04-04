"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import {
  Modal, Button, Label, TextInput, Select, Textarea,
  ModalHeader, ModalBody, ModalFooter,
  Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow,
} from "flowbite-react";

type Dudi = {
  id_dudi: number;
  nama_dudi: string;
};

type Siswa = {
  id_siswa: number;
  id_user: number;
  id_dudi: number;
  nama_siswa: string;
  jk_siwa: string;
  jurusan_siswa: string;
  kelas_siswa: string;
  nis_siswa: string;
  alamat_siswa: string;
  no_siswa: string;
  dudi?: Dudi;
};

type User = { name: string; email: string };

const DATA_PER_PAGE = 10;

const emptyForm = {
  nama_siswa: "", email: "", password: "",
  jk_siwa: "", jurusan_siswa: "", kelas_siswa: "",
  nis_siswa: "", alamat_siswa: "", no_siswa: "", id_dudi: "",
};

export default function DataSiswaPage() {
  const [page, setPage]                     = useState(1);
  const [user, setUser]                     = useState<User | null>(null);
  const [siswaList, setSiswaList]           = useState<Siswa[]>([]);
  const [dudiList, setDudiList]             = useState<Dudi[]>([]);
  const [selectedSiswa, setSelectedSiswa]   = useState<Siswa | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [isEditMode, setIsEditMode]         = useState(false);
  const [form, setForm]                     = useState(emptyForm);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const fetchSiswa = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/admin/siswa", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setSiswaList(json.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchDudi = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/admin/dudi", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setDudiList(json.data?.data || json.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSiswa(); fetchDudi(); }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSimpan = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/siswa", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menambahkan siswa");
      fetchSiswa();
      setShowModal(false);
      setForm(emptyForm);
    } catch (err: any) { alert(err.message); }
  };

  const handleEditSiswa = () => {
    if (selectedSiswa) {
      setForm({
        ...emptyForm,
        nama_siswa:    selectedSiswa.nama_siswa,
        jk_siwa:       selectedSiswa.jk_siwa,
        jurusan_siswa: selectedSiswa.jurusan_siswa,
        kelas_siswa:   selectedSiswa.kelas_siswa,
        nis_siswa:     selectedSiswa.nis_siswa,
        alamat_siswa:  selectedSiswa.alamat_siswa,
        no_siswa:      selectedSiswa.no_siswa,
        id_dudi:       selectedSiswa.id_dudi.toString(),
      });
      setIsEditMode(true);
    }
  };

  const handleDeleteSiswa = async () => {
    if (!selectedSiswa) return;
    if (!confirm(`Hapus siswa ${selectedSiswa.nama_siswa}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/siswa/${selectedSiswa.id_siswa}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      fetchSiswa();
      setShowDetailModal(false);
      setSelectedSiswa(null);
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdateSiswa = async () => {
    if (!selectedSiswa) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/siswa/${selectedSiswa.id_siswa}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nama_siswa: form.nama_siswa, jk_siwa: form.jk_siwa,
          jurusan_siswa: form.jurusan_siswa, kelas_siswa: form.kelas_siswa,
          alamat_siswa: form.alamat_siswa, no_siswa: form.no_siswa,
          id_dudi: form.id_dudi,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      fetchSiswa();
      setShowDetailModal(false);
      setSelectedSiswa(null);
      setIsEditMode(false);
    } catch (err: any) { alert(err.message); }
  };

  const totalPages  = Math.ceil(siswaList.length / DATA_PER_PAGE);
  const start       = (page - 1) * DATA_PER_PAGE;
  const currentData = siswaList.slice(start, start + DATA_PER_PAGE);
  const pages       = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Data Siswa" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">Daftar Data Siswa</h1>

            <button
              onClick={() => { setForm(emptyForm); setShowModal(true); }}
              className="mb-4 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-inter w-fit"
            >
              Tambah <span className="text-lg">+</span>
            </button>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable className="text-sm font-inter">
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Nama</TableHeadCell>
                    <TableHeadCell>NIS</TableHeadCell>
                    <TableHeadCell>Kelas</TableHeadCell>
                    <TableHeadCell>Jurusan</TableHeadCell>
                    <TableHeadCell>Tempat PKL</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-8">Tidak ada data siswa</TableCell>
                    </TableRow>
                  ) : currentData.map((siswa, index) => (
                    <TableRow key={siswa.id_siswa} className="bg-white">
                      <TableCell>{start + index + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{siswa.nama_siswa}</TableCell>
                      <TableCell>{siswa.nis_siswa}</TableCell>
                      <TableCell>{siswa.kelas_siswa}</TableCell>
                      <TableCell>{siswa.jurusan_siswa}</TableCell>
                      <TableCell>{siswa.dudi?.nama_dudi ?? "-"}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => { setSelectedSiswa(siswa); setIsEditMode(false); setForm(emptyForm); setShowDetailModal(true); }}
                          className="text-blue-500 hover:text-blue-700 font-medium text-sm"
                        >
                          Detail
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 mt-6">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">«</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">‹</button>
                {pages.map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded ${page === p ? "bg-blue-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}>{p}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">»</button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===== MODAL TAMBAH SISWA ===== */}
      <Modal dismissible show={showModal} size="4xl" onClose={() => setShowModal(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          Tambah Data Siswa
        </ModalHeader>
        <ModalBody className="px-6 py-4">
          <form className="grid grid-cols-2 gap-4">
            {/* Kolom kiri */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="nama_siswa">Nama Siswa</Label>
                <TextInput id="nama_siswa" name="nama_siswa" value={form.nama_siswa} onChange={handleFormChange} placeholder="Masukkan nama siswa" required />
              </div>
              <div>
                <Label htmlFor="nis_siswa">NIS</Label>
                <TextInput id="nis_siswa" name="nis_siswa" value={form.nis_siswa} onChange={handleFormChange} placeholder="Masukkan NIS" required />
              </div>
              <div>
                <Label htmlFor="jk_siwa">Jenis Kelamin</Label>
                <Select id="jk_siwa" name="jk_siwa" value={form.jk_siwa} onChange={handleFormChange} required>
                  <option value="">Pilih jenis kelamin</option>
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="jurusan_siswa">Jurusan</Label>
                <TextInput id="jurusan_siswa" name="jurusan_siswa" value={form.jurusan_siswa} onChange={handleFormChange} placeholder="Masukkan jurusan" required />
              </div>
              <div>
                <Label htmlFor="kelas_siswa">Kelas</Label>
                <TextInput id="kelas_siswa" name="kelas_siswa" value={form.kelas_siswa} onChange={handleFormChange} placeholder="Contoh: XII RPL 1" required />
              </div>
            </div>

            {/* Kolom kanan */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Login</Label>
                <TextInput id="email" name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="Masukkan email login" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <TextInput id="password" name="password" type="password" value={form.password} onChange={handleFormChange} placeholder="Masukkan password" required />
              </div>
              <div>
                <Label htmlFor="no_siswa">Nomor HP</Label>
                <TextInput id="no_siswa" name="no_siswa" value={form.no_siswa} onChange={handleFormChange} placeholder="Masukkan nomor HP" required />
              </div>
              <div>
                <Label htmlFor="alamat_siswa">Alamat</Label>
                <Textarea id="alamat_siswa" name="alamat_siswa" value={form.alamat_siswa} onChange={handleFormChange} placeholder="Masukkan alamat" rows={3} required />
              </div>
              <div>
                <Label htmlFor="id_dudi">Tempat PKL (DUDI)</Label>
                <Select id="id_dudi" name="id_dudi" value={form.id_dudi} onChange={handleFormChange} required>
                  <option value="">Pilih DUDI</option>
                  {dudiList.map((dudi) => (
                    <option key={dudi.id_dudi} value={dudi.id_dudi}>{dudi.nama_dudi}</option>
                  ))}
                </Select>
              </div>
            </div>
          </form>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <Button color="blue" onClick={handleSimpan}>Simpan</Button>
          <Button color="red" onClick={() => setShowModal(false)}>Batal</Button>
        </ModalFooter>
      </Modal>

      {/* ===== MODAL DETAIL / EDIT SISWA ===== */}
      <Modal dismissible show={showDetailModal} size="4xl" onClose={() => { setShowDetailModal(false); setIsEditMode(false); }}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          {isEditMode ? "Edit Data Siswa" : "Detail Data Siswa"}
        </ModalHeader>
        <ModalBody className="px-6 py-4">
          {selectedSiswa && (
            <form className="grid grid-cols-2 gap-4">
              {/* Kolom kiri */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="d_nama">Nama Siswa</Label>
                  <TextInput
                    id="d_nama" name="nama_siswa"
                    value={isEditMode ? form.nama_siswa : selectedSiswa.nama_siswa}
                    onChange={handleFormChange} readOnly={!isEditMode}
                  />
                </div>
                <div>
                  <Label htmlFor="d_nis">NIS</Label>
                  <TextInput
                    id="d_nis" name="nis_siswa"
                    value={selectedSiswa.nis_siswa}
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="d_jk">Jenis Kelamin</Label>
                  <Select
                    id="d_jk" name="jk_siwa"
                    value={isEditMode ? form.jk_siwa : selectedSiswa.jk_siwa}
                    onChange={handleFormChange} disabled={!isEditMode}
                  >
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="d_jurusan">Jurusan</Label>
                  <TextInput
                    id="d_jurusan" name="jurusan_siswa"
                    value={isEditMode ? form.jurusan_siswa : selectedSiswa.jurusan_siswa}
                    onChange={handleFormChange} readOnly={!isEditMode}
                  />
                </div>
                <div>
                  <Label htmlFor="d_kelas">Kelas</Label>
                  <TextInput
                    id="d_kelas" name="kelas_siswa"
                    value={isEditMode ? form.kelas_siswa : selectedSiswa.kelas_siswa}
                    onChange={handleFormChange} readOnly={!isEditMode}
                  />
                </div>
              </div>

              {/* Kolom kanan */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="d_no">Nomor HP</Label>
                  <TextInput
                    id="d_no" name="no_siswa"
                    value={isEditMode ? form.no_siswa : selectedSiswa.no_siswa}
                    onChange={handleFormChange} readOnly={!isEditMode}
                  />
                </div>
                <div>
                  <Label htmlFor="d_alamat">Alamat</Label>
                  <Textarea
                    id="d_alamat" name="alamat_siswa"
                    value={isEditMode ? form.alamat_siswa : selectedSiswa.alamat_siswa}
                    onChange={handleFormChange} readOnly={!isEditMode}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="d_dudi">Tempat PKL (DUDI)</Label>
                  <Select
                    id="d_dudi" name="id_dudi"
                    value={isEditMode ? form.id_dudi : selectedSiswa.id_dudi.toString()}
                    onChange={handleFormChange} disabled={!isEditMode}
                  >
                    {dudiList.map((dudi) => (
                      <option key={dudi.id_dudi} value={dudi.id_dudi}>{dudi.nama_dudi}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </form>
          )}
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          {!isEditMode ? (
            <>
              <Button color="blue" onClick={handleEditSiswa}>Edit</Button>
              <Button color="red" onClick={handleDeleteSiswa}>Hapus</Button>
            </>
          ) : (
            <>
              <Button color="blue" onClick={handleUpdateSiswa}>Simpan</Button>
              <Button color="red" onClick={() => { setIsEditMode(false); setForm(emptyForm); }}>Batal</Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
}