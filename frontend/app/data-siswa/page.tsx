"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import SearchFilter from "../components/SearchFilter";
import Toast, { ToastItem } from "../components/Toast";
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

type Siswa = {
  id_siswa: number;
  id_users: number;
  id_kelas: number;
  nama_siswa: string;
  nis_siswa: string;
  jk_siswa: string;
  alamat_siswa: string;
  no_siswa: string;

  user?: {
    email_users: string;
    status_users: string;
  };

  kelas?: {
    id_kelas: number;
    tingkat_kelas: string;
    rombel: string;
    jurusan?: {
      nama_jurusan: string;
    };
  };
};

type Kelas = {
  id_kelas: number;
  tingkat_kelas: string;
  rombel: string;
  jurusan?: {
    nama_jurusan: string;
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

export default function DataSiswaPage() {
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState<UnlinkedUser[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [role, setRole] = useState<string>("");

  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [tempFilterKelas, setTempFilterKelas] = useState("all");
  const [tempFilterStatus, setTempFilterStatus] = useState("all");

  const [selectedJurusanForm, setSelectedJurusanForm] = useState("");
  const uniqueJurusan = Array.from(new Set(kelas.map((k) => k.jurusan?.nama_jurusan).filter(Boolean))) as string[];

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (type: ToastItem["type"], message: string, duration = 3500) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    setToasts((s) => [...s, { id, type, message, duration }]);
  };
  const removeToast = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  // form state
  const [form, setForm] = useState({
    id_users: "",
    nama_siswa: "",
    nis_siswa: "",
    jk_siswa: "",
    alamat_siswa: "",
    no_siswa: "",
    id_kelas: "",
  });

  const resetForm = () => {
    setForm({
      id_users: "",
      nama_siswa: "",
      nis_siswa: "",
      jk_siswa: "",
      alamat_siswa: "",
      no_siswa: "",
      id_kelas: "",
    });
    setSelectedJurusanForm("");
  };

  const openTambahModal = () => {
    resetForm();
    fetchUnlinkedUsers();
    setShowModal(true);
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));

    const savedRole = localStorage.getItem("role");
    if (savedRole) setRole(savedRole);
  }, []);

  const fetchSiswa = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:8000/api/admin/siswa", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      const siswaArray = json.data || json;
      setSiswa(siswaArray);
    } catch (error) {
      console.error("Fetch siswa error:", error);
    }
  };

  const fetchKelas = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:8000/api/admin/kelas", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      const kelasArray = json.data || json;
      setKelas(kelasArray);
    } catch (error) {
      console.error("Fetch kelas error:", error);
    }
  };

  const fetchUnlinkedUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:8000/api/admin/users/unlinked?role=siswa", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setUnlinkedUsers(json.data || []);
    } catch (error) {
      console.error("Fetch unlinked users error:", error);
    }
  };

  useEffect(() => {
    fetchSiswa();
    fetchKelas();
  }, []);

  useEffect(() => {
    if (!showDetailModal) {
      resetForm();
      setIsEditMode(false);
    }
  }, [showDetailModal]);

  const handleFormChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;

    // Filter angka untuk NIS dan Nomor HP
    if (name === "nis_siswa" || name === "no_siswa") {
      const numericOnly = value.replace(/[^0-9]/g, "");
      setForm((prev) => ({ ...prev, [name]: numericOnly }));
      return;
    }

    // Set nama siswa otomatis saat akun user dipilih
    if (name === "id_users") {
      const selectedUsr = unlinkedUsers.find((u) => u.id_users.toString() === value);
      setForm((prev) => ({
        ...prev,
        id_users: value,
        nama_siswa: selectedUsr ? selectedUsr.nama_users : prev.nama_siswa,
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

    if (!form.id_users || !form.nama_siswa || !form.id_kelas || !form.jk_siswa || !form.nis_siswa) {
      pushToast("error", "Mohon lengkapi semua field yang wajib!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        pushToast("error", "Token tidak ditemukan. Silakan login kembali.");
        return;
      }

      const dataToSend = {
        id_users: parseInt(form.id_users),
        nama_siswa: String(form.nama_siswa).trim(),
        nis_siswa: String(form.nis_siswa).trim(),
        jk_siswa: String(form.jk_siswa).trim(),
        alamat_siswa: String(form.alamat_siswa).trim(),
        no_siswa: String(form.no_siswa).trim(),
        id_kelas: parseInt(form.id_kelas),
      };

      const res = await fetch("http://localhost:8000/api/admin/siswa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.errors) {
          const errorMessages = Object.values(json.errors).flat().join("\n");
          throw new Error(`Validasi gagal:\n${errorMessages}`);
        } else if (json.message) {
          throw new Error(json.message);
        } else {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      }

      pushToast("success", "Profil data siswa berhasil disimpan!");
      fetchSiswa();
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      console.error("Error detail:", err);
      pushToast("error", err.message || err);
    }
  };

  const handleEditSiswa = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (selectedSiswa) {
      setForm({
        id_users: selectedSiswa.id_users.toString(),
        nama_siswa: selectedSiswa.nama_siswa,
        nis_siswa: selectedSiswa.nis_siswa,
        jk_siswa: selectedSiswa.jk_siswa,
        alamat_siswa: selectedSiswa.alamat_siswa,
        no_siswa: selectedSiswa.no_siswa,
        id_kelas: selectedSiswa.id_kelas.toString(),
      });
      const currentJurusan = selectedSiswa.kelas?.jurusan?.nama_jurusan || "";
      setSelectedJurusanForm(currentJurusan);
      setIsEditMode(true);
    }
  };

  const handleDeleteSiswa = async () => {
    if (!selectedSiswa) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/siswa/${selectedSiswa.id_siswa}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus siswa");

      fetchSiswa();
      setShowConfirmDelete(false);
      setShowDetailModal(false);
      setSelectedSiswa(null);
      pushToast("success", "Data profil siswa berhasil dihapus!");
    } catch (err: any) {
      console.error(err);
      pushToast("error", err.message || err);
    }
  };

  const handleUpdateSiswa = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!selectedSiswa) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/siswa/${selectedSiswa.id_siswa}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memperbarui siswa");

      fetchSiswa();
      setShowDetailModal(false);
      setSelectedSiswa(null);
      setIsEditMode(false);
      resetForm();
      pushToast("success", "Profil siswa berhasil diperbarui!");
    } catch (err: any) {
      console.error(err);
      pushToast("error", err.message || err);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredData = siswa.filter((s) => {
    const matchSearch =
      !normalizedSearch ||
      [s.nama_siswa, s.nis_siswa, s.alamat_siswa].some((v) =>
        (v || "").toLowerCase().includes(normalizedSearch)
      );
    const matchKelas = filterKelas === "all" || s.id_kelas.toString() === filterKelas;
    const matchStatus = filterStatus === "all" || s.user?.status_users === filterStatus;
    return matchSearch && matchKelas && matchStatus;
  });

  const totalPages = Math.ceil(filteredData.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = filteredData.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const hasActiveFilter = filterKelas !== "all" || filterStatus !== "all";

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-inter">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Data Siswa" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4">Daftar Data Siswa</h1>

            {role === "admin" && (
              <button
                onClick={openTambahModal}
                className="mb-4 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm w-fit transition-all duration-200"
              >
                Tambah Siswa <span className="text-lg">+</span>
              </button>
            )}

            {/* Search & Filter */}
            <div className="flex items-center gap-3 mb-5">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari siswa..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <button
                onClick={() => {
                  setTempFilterKelas(filterKelas);
                  setTempFilterStatus(filterStatus);
                  setShowFilter(true);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition ${
                  hasActiveFilter
                    ? "bg-blue-50 border-blue-400 text-blue-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                🔍 Filter
                {hasActiveFilter && (
                  <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {[filterKelas !== "all", filterStatus !== "all"].filter(Boolean).length}
                  </span>
                )}
              </button>

              {hasActiveFilter && (
                <div className="flex items-center gap-2 flex-wrap">
                  {filterKelas !== "all" && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      Kelas:{" "}
                      {(() => {
                        const k = kelas.find((kl) => kl.id_kelas.toString() === filterKelas);
                        return k
                          ? `${k.tingkat_kelas} ${k.jurusan?.nama_jurusan || ""} ${k.rombel}`.replace(/\s+/g, " ").trim()
                          : "";
                      })()}
                    </span>
                  )}
                  {filterStatus !== "all" && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      Status: {filterStatus === "aktif" ? "Aktif" : "Nonaktif"}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setFilterKelas("all");
                      setFilterStatus("all");
                      setTempFilterKelas("all");
                      setTempFilterStatus("all");
                      setPage(1);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Hapus filter
                  </button>
                </div>
              )}
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable className="text-sm">
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Nama</TableHeadCell>
                    <TableHeadCell>NIS</TableHeadCell>
                    <TableHeadCell>Kelas</TableHeadCell>
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
                        Belum ada siswa yang cocok.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((siswa, index) => (
                      <TableRow key={siswa.id_siswa} className="bg-white">
                        <TableCell>{start + index + 1}</TableCell>
                        <TableCell className="whitespace-nowrap font-medium text-gray-900">
                          {siswa.nama_siswa}
                        </TableCell>
                        <TableCell>{siswa.nis_siswa}</TableCell>
                        <TableCell>
                          {siswa.kelas
                            ? `${siswa.kelas.tingkat_kelas} ${siswa.kelas.jurusan?.nama_jurusan || ""} ${siswa.kelas.rombel}`.replace(/\s+/g, " ").trim()
                            : "-"}
                        </TableCell>
                        <TableCell>{siswa.jk_siswa}</TableCell>
                        <TableCell>{siswa.alamat_siswa}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-white text-xs ${
                              siswa.user?.status_users === "aktif" ? "bg-green-500" : "bg-red-500"
                            }`}
                          >
                            {siswa.user?.status_users || "nonaktif"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => {
                              setSelectedSiswa(siswa);
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

      {/* ===== MODAL TAMBAH SISWA ===== */}
      <Modal
        dismissible
        show={showModal}
        size="4xl"
        onClose={() => {
          setShowModal(false);
          setSelectedJurusanForm("");
        }}
      >
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Tambah Data Siswa</ModalHeader>

        <ModalBody className="px-6 py-4 max-h-[65vh] overflow-y-auto">
          <form id="add-siswa-form" className="flex flex-col gap-4" onSubmit={handleSimpan}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-5">
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
                </div>

                <div>
                  <Label htmlFor="nama_siswa">Nama Siswa (Otomatis dari Akun)</Label>
                  <TextInput
                    id="nama_siswa"
                    name="nama_siswa"
                    value={form.nama_siswa}
                    readOnly
                    placeholder="Pilih Akun User di atas"
                    className="bg-gray-50"
                  />
                </div>

                <div>
                  <Label htmlFor="nis_siswa">NIS *</Label>
                  <TextInput
                    id="nis_siswa"
                    name="nis_siswa"
                    type="text"
                    value={form.nis_siswa}
                    onChange={handleFormChange}
                    placeholder="Masukkan NIS"
                    required
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="jk_siswa">Jenis Kelamin *</Label>
                  <Select
                    id="jk_siswa"
                    name="jk_siswa"
                    value={form.jk_siswa}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">-- Pilih Jenis Kelamin --</option>
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="no_siswa">Nomor HP</Label>
                  <TextInput
                    id="no_siswa"
                    name="no_siswa"
                    type="text"
                    value={form.no_siswa}
                    onChange={handleFormChange}
                    placeholder="Masukkan nomor HP"
                  />
                </div>

                <div>
                  <Label htmlFor="jurusan">Jurusan *</Label>
                  <Select
                    id="jurusan"
                    value={selectedJurusanForm}
                    onChange={(e) => {
                      setSelectedJurusanForm(e.target.value);
                      setForm((prev) => ({ ...prev, id_kelas: "" }));
                    }}
                    required
                  >
                    <option value="">Pilih jurusan</option>
                    {uniqueJurusan.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="id_kelas">Kelas *</Label>
              <Select
                id="id_kelas"
                name="id_kelas"
                value={form.id_kelas}
                onChange={handleFormChange}
                required
                disabled={!selectedJurusanForm}
              >
                <option value="">Pilih kelas</option>
                {kelas
                  .filter((k) => k.jurusan?.nama_jurusan === selectedJurusanForm)
                  .map((k) => (
                    <option key={k.id_kelas} value={k.id_kelas}>
                      {`${k.tingkat_kelas} ${k.jurusan?.nama_jurusan || ""} ${k.rombel}`.replace(/\s+/g, " ").trim()}
                    </option>
                  ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="alamat_siswa">Alamat</Label>
              <Textarea
                id="alamat_siswa"
                name="alamat_siswa"
                value={form.alamat_siswa}
                onChange={handleFormChange}
                placeholder="Masukkan alamat"
                rows={2}
              />
            </div>
          </form>
        </ModalBody>

        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <Button form="add-siswa-form" type="submit" color="blue">
            Simpan Siswa
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

      {/* ===== MODAL DETAIL / EDIT SISWA ===== */}
      <Modal
        dismissible
        show={showDetailModal}
        size="4xl"
        onClose={() => {
          setShowDetailModal(false);
          setSelectedJurusanForm("");
        }}
      >
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          {isEditMode ? "Edit Profil Siswa" : "Detail Profil Siswa"}
        </ModalHeader>

        <ModalBody className="px-6 py-4 max-h-[65vh] overflow-y-auto">
          {selectedSiswa && (
            <form id="edit-siswa-form" className="flex flex-col gap-4" onSubmit={handleUpdateSiswa}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="edit_nama_siswa">Nama Siswa</Label>
                    <TextInput
                      id="edit_nama_siswa"
                      name="nama_siswa"
                      value={isEditMode ? form.nama_siswa : selectedSiswa.nama_siswa}
                      onChange={handleFormChange}
                      readOnly={!isEditMode}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit_nis_siswa">NIS</Label>
                    <TextInput
                      id="edit_nis_siswa"
                      name="nis_siswa"
                      type="text"
                      value={isEditMode ? form.nis_siswa : selectedSiswa.nis_siswa}
                      onChange={handleFormChange}
                      readOnly={!isEditMode}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit_no_siswa">Nomor HP</Label>
                    <TextInput
                      id="edit_no_siswa"
                      name="no_siswa"
                      type="text"
                      value={isEditMode ? form.no_siswa : selectedSiswa.no_siswa}
                      onChange={handleFormChange}
                      readOnly={!isEditMode}
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="edit_jk_siswa">Jenis Kelamin</Label>
                    <Select
                      id="edit_jk_siswa"
                      name="jk_siswa"
                      value={isEditMode ? form.jk_siswa : selectedSiswa.jk_siswa}
                      onChange={handleFormChange}
                      disabled={!isEditMode}
                    >
                      <option value="laki-laki">Laki-laki</option>
                      <option value="perempuan">Perempuan</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit_jurusan">Jurusan</Label>
                    <Select
                      id="edit_jurusan"
                      value={isEditMode ? selectedJurusanForm : selectedSiswa.kelas?.jurusan?.nama_jurusan || ""}
                      onChange={(e) => {
                        setSelectedJurusanForm(e.target.value);
                        setForm((prev) => ({ ...prev, id_kelas: "" }));
                      }}
                      disabled={!isEditMode}
                    >
                      <option value="">Pilih jurusan</option>
                      {uniqueJurusan.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit_id_kelas">Kelas</Label>
                    <Select
                      id="edit_id_kelas"
                      name="id_kelas"
                      value={isEditMode ? form.id_kelas : selectedSiswa.id_kelas}
                      onChange={handleFormChange}
                      disabled={!isEditMode || (isEditMode && !selectedJurusanForm)}
                    >
                      <option value="">Pilih kelas</option>
                      {kelas
                        .filter((k) => (isEditMode ? k.jurusan?.nama_jurusan === selectedJurusanForm : true))
                        .map((k) => (
                          <option key={k.id_kelas} value={k.id_kelas}>
                            {`${k.tingkat_kelas} ${k.jurusan?.nama_jurusan || ""} ${k.rombel}`.replace(/\s+/g, " ").trim()}
                          </option>
                        ))}
                    </Select>
                  </div>
                </div>
              </div>

              {!isEditMode && (
                <div>
                  <Label htmlFor="edit_email_users">Email Login (Read-Only)</Label>
                  <TextInput
                    id="edit_email_users"
                    value={selectedSiswa.user?.email_users || "Belum ada akun"}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="edit_alamat_siswa">Alamat</Label>
                <Textarea
                  id="edit_alamat_siswa"
                  name="alamat_siswa"
                  value={isEditMode ? form.alamat_siswa : selectedSiswa.alamat_siswa}
                  onChange={handleFormChange}
                  readOnly={!isEditMode}
                  rows={2}
                />
              </div>
            </form>
          )}
        </ModalBody>

        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          {!isEditMode ? (
            role === "admin" ? (
              <>
                <Button type="button" color="blue" onClick={handleEditSiswa}>
                  Edit Profil
                </Button>
                <Button type="button" color="red" onClick={() => setShowConfirmDelete(true)}>
                  Hapus Profil
                </Button>
              </>
            ) : (
              <Button type="button" color="gray" onClick={() => setShowDetailModal(false)}>
                Tutup
              </Button>
            )
          ) : (
            <>
              <Button form="edit-siswa-form" type="submit" color="blue">
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
              Apakah Anda yakin ingin menghapus profil data siswa{" "}
              <span className="font-semibold text-gray-900">{selectedSiswa?.nama_siswa}</span>?
            </p>
            <p className="text-sm text-gray-500">Tindakan ini tidak menghapus akun user login siswa.</p>
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
          <Button type="button" color="red" onClick={handleDeleteSiswa}>
            Ya, Hapus
          </Button>
        </ModalFooter>
      </Modal>

      {/* ===== FILTER SLIDE OVER / MODAL ===== */}
      <Modal dismissible show={showFilter} size="md" onClose={() => setShowFilter(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Filter Data Siswa</ModalHeader>
        <ModalBody className="px-6 py-4 space-y-4">
          <div>
            <Label htmlFor="filter_kelas">Kelas</Label>
            <Select id="filter_kelas" value={tempFilterKelas} onChange={(e) => setTempFilterKelas(e.target.value)}>
              <option value="all">Semua Kelas</option>
              {kelas.map((k) => (
                <option key={k.id_kelas} value={k.id_kelas}>
                  {`${k.tingkat_kelas} ${k.jurusan?.nama_jurusan || ""} ${k.rombel}`.replace(/\s+/g, " ").trim()}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="filter_status">Status Akun</Label>
            <Select id="filter_status" value={tempFilterStatus} onChange={(e) => setTempFilterStatus(e.target.value)}>
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </Select>
          </div>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <Button
            color="blue"
            onClick={() => {
              setFilterKelas(tempFilterKelas);
              setFilterStatus(tempFilterStatus);
              setPage(1);
              setShowFilter(false);
            }}
          >
            Terapkan Filter
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setTempFilterKelas("all");
              setTempFilterStatus("all");
              setFilterKelas("all");
              setFilterStatus("all");
              setPage(1);
              setShowFilter(false);
            }}
          >
            Reset
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}