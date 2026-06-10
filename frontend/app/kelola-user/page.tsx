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

type UserProfile = {
  id_users: number;
  nama_users: string;
  email_users: string;
  role_users: "admin" | "guru" | "siswa" | "dudi";
  status_users: "aktif" | "nonaktif";
  guru?: {
    id_guru: number;
    nip_guru: string;
    mapel_guru: string;
  };
  siswa?: {
    id_siswa: number;
    nis_siswa: string;
    kelas?: {
      tingkat_kelas: string;
      rombel: string;
      jurusan?: {
        nama_jurusan: string;
      };
    };
  };
  dudi?: {
    id_dudi: number;
    nama_dudi: string;
  };
};

type CurrentUser = {
  name: string;
  email: string;
  status_users: string;
};

const DATA_PER_PAGE = 10;

export default function KelolaUserPage() {
  const [page, setPage] = useState(1);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Form State (Only user table fields)
  const [form, setForm] = useState({
    nama_users: "",
    email_users: "",
    password: "",
    role_users: "admin",
    status_users: "aktif",
  });

  const pushToast = (type: ToastItem["type"], message: string, duration = 3500) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    setToasts((s) => [...s, { id, type, message, duration }]);
  };
  const removeToast = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  const resetForm = () => {
    setForm({
      nama_users: "",
      email_users: "",
      password: "",
      role_users: "admin",
      status_users: "aktif",
    });
    setShowPassword(false);
  };

  const openTambahModal = () => {
    resetForm();
    setShowModal(true);
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setCurrentUser(JSON.parse(userData));
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:8000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setUsersList(json.data || []);
    } catch (error) {
      console.error("Fetch users error:", error);
      pushToast("error", "Gagal memuat data user");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSimpan = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    if (!form.nama_users || !form.email_users || !form.password) {
      pushToast("error", "Lengkapi kolom Nama, Email, dan Password!");
      return;
    }

    if (form.password.length < 6) {
      pushToast("error", "Password minimal 6 karakter!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.errors) {
          const errMsg = Object.values(json.errors).flat().join(", ");
          throw new Error(errMsg);
        }
        throw new Error(json.message || "Gagal membuat user");
      }

      pushToast("success", "Akun login user berhasil dibuat!");
      fetchUsers();
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      pushToast("error", err.message || "Gagal menyimpan data");
    }
  };

  const handleEditUser = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    setForm({
      nama_users: selectedUser.nama_users,
      email_users: selectedUser.email_users,
      password: "",
      role_users: selectedUser.role_users,
      status_users: selectedUser.status_users,
    });
    setIsEditMode(true);
  };

  const handleUpdateUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    if (form.password && form.password.length < 6) {
      pushToast("error", "Password minimal 6 karakter!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/users/${selectedUser.id_users}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.errors) {
          const errMsg = Object.values(json.errors).flat().join(", ");
          throw new Error(errMsg);
        }
        throw new Error(json.message || "Gagal memperbarui user");
      }

      pushToast("success", "Perubahan user berhasil disimpan!");
      fetchUsers();
      setShowDetailModal(false);
      setSelectedUser(null);
      setIsEditMode(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      pushToast("error", err.message || "Gagal memperbarui data");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/users/${selectedUser.id_users}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus user");

      pushToast("success", "User berhasil dihapus!");
      fetchUsers();
      setShowConfirmDelete(false);
      setShowDetailModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (err: any) {
      console.error(err);
      pushToast("error", err.message || "Gagal menghapus user");
    }
  };

  // Search, filter & pagination
  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = usersList.filter((u) => {
    const matchSearch =
      !normalizedSearch ||
      u.nama_users.toLowerCase().includes(normalizedSearch) ||
      u.email_users.toLowerCase().includes(normalizedSearch);
    const matchStatus = filterStatus === "all" || u.status_users === filterStatus;
    const matchRole = filterRole === "all" || u.role_users === filterRole;

    return matchSearch && matchStatus && matchRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = filteredUsers.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!currentUser) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-inter">
      <Sidebar user={currentUser} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Kelola User" userName={currentUser.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4">Daftar Akun User</h1>

            <button
              onClick={openTambahModal}
              className="mb-4 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm w-fit transition-all duration-200"
            >
              Tambah User <span className="text-lg">+</span>
            </button>

            {/* Filter Panel */}
            <div className="mb-4">
              <SearchFilter
                search={search}
                onSearchChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Cari nama atau email..."
                filter={filterStatus}
                onFilterChange={(val) => {
                  setFilterStatus(val);
                  setPage(1);
                }}
                filterOptions={[
                  { value: "all", label: "Semua Status" },
                  { value: "aktif", label: "Aktif" },
                  { value: "nonaktif", label: "Nonaktif" },
                ]}
                filter2={filterRole}
                onFilter2Change={(val) => {
                  setFilterRole(val);
                  setPage(1);
                }}
                filterOptions2={[
                  { value: "all", label: "Semua Role" },
                  { value: "admin", label: "Admin" },
                  { value: "guru", label: "Guru" },
                  { value: "siswa", label: "Siswa" },
                  { value: "dudi", label: "Dudi" },
                ]}
              />
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable className="text-sm">
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Nama Akun</TableHeadCell>
                    <TableHeadCell>Email Login</TableHeadCell>
                    <TableHeadCell>Role</TableHeadCell>
                    <TableHeadCell>Status Profil</TableHeadCell>
                    <TableHeadCell>Status Akun</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody className="divide-y">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                        Belum ada user yang terdaftar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((usr, index) => {
                      let statusProfil = "Belum Diisi";
                      let styleProfil = "text-red-500 font-semibold";
                      if (usr.role_users === "guru" && usr.guru) {
                        statusProfil = "Sudah Terisi (Guru)";
                        styleProfil = "text-green-600";
                      } else if (usr.role_users === "siswa" && usr.siswa) {
                        statusProfil = "Sudah Terisi (Siswa)";
                        styleProfil = "text-green-600";
                      } else if (usr.role_users === "dudi" && usr.dudi) {
                        statusProfil = "Sudah Terisi (Dudi)";
                        styleProfil = "text-green-600";
                      } else if (usr.role_users === "admin") {
                        statusProfil = "Administrator";
                        styleProfil = "text-gray-500";
                      }

                      return (
                        <TableRow key={usr.id_users} className="bg-white">
                          <TableCell>{start + index + 1}</TableCell>
                          <TableCell className="whitespace-nowrap font-medium text-gray-900">
                            {usr.nama_users}
                          </TableCell>
                          <TableCell>{usr.email_users}</TableCell>
                           <TableCell>
                            <span className={`uppercase text-xs font-semibold px-2 py-0.5 border rounded ${
                              usr.role_users === "admin"
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : usr.role_users === "guru"
                                ? "bg-purple-50 border-purple-200 text-purple-700"
                                : usr.role_users === "siswa"
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-teal-50 border-teal-200 text-teal-700"
                            }`}>
                              {usr.role_users}
                            </span>
                          </TableCell>
                          <TableCell className={`text-xs ${styleProfil}`}>{statusProfil}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-white text-xs ${
                                usr.status_users === "aktif" ? "bg-green-500" : "bg-red-500"
                              }`}
                            >
                              {usr.status_users}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => {
                                setSelectedUser(usr);
                                setShowDetailModal(true);
                                setIsEditMode(false);
                              }}
                              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Detail
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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

      {/* ===== MODAL TAMBAH USER ===== */}
      <Modal dismissible show={showModal} size="md" onClose={() => setShowModal(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Tambah Akun User</ModalHeader>

        <ModalBody className="px-6 py-4">
          <form id="add-user-form" className="space-y-4" onSubmit={handleSimpan}>
            <div>
              <Label htmlFor="role_users">Role User</Label>
              <Select
                id="role_users"
                name="role_users"
                value={form.role_users}
                onChange={handleFormChange}
                required
              >
                <option value="admin">Admin</option>
                <option value="guru">Guru</option>
                <option value="siswa">Siswa</option>
                <option value="dudi">Dudi (Dunia Usaha & Industri)</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="nama_users">Nama Lengkap</Label>
              <TextInput
                id="nama_users"
                name="nama_users"
                value={form.nama_users}
                onChange={handleFormChange}
                placeholder="Masukkan nama lengkap user"
                required
              />
            </div>

            <div>
              <Label htmlFor="email_users">Email Login</Label>
              <TextInput
                id="email_users"
                name="email_users"
                type="email"
                value={form.email_users}
                onChange={handleFormChange}
                placeholder="Masukkan email login"
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
                  placeholder="Masukkan password akun"
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
          </form>
        </ModalBody>

        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <Button form="add-user-form" type="submit" color="blue">
            Simpan User
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

      {/* ===== MODAL DETAIL / EDIT USER ===== */}
      <Modal dismissible show={showDetailModal} size="md" onClose={() => setShowDetailModal(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          {isEditMode ? "Edit Akun User" : "Detail Akun User"}
        </ModalHeader>

        <ModalBody className="px-6 py-4">
          {selectedUser && (
            <form id="edit-user-form" className="space-y-4" onSubmit={handleUpdateUser}>
              <div>
                <Label htmlFor="edit_role_users">Role User (Terkunci)</Label>
                <TextInput
                  id="edit_role_users"
                  name="role_users"
                  value={selectedUser.role_users.toUpperCase()}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="edit_nama_users">Nama Lengkap</Label>
                <TextInput
                  id="edit_nama_users"
                  name="nama_users"
                  value={isEditMode ? form.nama_users : selectedUser.nama_users}
                  onChange={handleFormChange}
                  readOnly={!isEditMode}
                />
              </div>

              <div>
                <Label htmlFor="edit_email_users">Email Login</Label>
                <TextInput
                  id="edit_email_users"
                  name="email_users"
                  type="email"
                  value={isEditMode ? form.email_users : selectedUser.email_users}
                  onChange={handleFormChange}
                  readOnly={!isEditMode}
                />
              </div>

              {isEditMode && (
                <div>
                  <Label htmlFor="edit_password">Reset / Ganti Password</Label>
                  <TextInput
                    id="edit_password"
                    name="password"
                    type="text"
                    value={form.password}
                    onChange={handleFormChange}
                    placeholder="Kosongkan jika tidak ingin mengubah password"
                  />
                  <p className="text-gray-400 text-xs italic mt-1">
                    Masukkan password baru jika ingin mengubah password akun user ini.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="edit_status_users">Status Akun</Label>
                <Select
                  id="edit_status_users"
                  name="status_users"
                  value={isEditMode ? form.status_users : selectedUser.status_users}
                  onChange={handleFormChange}
                  disabled={!isEditMode}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </Select>
              </div>
            </form>
          )}
        </ModalBody>

        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          {!isEditMode ? (
            <>
              <Button type="button" color="blue" onClick={handleEditUser}>
                Edit Akun
              </Button>
              <Button type="button" color="red" onClick={() => setShowConfirmDelete(true)}>
                Hapus User
              </Button>
            </>
          ) : (
            <>
              <Button form="edit-user-form" type="submit" color="blue">
                Simpan Perubahan
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
            <p className="text-gray-700">
              Apakah Anda yakin ingin menghapus user{" "}
              <span className="font-semibold text-gray-900">{selectedUser?.nama_users}</span>?
            </p>
            <p className="text-xs text-gray-500">
              Menghapus user akan menghapus data profil yang bersangkutan (jika ada). Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-center gap-3 border-t border-gray-200">
          <Button
            type="button"
            color="gray"
            onClick={() => {
              setShowConfirmDelete(false);
            }}
          >
            Batal
          </Button>
          <Button type="button" color="red" onClick={handleDeleteUser}>
            Ya, Hapus
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
