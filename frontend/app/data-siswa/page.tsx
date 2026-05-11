"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { Modal, Button, Label, TextInput, Textarea, Select, ModalHeader, ModalBody, ModalFooter, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, } from "flowbite-react";

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

const DATA_PER_PAGE = 10;

export default function DataSiswaPage() {
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // modal state
  const [showModal, setShowModal] = useState(false);

  // form state
  const [form, setForm] = useState({
    nama_siswa: "",
    nis_siswa: "",
    jk_siswa: "",
    alamat_siswa: "",
    no_siswa: "",
    email: "",
    password: "",
    status_users: "aktif",
    id_kelas: "",
  });

  const emptyForm = {
    nama_siswa: "",
    nis_siswa: "",
    jk_siswa: "",  // Kosong, bukan undefined
    alamat_siswa: "",
    no_siswa: "",
    email: "",
    password: "",
    status_users: "aktif",
    id_kelas: "",
  };

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
    
    // Cek struktur response API Anda
    console.log("Response API Siswa:", json);
    
    // Sesuaikan dengan struktur API Anda (dari screenshot, data langsung di root)
    const siswaArray = json.data || json; // Ubah ini sesuai struktur
    
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
    
    console.log("Response API Kelas:", json);
    
    const kelasArray = json.data || json;
    setKelas(kelasArray);
  } catch (error) {
    console.error("Fetch kelas error:", error);
  }
};

  useEffect(() => {
    fetchSiswa();
    fetchKelas();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSimpan = async () => {
  // Validasi dasar
  if (!form.nama_siswa || !form.email || !form.password || !form.id_kelas) {
    alert("Mohon lengkapi semua field yang wajib!");
    return;
  }

  if (form.password.length < 6) {
    alert("Password minimal 6 karakter!");
    return;
  }

  // Validasi jenis kelamin harus dipilih
  if (!form.jk_siswa) {
    alert("Jenis kelamin harus dipilih!");
    return;
  }

  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("Token tidak ditemukan. Silakan login kembali.");
      return;
    }

    // Pastikan semua data adalah string yang sudah di-trim
    const dataToSend = {
      nama_siswa: String(form.nama_siswa).trim(),
      nis_siswa: String(form.nis_siswa).trim(),
      jk_siswa: String(form.jk_siswa).trim(),  // Pasti akan jadi "laki-laki" atau "perempuan"
      alamat_siswa: String(form.alamat_siswa).trim(),
      no_siswa: String(form.no_siswa).trim(),
      email: String(form.email).trim(),
      password: String(form.password),
      status_users: String(form.status_users),
      id_kelas: parseInt(form.id_kelas)
    };

    // Debug: lihat data yang akan dikirim
    console.log("Data yang dikirim:", JSON.stringify(dataToSend, null, 2));

    const res = await fetch("http://localhost:8000/api/admin/siswa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(dataToSend),
    });

    const json = await res.json();
    console.log("Status response:", res.status);
    console.log("Data response:", json);

    if (!res.ok) {
      if (json.errors) {
        const errorMessages = Object.values(json.errors).flat().join('\n');
        throw new Error(`Validasi gagal:\n${errorMessages}`);
      } else if (json.message) {
        throw new Error(json.message);
      } else {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
    }

    alert("Data siswa berhasil ditambahkan!");
    fetchSiswa();
    setShowModal(false);
    setForm(emptyForm);
    
  } catch (err: any) {
    console.error("Error detail:", err);
    alert(`Error: ${err.message || err}`);
  }
};

  // Fungsi handle edit / hapus
  const handleEditSiswa = () => {
    if (selectedSiswa) {
      setForm({
        nama_siswa: selectedSiswa.nama_siswa,
        nis_siswa: selectedSiswa.nis_siswa,
        jk_siswa: selectedSiswa.jk_siswa,
        alamat_siswa: selectedSiswa.alamat_siswa,
        no_siswa: selectedSiswa.no_siswa,
        email: "", // biasanya email login harus diisi, sesuaikan jika API berbeda
        password: "",
        status_users: selectedSiswa.user?.status_users || "aktif",
        id_kelas: selectedSiswa.id_kelas.toString(),
      });
      setIsEditMode(true);
    }
  };

  const handleDeleteSiswa = async () => {
    if (!selectedSiswa) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus siswa ${selectedSiswa.nama_siswa}?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/siswa/${selectedSiswa.id_siswa}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        },
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Gagal menghapus siswa");

      fetchSiswa();
      setShowDetailModal(false);
      setSelectedSiswa(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || err);
    }
  };

  // Update handleSimpan untuk edit
  const handleUpdateSiswa = async () => {
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
    } catch (err) {
      console.error(err);
      alert(err);
    }
  };

  const data = siswa;
  const totalPages = Math.ceil(data.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = data.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Data Siswa" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">
              Daftar Data Siswa
            </h1>

            <button
              onClick={() => setShowModal(true)}
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
                    <TableHeadCell>Jenis Kelamin</TableHeadCell>
                    <TableHeadCell>Alamat</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody className="divide-y">
                  {currentData.map((siswa, index) => (
                    <TableRow
                      key={siswa.id_siswa}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                      <TableCell>{start + index + 1}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {siswa.nama_siswa}
                      </TableCell>
                      <TableCell>{siswa.nis_siswa}</TableCell>
                      <TableCell>
                        {siswa.kelas
                          ? `${siswa.kelas.tingkat_kelas} ${siswa.kelas.rombel} ${siswa.kelas.jurusan?.nama_jurusan || ''}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{siswa.jk_siswa}</TableCell>
                      <TableCell>{siswa.alamat_siswa}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-white text-xs ${
                            siswa.user?.status_users === "aktif"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        >
                          {siswa.user?.status_users}
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

      {/* ===== MODAL TAMBAH SISWA ===== */}
      <Modal dismissible show={showModal} size="4xl" onClose={() => setShowModal(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Tambah Data Siswa</ModalHeader>

        <ModalBody className="px-6 py-4">
          <form className="grid grid-cols-2 gap-4">
            <div className="space-y-5">
              <div>
                <Label htmlFor="nama_siswa">Nama Siswa</Label>
                <TextInput
                  id="nama_siswa"
                  name="nama_siswa"
                  value={form.nama_siswa}
                  onChange={handleFormChange}
                  placeholder="Masukkan nama siswa"
                  required
                />
              </div>

              <div>
                <Label htmlFor="nis_siswa">NIS</Label>
                <TextInput
                  id="nis_siswa"
                  name="nis_siswa"
                  value={form.nis_siswa}
                  onChange={handleFormChange}
                  placeholder="Masukkan NIS"
                  required
                />
              </div>

              <div>
                <Label htmlFor="no_siswa">Nomor HP</Label>
                <TextInput
                  id="no_siswa"
                  name="no_siswa"
                  value={form.no_siswa}
                  onChange={handleFormChange}
                  placeholder="Masukkan nomor HP"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Login</Label>
                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="Masukkan email login"
                  required
                />
              </div>

              <div>
                <Label htmlFor="id_kelas">Kelas</Label>
                <Select
                  id="id_kelas"
                  name="id_kelas"
                  value={form.id_kelas}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Pilih kelas</option>
                  {kelas.map((k) => (
                    <option key={k.id_kelas} value={k.id_kelas}>
                      {k.tingkat_kelas} {k.rombel} {k.jurusan?.nama_jurusan || ''}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="jk_siswa">Jenis Kelamin</Label>
                <Select
                  id="jk_siswa"
                  name="jk_siswa"
                  value={form.jk_siswa}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">-- Pilih Jenis Kelamin --</option>  {/* Tambahkan ini */}
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
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
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <TextInput
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder="Masukkan password"
                  required
                />
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
          </form>
        </ModalBody>

        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <Button onClick={handleSimpan} color="blue">
            Simpan
          </Button>
          <Button onClick={() => setShowModal(false)} color="red">
            Batal
          </Button>
        </ModalFooter>
      </Modal>

      {/* ===== MODAL DETAIL / EDIT SISWA ===== */}
      <Modal
        dismissible
        show={showDetailModal}
        size="4xl"
        onClose={() => setShowDetailModal(false)}
      >
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          {isEditMode ? "Edit Data Siswa" : "Detail Data Siswa"}
        </ModalHeader>

        <ModalBody className="px-6 py-4">
          {selectedSiswa && (
            <>
              {isEditMode ? (
                <form className="grid grid-cols-2 gap-4">
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="nama_siswa">Nama Siswa</Label>
                      <TextInput
                        id="nama_siswa"
                        name="nama_siswa"
                        value={form.nama_siswa}
                        onChange={handleFormChange}
                        readOnly={!isEditMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="nis_siswa">NIS</Label>
                      <TextInput
                        id="nis_siswa"
                        name="nis_siswa"
                        value={form.nis_siswa}
                        onChange={handleFormChange}
                        readOnly={!isEditMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="no_siswa">Nomor HP</Label>
                      <TextInput
                        id="no_siswa"
                        name="no_siswa"
                        value={form.no_siswa}
                        onChange={handleFormChange}
                        readOnly={!isEditMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="id_kelas">Kelas</Label>
                      <Select
                        id="id_kelas"
                        name="id_kelas"
                        value={form.id_kelas}
                        onChange={handleFormChange}
                        disabled={!isEditMode}
                      >
                        <option value="">Pilih kelas</option>
                        {kelas.map((k) => (
                          <option key={k.id_kelas} value={k.id_kelas}>
                            {k.tingkat_kelas} {k.rombel} {k.jurusan?.nama_jurusan || ''}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="jk_siswa">Jenis Kelamin</Label>
                      <Select
                        id="jk_siswa"
                        name="jk_siswa"
                        value={form.jk_siswa}
                        onChange={handleFormChange}
                        disabled={!isEditMode}
                      >
                        <option value="laki-laki">Laki-laki</option>
                        <option value="perempuan">Perempuan</option>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="alamat_siswa">Alamat</Label>
                      <Textarea
                        id="alamat_siswa"
                        name="alamat_siswa"
                        value={form.alamat_siswa}
                        onChange={handleFormChange}
                        readOnly={!isEditMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="status_users">Status Akun</Label>
                      <Select
                        id="status_users"
                        name="status_users"
                        value={form.status_users}
                        onChange={handleFormChange}
                        disabled={!isEditMode}
                      >
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                      </Select>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Nama Siswa</Label>
                      <p className="text-gray-900 font-medium">{selectedSiswa.nama_siswa}</p>
                    </div>

                    <div>
                      <Label>NIS</Label>
                      <p className="text-gray-900 font-medium">{selectedSiswa.nis_siswa}</p>
                    </div>

                    <div>
                      <Label>Nomor HP</Label>
                      <p className="text-gray-900 font-medium">{selectedSiswa.no_siswa}</p>
                    </div>

                    <div>
                      <Label>Email</Label>
                      <p className="text-gray-900 font-medium">{selectedSiswa.user?.email_users}</p>
                    </div>

                    <div>
                      <Label>Kelas</Label>
                      <p className="text-gray-900 font-medium">
                        {selectedSiswa.kelas
                          ? `${selectedSiswa.kelas.tingkat_kelas} ${selectedSiswa.kelas.rombel} ${selectedSiswa.kelas.jurusan?.nama_jurusan || ''}`
                          : '-'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Jenis Kelamin</Label>
                      <p className="text-gray-900 font-medium">{selectedSiswa.jk_siswa}</p>
                    </div>

                    <div>
                      <Label>Alamat</Label>
                      <p className="text-gray-900 font-medium">{selectedSiswa.alamat_siswa}</p>
                    </div>

                    <div>
                      <Label>Status Akun</Label>
                      <span
                        className={`px-2 py-1 rounded text-white text-xs ${
                          selectedSiswa.user?.status_users === "aktif"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        {selectedSiswa.user?.status_users}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          {isEditMode ? (
            <>
              <Button onClick={handleUpdateSiswa} color="blue">
                Update
              </Button>
              <Button
                onClick={() => {
                  setIsEditMode(false);
                  setForm(emptyForm);
                }}
                color="gray"
              >
                Batal Edit
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleEditSiswa} color="blue">
                Edit
              </Button>
              <Button onClick={handleDeleteSiswa} color="red">
                Hapus
              </Button>
            </>
          )}
          <Button
            onClick={() => {
              setShowDetailModal(false);
              setSelectedSiswa(null);
              setIsEditMode(false);
              setForm(emptyForm);
            }}
            color="gray"
          >
            Tutup
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}