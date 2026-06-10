"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import {
  Modal,
  Button,
  Label,
  TextInput,
  Textarea,
  Select,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
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

type UnlinkedUser = {
  id_users: number;
  nama_users: string;
  email_users: string;
};

const DATA_PER_PAGE = 10;

export default function DataGuruPage() {
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState<UnlinkedUser[]>([]);
  const [selectedGuru, setSelectedGuru] = useState<Guru | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    id_users: "",
    nama_guru: "",
    nip_guru: "",
    mapel_guru: "",
    jk_guru: "",
    alamat_guru: "",
    no_guru: "",
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const pushToast = (type: ToastItem["type"], message: string, duration = 3500) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    setToasts((s) => [...s, { id, type, message, duration }]);
  };
  const removeToast = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  const resetForm = () => {
    setForm({
      id_users: "",
      nama_guru: "",
      nip_guru: "",
      mapel_guru: "",
      jk_guru: "",
      alamat_guru: "",
      no_guru: "",
    });
  };

  const openTambahModal = () => {
    resetForm();
    fetchUnlinkedUsers();
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
      pushToast("error", "Gagal memuat data guru");
    }
  };

  const fetchUnlinkedUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:8000/api/admin/users/unlinked?role=guru", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setUnlinkedUsers(json.data || []);
    } catch (error) {
      console.error("Fetch unlinked users error:", error);
    }
  };

  useEffect(() => {
    fetchGuru();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    if (name === "no_guru" || name === "nip_guru") {
      const numericOnly = value.replace(/[^0-9]/g, "");
      setForm((prev) => ({ ...prev, [name]: numericOnly }));
      return;
    }
    
    // Automatically set nama_guru when id_users is selected from dropdown
    if (name === "id_users") {
      const selectedUsr = unlinkedUsers.find(u => u.id_users.toString() === value);
      setForm((prev) => ({
        ...prev,
        id_users: value,
        nama_guru: selectedUsr ? selectedUsr.nama_users : prev.nama_guru
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSimpan = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    if (!form.id_users || !form.nama_guru || !form.nip_guru || !form.jk_guru || !form.mapel_guru) {
      pushToast("error", "Harap isi seluruh field yang bertanda bintang (*)");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/guru", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menambahkan guru");

      fetchGuru();
      setShowModal(false);
      pushToast("success", "Profil data guru berhasil dibuat");
      resetForm();
    } catch (err: any) {
      console.error(err);
      pushToast("error", err.message || "Gagal menambahkan guru");
    }
  };

  const handleEditGuru = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (selectedGuru) {
      setForm({
        id_users: selectedGuru.id_users.toString(),
        nama_guru: selectedGuru.nama_guru,
        nip_guru: selectedGuru.nip_guru,
        mapel_guru: selectedGuru.mapel_guru,
        jk_guru: selectedGuru.jk_guru,
        alamat_guru: selectedGuru.alamat_guru,
        no_guru: selectedGuru.no_guru,
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
          Accept: "application/json",
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus guru");

      fetchGuru();
      setShowConfirmDelete(false);
      setShowDetailModal(false);
      setSelectedGuru(null);
      pushToast("success", "Data profil guru berhasil dihapus");
    } catch (err: any) {
      console.error(err);
      pushToast("error", err.message || String(err));
    }
  };

  const handleUpdateGuru = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedGuru) {
      pushToast("error", "Guru tidak terpilih");
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
      pushToast("success", "Data profil guru berhasil disimpan");
    } catch (err: any) {
      console.error(err);
      pushToast("error", String(err));
    }
  };

  // apply search and filters
  const normalizedSearch = search.trim().toLowerCase();
  const filteredData = gurus.filter((g) => {
    const matchSearch =
      !normalizedSearch ||
      [g.nama_guru, g.mapel_guru, g.nip_guru].some((v) =>
        (v || "").toLowerCase().includes(normalizedSearch)
      );
    const matchStatus = filterStatus === "all" || g.user?.status_users === filterStatus;
    return matchSearch && matchStatus;
  });

  const data = filteredData;
  const totalPages = Math.ceil(data.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = data.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-inter">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Data Guru" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4">Daftar Data Guru</h1>

            <button
              onClick={openTambahModal}
              className="mb-4 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm w-fit transition-all duration-200"
            >
              Tambah Guru <span className="text-lg">+</span>
            </button>

            {/* Search & Filter */}
            <div className="mb-4">
              <SearchFilter
                search={search}
                onSearchChange={setSearch}
                filter={filterStatus}
                onFilterChange={setFilterStatus}
                placeholder="Cari NIP, nama atau mapel..."
                filterOptions={[
                  { value: "all", label: "Semua status" },
                  { value: "aktif", label: "Aktif" },
                  { value: "nonaktif", label: "Nonaktif" },
                ]}
              />
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable className="text-sm">
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Nama</TableHeadCell>
                    <TableHeadCell>NIP</TableHeadCell>
                    <TableHeadCell>Mapel</TableHeadCell>
                    <TableHeadCell>Jenis Kelamin</TableHeadCell>
                    <TableHeadCell>Alamat</TableHeadCell>
                    <TableHeadCell>Status Akun</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody className="divide-y">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                        Belum ada data guru.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((guru, index) => (
                      <TableRow key={guru.id_guru} className="bg-white">
                        <TableCell>{start + index + 1}</TableCell>
                        <TableCell className="whitespace-nowrap font-medium text-gray-900">
                          {guru.nama_guru}
                        </TableCell>
                        <TableCell>{guru.nip_guru}</TableCell>
                        <TableCell>{guru.mapel_guru}</TableCell>
                        <TableCell>{guru.jk_guru}</TableCell>
                        <TableCell>{guru.alamat_guru}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-white text-xs ${
                              guru.user?.status_users === "aktif" ? "bg-green-500" : "bg-red-500"
                            }`}
                          >
                            {guru.user?.status_users || "nonaktif"}
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* PAGINATION */}
            <div className="mt-auto pt-6 flex justify-center gap-2 text-sm">
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
            <div className="grid grid-cols-2 gap-4">
              {/* Kolom Kiri */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="id_users">Pilih Akun User Login *</Label>
                  <Select
                    id="id_users"
                    name="id_users"
                    value={form.id_users}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">-- Hubungkan dengan Akun User --</option>
                    {unlinkedUsers.map((u) => (
                      <option key={u.id_users} value={u.id_users}>
                        {u.nama_users} ({u.email_users})
                      </option>
                    ))}
                  </Select>
                  <p className="text-gray-400 text-xs italic mt-1">
                    * Hanya menampilkan akun login ber-role Guru yang profilnya belum dibuat.
                  </p>
                </div>

                <div>
                  <Label htmlFor="nama_guru">Nama Guru (Otomatis dari Akun)</Label>
                  <TextInput
                    id="nama_guru"
                    name="nama_guru"
                    value={form.nama_guru}
                    readOnly
                    placeholder="Pilih Akun User di atas"
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="nip_guru">NIP *</Label>
                  <TextInput
                    id="nip_guru"
                    name="nip_guru"
                    type="text"
                    value={form.nip_guru}
                    onChange={handleFormChange}
                    placeholder="Masukkan NIP"
                    required
                  />
                </div>
              </div>

              {/* Kolom Kanan */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="jk_guru">Jenis Kelamin *</Label>
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

                <div>
                  <Label htmlFor="no_guru">Nomor HP</Label>
                  <TextInput
                    id="no_guru"
                    name="no_guru"
                    type="text"
                    value={form.no_guru}
                    onChange={handleFormChange}
                    placeholder="Masukkan nomor HP"
                  />
                </div>

                <div>
                  <Label htmlFor="mapel_guru">Mata Pelajaran *</Label>
                  <TextInput
                    id="mapel_guru"
                    name="mapel_guru"
                    value={form.mapel_guru}
                    onChange={handleFormChange}
                    placeholder="Masukkan mata pelajaran"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="alamat_guru">Alamat</Label>
              <Textarea
                id="alamat_guru"
                name="alamat_guru"
                value={form.alamat_guru}
                onChange={handleFormChange}
                placeholder="Masukkan alamat lengkap"
                rows={3}
              />
            </div>
          </form>
        </ModalBody>

        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <Button form="add-guru-form" type="submit" color="blue">
            Simpan Guru
          </Button>
          <Button
            type="button"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            color="red"
          >
            Batal
          </Button>
        </ModalFooter>
      </Modal>

      {/* ===== MODAL DETAIL / EDIT GURU ===== */}
      <Modal dismissible show={showDetailModal} size="4xl" onClose={() => setShowDetailModal(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          {isEditMode ? "Edit Profil Guru" : "Detail Profil Guru"}
        </ModalHeader>

        <ModalBody className="px-6 py-4 max-h-[65vh] overflow-y-auto">
          {selectedGuru && (
            <form id="edit-guru-form" className="space-y-4" onSubmit={handleUpdateGuru}>
              <div className="grid grid-cols-2 gap-4">
                {/* Kolom Kiri */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit_nama_guru">Nama Guru</Label>
                    <TextInput
                      id="edit_nama_guru"
                      name="nama_guru"
                      value={isEditMode ? form.nama_guru : selectedGuru.nama_guru}
                      onChange={handleFormChange}
                      readOnly={!isEditMode}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit_nip_guru">NIP</Label>
                    <TextInput
                      id="edit_nip_guru"
                      name="nip_guru"
                      type="text"
                      value={isEditMode ? form.nip_guru : selectedGuru.nip_guru}
                      onChange={handleFormChange}
                      readOnly={!isEditMode}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit_no_guru">Nomor HP</Label>
                    <TextInput
                      id="edit_no_guru"
                      name="no_guru"
                      type="text"
                      value={isEditMode ? form.no_guru : selectedGuru.no_guru}
                      onChange={handleFormChange}
                      readOnly={!isEditMode}
                    />
                  </div>
                </div>

                {/* Kolom Kanan */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit_mapel_guru">Mata Pelajaran</Label>
                    <TextInput
                      id="edit_mapel_guru"
                      name="mapel_guru"
                      value={isEditMode ? form.mapel_guru : selectedGuru.mapel_guru}
                      onChange={handleFormChange}
                      readOnly={!isEditMode}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit_jk_guru">Jenis Kelamin</Label>
                    <Select
                      id="edit_jk_guru"
                      name="jk_guru"
                      value={isEditMode ? form.jk_guru : selectedGuru.jk_guru}
                      onChange={handleFormChange}
                      disabled={!isEditMode}
                    >
                      <option value="laki-laki">Laki-laki</option>
                      <option value="perempuan">Perempuan</option>
                    </Select>
                  </div>

                  {!isEditMode && (
                    <div>
                      <Label htmlFor="edit_email_users">Email Login (Read-Only)</Label>
                      <TextInput
                        id="edit_email_users"
                        name="email_users"
                        type="email"
                        value={selectedGuru.user?.email_users || "Belum ada akun"}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="edit_alamat_guru">Alamat</Label>
                <Textarea
                  id="edit_alamat_guru"
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
                Edit Profil
              </Button>
              <Button type="button" color="red" onClick={() => setShowConfirmDelete(true)}>
                Hapus Profil
              </Button>
            </>
          ) : (
            <>
              <Button form="edit-guru-form" type="submit" color="blue">
                Simpan Profil
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
      <Modal dismissible show={showConfirmDelete} size="sm" onClose={() => setShowConfirmDelete(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Konfirmasi Hapus</ModalHeader>
        <ModalBody className="px-6 py-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-inter">
              Apakah Anda yakin ingin menghapus profil data guru{" "}
              <span className="font-semibold text-gray-900">{selectedGuru?.nama_guru}</span>?
            </p>
            <p className="text-sm text-gray-500">Tindakan ini tidak menghapus akun user login guru.</p>
          </div>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-center gap-3 border-t border-gray-200">
          <Button
            type="button"
            color="gray"
            onClick={() => {
              setShowConfirmDelete(false);
              resetForm();
            }}
          >
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
