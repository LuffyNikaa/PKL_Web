"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { Modal, Button, Label, TextInput, Textarea, Select, ModalHeader, ModalBody, ModalFooter, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, } from "flowbite-react";
import Toast, { ToastItem } from "../components/Toast";
import SearchFilter from "../components/SearchFilter";

type Guru = {
  id_guru: number;
  id_users: number;
  nama_guru: string;
  nip_guru: string;
  mapel_guru: string;
  jk_guru: string;
  alamat_guru: string;
  no_guru: string;
  
  user?: {
    email_users: string;
    status_users: string;
  };
};

type User = {
  name: string;
  email: string;
  status_users: string;
};

const DATA_PER_PAGE = 10;

export default function DataGuruPage() {
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [selectedGuru, setSelectedGuru] = useState<Guru | null>(null);
const [showDetailModal, setShowDetailModal] = useState(false);
const [isEditMode, setIsEditMode] = useState(false)
const [showPassword, setShowPassword] = useState(false)
const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  // modal state
  const [showModal, setShowModal] = useState(false);

  // form state
  const [form, setForm] = useState({
    nama_guru: "",
    nip_guru: "",
    mapel_guru: "",
    jk_guru: "",
    alamat_guru: "",
    no_guru: "",
    email_users: "",
    password: "",
    status_users: "aktif",
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = (type: ToastItem['type'], message: string, duration = 3500) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const t: ToastItem = { id, type, message, duration };
    setToasts((s) => [...s, t]);
  };

  const removeToast = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const resetForm = () => {
    setForm({
      nama_guru: "",
      nip_guru: "",
      mapel_guru: "",
      jk_guru: "",
      alamat_guru: "",
      no_guru: "",
      email_users: "",
      password: "",
      status_users: "aktif",
    });
  };

  const openTambahModal = () => {
    resetForm();
    setShowModal(true);
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const fetchGuru = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:8000/api/admin/guru", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      const guruArray = json.data?.data || json.data || [];
      setGurus(guruArray);
    } catch (error) {
      console.error("Fetch guru error:", error);
      pushToast('error', 'Gagal memuat data guru');
    }
  };

  useEffect(() => {
    fetchGuru();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<any>) => {
  const { name, value } = e.target;
  // Hanya izinkan angka untuk no_guru dan nip_guru
  if (name === "no_guru" || name === "nip_guru") {
    const numericOnly = value.replace(/[^0-9]/g, "");
    setForm((prev) => ({ ...prev, [name]: numericOnly }));
    return;
  }
  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};


  const handleSimpan = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/guru", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menambahkan guru");

      // refresh tabel
      fetchGuru();
      setShowModal(false);

      pushToast('success', 'Guru berhasil ditambahkan');

      // reset form
      resetForm();

    } catch (err: any) {
      console.error(err);
      pushToast('error', err.message || 'Gagal menambahkan guru');
    }
  };

  // Fungsi handle edit / hapus
const handleEditGuru = (e?: React.MouseEvent) => {
  if (e) e.preventDefault();
  if (selectedGuru) {
    setForm({
      nama_guru: selectedGuru.nama_guru,
      nip_guru: selectedGuru.nip_guru,
      mapel_guru: selectedGuru.mapel_guru,
      jk_guru: selectedGuru.jk_guru,
      alamat_guru: selectedGuru.alamat_guru,
      no_guru: selectedGuru.no_guru,
      email_users: selectedGuru.user?.email_users || "",
      password: "",
      status_users: selectedGuru.user?.status_users || "aktif",
    });
    setIsEditMode(true);
  }
};

const handleDeleteGuru = async () => {
  if (!selectedGuru) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8000/api/admin/guru/${selectedGuru.id_guru}`, {
      method: "DELETE",
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      },
    });

    const json = await res.json();

    if (!res.ok) throw new Error(json.message || "Gagal menghapus guru");

    fetchGuru();
    setShowConfirmDelete(false);
    setShowDetailModal(false);
    setSelectedGuru(null);
    pushToast('success', 'Guru berhasil dihapus');
  } catch (err: any) {
    console.error(err);
    pushToast('error', err.message || String(err));
  }
};

// Update handleSimpan untuk edit
const handleUpdateGuru = async (e?: React.FormEvent) => {
  if (e) {
    e.preventDefault();
  }
  if (!selectedGuru) {
    pushToast('error', 'Guru tidak terpilih');
    return;
  }

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8000/api/admin/guru/${selectedGuru.id_guru}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Gagal memperbarui guru");

    fetchGuru();
    setShowDetailModal(false);
    setSelectedGuru(null);
    setIsEditMode(false);
    pushToast('success', 'Perubahan guru berhasil disimpan');
  } catch (err) {
    console.error(err);
    pushToast('error', String(err));
  }
};

  // apply search and filters
  const normalizedSearch = search.trim().toLowerCase();
  const filteredData = gurus.filter((g) => {
    // search by name, mapel, or nip
    const matchSearch = !normalizedSearch || [g.nama_guru, g.mapel_guru, g.nip_guru].some((v) => (v || "").toLowerCase().includes(normalizedSearch));
    const matchStatus = filterStatus === "all" || (g.user?.status_users === filterStatus);
    return matchSearch && matchStatus;
  });

  const data = filteredData;
  const totalPages = Math.ceil(data.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = data.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Data Guru" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">
              Daftar Data Guru
            </h1>

            <button
              onClick={openTambahModal}
              className="mb-4 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-inter w-fit"
            >
              Tambah <span className="text-lg">+</span>
            </button>

            {/* Search & Filter */}
            <div className="mb-4">
            <SearchFilter
              search={search}
              onSearchChange={setSearch}
              filter={filterStatus}
              onFilterChange={setFilterStatus}
              placeholder="Cari"
              filterOptions={[
                { value: "all", label: "Semua status" },
                { value: "aktif", label: "Aktif" },
                { value: "nonaktif", label: "Nonaktif" },
              ]}
            />
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable className="text-sm font-inter">
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Nama</TableHeadCell>
                    <TableHeadCell>Mapel</TableHeadCell>
                    <TableHeadCell>Jenis Kelamin</TableHeadCell>
                    <TableHeadCell>Alamat</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody className="divide-y">
                  {currentData.map((guru, index) => (
                    <TableRow
                      key={guru.id_guru}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                      <TableCell>{start + index + 1}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {guru.nama_guru}
                      </TableCell>
                      <TableCell>{guru.mapel_guru}</TableCell>
                      <TableCell>{guru.jk_guru}</TableCell>
                      <TableCell>{guru.alamat_guru}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-white text-xs ${
                            guru.user?.status_users === "aktif"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        >
                          {guru.user?.status_users}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => {
                            setSelectedGuru(guru);
                            setShowDetailModal(true);
                            setIsEditMode(false);
                          }}
                          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
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
            <div className="mt-auto pt-6 flex justify-center gap-2 text-sm font-inter">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 rounded-md border disabled:opacity-40"
              >
                Prev
              </button>

              {pages.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-md border ${
                    p === page ? "bg-blue-500 text-white border-blue-500" : "hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-md border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
      <Toast items={toasts} onRemove={removeToast} />

      {/* ===== MODAL TAMBAH GURU ===== */}
      <Modal dismissible show={showModal} size="4xl" onClose={() => setShowModal(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Tambah Data Guru</ModalHeader>

        <ModalBody className="px-6 py-4 max-h-[65vh] overflow-y-auto">
          <form id="add-guru-form" className="space-y-4" onSubmit={handleSimpan}>
            {/* Baris 1: 2 kolom */}
            <div className="grid grid-cols-2 gap-4">
              {/* Kolom Kiri */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nama_guru">Nama Guru</Label>
                  <TextInput
                    id="nama_guru"
                    name="nama_guru"
                    value={form.nama_guru}
                    onChange={handleFormChange}
                    placeholder="Masukkan nama guru"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="nip_guru">NIP</Label>
                  <TextInput
                    id="nip_guru"
                    name="nip_guru"
                    type="number"
                    value={form.nip_guru}
                    onChange={handleFormChange}
                    placeholder="Masukkan NIP"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email_users">Email</Label>
                  <TextInput
                    id="email_users"
                    name="email_users"
                    type="email"
                    value={form.email_users}
                    onChange={handleFormChange}
                    placeholder="Masukkan email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="jk_guru">Jenis Kelamin</Label>
                  <Select
                    id="jk_guru"
                    name="jk_guru"
                    value={form.jk_guru}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Pilih jenis kelamin</option>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </Select>
                </div>
              </div>

              {/* Kolom Kanan */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="no_guru">Nomor HP</Label>
                   <TextInput
                    id="no_guru"
                    name="no_guru"
                    type="text"
                    inputMode="numeric"
                    value={form.no_guru}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      handleFormChange({ ...e, target: { ...e.target, name: 'no_guru', value: val } });
                    }}
                    placeholder="Masukkan nomor HP"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="mapel_guru">Mata Pelajaran</Label>
                  <TextInput
                    id="mapel_guru"
                    name="mapel_guru"
                    value={form.mapel_guru}
                    onChange={handleFormChange}
                    placeholder="Masukkan mata pelajaran"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <TextInput
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleFormChange}
                      placeholder="Masukkan password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status_users">Status Akun</Label>
                  <Select
                    id="status_users"
                    name="status_users"
                    value={form.status_users}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Baris 2: Alamat full width */}
            <div>
              <Label htmlFor="alamat_guru">Alamat</Label>
              <Textarea
                id="alamat_guru"
                name="alamat_guru"
                value={form.alamat_guru}
                onChange={handleFormChange}
                placeholder="Masukkan alamat lengkap"
                rows={3}
                required
              />
            </div>
          </form>
        </ModalBody>

        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <Button form="add-guru-form" type="submit" color="blue">
            Simpan
          </Button>
          <Button type="button" onClick={() => {
            setShowModal(false);
            resetForm();
          }} color="red">
            Batal
          </Button>
        </ModalFooter>
      </Modal>

      {/* ===== MODAL DETAIL / EDIT GURU ===== */}
      <Modal
        dismissible
        show={showDetailModal}
        size="4xl"
        onClose={() => setShowDetailModal(false)}
      >
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          {isEditMode ? "Edit Data Guru" : "Detail Data Guru"}
        </ModalHeader>

        <ModalBody className="px-6 py-4 max-h-[65vh] overflow-y-auto">
          {selectedGuru && (
          <form id="edit-guru-form" className="space-y-4" onSubmit={handleUpdateGuru}>
            {/* Baris atas: 3 kiri + 3 kanan */}
            <div className="grid grid-cols-2 gap-4">
              {/* Kolom Kiri: Nama, NIP, No.HP */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nama_guru">Nama Guru</Label>
                  <TextInput
                    id="nama_guru"
                    name="nama_guru"
                    value={isEditMode ? form.nama_guru : selectedGuru.nama_guru}
                    onChange={handleFormChange}
                    readOnly={!isEditMode}
                  />
                </div>

                <div>
                  <Label htmlFor="nip_guru">NIP</Label>
                  <TextInput
                    id="nip_guru"
                    name="nip_guru"
                    type="text"
                    inputMode="numeric"
                    value={isEditMode ? form.nip_guru : selectedGuru.nip_guru}
                    onChange={handleFormChange}
                    readOnly={!isEditMode}
                  />
                </div>

                <div>
                  <Label htmlFor="no_guru">Nomor HP</Label>
                  <TextInput
                    id="no_guru"
                    name="no_guru"
                    type="text"
                    inputMode="numeric"
                    value={isEditMode ? form.no_guru : selectedGuru.no_guru}
                    onChange={handleFormChange}
                    readOnly={!isEditMode}
                  />
                </div>
              </div>

              {/* Kolom Kanan: Mapel, JK, Email */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mapel_guru">Mata Pelajaran</Label>
                  <TextInput
                    id="mapel_guru"
                    name="mapel_guru"
                    value={isEditMode ? form.mapel_guru : selectedGuru.mapel_guru}
                    onChange={handleFormChange}
                    readOnly={!isEditMode}
                  />
                </div>

                <div>
                  <Label htmlFor="jk_guru">Jenis Kelamin</Label>
                  <Select
                    id="jk_guru"
                    name="jk_guru"
                    value={isEditMode ? form.jk_guru : selectedGuru.jk_guru}
                    onChange={handleFormChange}
                    disabled={!isEditMode}
                  >
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="email_users">Email</Label>
                  <TextInput
                    id="email_users"
                    name="email_users"
                    type="email"
                    value={isEditMode ? form.email_users : (selectedGuru.user?.email_users || "")}
                    onChange={handleFormChange}
                    readOnly={!isEditMode}
                    placeholder="Email belum tersedia"
                  />
                </div>
              </div>
            </div>

            {/* Status Akun - full width */}
            <div>
              <Label htmlFor="status_users">Status Akun</Label>
              <Select
                id="status_users"
                name="status_users"
                value={isEditMode ? form.status_users : (selectedGuru.user?.status_users || "aktif")}
                onChange={handleFormChange}
                disabled={!isEditMode}
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </Select>
            </div>

            {/* Alamat - full width */}
            <div>
              <Label htmlFor="alamat_guru">Alamat</Label>
              <Textarea
                id="alamat_guru"
                name="alamat_guru"
                value={isEditMode ? form.alamat_guru : selectedGuru.alamat_guru}
                onChange={handleFormChange}
                readOnly={!isEditMode}
                rows={3}
              />
            </div>
          </form>
          )}
        </ModalBody>


        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          {!isEditMode ? (
            <>
              <Button type="button" color="blue" onClick={handleEditGuru}>
                Edit
              </Button>
              <Button type="button" color="red" onClick={() => setShowConfirmDelete(true)}>
                Hapus
              </Button>
            </>
              ) : (
            <>
              <Button form="edit-guru-form" type="submit" color="blue">
                Simpan
              </Button>
              <Button
                type="button"
                color="red"
                onClick={() => {
                  setIsEditMode(false);
                  resetForm();
                }}
              >
                Batal
              </Button>
            </>
            )}
        </ModalFooter>
      </Modal>

      {/* ===== MODAL KONFIRMASI HAPUS ===== */}
      <Modal
        dismissible
        show={showConfirmDelete}
        size="sm"
        onClose={() => setShowConfirmDelete(false)}
      >
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          Konfirmasi Hapus
        </ModalHeader>
        <ModalBody className="px-6 py-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-inter">
              Apakah Anda yakin ingin menghapus data guru{" "}
              <span className="font-semibold text-gray-900">{selectedGuru?.nama_guru}</span>?
            </p>
            <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-center gap-3 border-t border-gray-200">
          <Button type="button" color="gray" onClick={() => {
            setShowConfirmDelete(false);
            resetForm();
          }}>
            Batal
          </Button>
          <Button type="button" color="red" onClick={handleDeleteGuru}>
            Ya, Hapus
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
