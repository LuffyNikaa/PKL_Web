"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { Modal, Button, Label, TextInput, Textarea, Select, ModalHeader, ModalBody, ModalFooter, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, } from "flowbite-react";

type Guru = {
  id_guru: number;
  id_users: number;
  nama_guru: string;
  nip_guru: string;
  mapel_guru: string;
  jk_guru: string;
  alamat_guru: string;
  no_guru: string;
};

type User = {
  name: string;
  email: string;
};

const DATA_PER_PAGE = 10;

export default function DataGuruPage() {
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [selectedGuru, setSelectedGuru] = useState<Guru | null>(null);
const [showDetailModal, setShowDetailModal] = useState(false);
const [isEditMode, setIsEditMode] = useState(false)

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
  });

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
    }
  };

  useEffect(() => {
    fetchGuru();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<any>) => {
  const { name, value } = e.target;
  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};


  const handleSimpan = async () => {
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

      // reset form
      setForm({
        nama_guru: "",
        nip_guru: "",
        mapel_guru: "",
        jk_guru: "",
        alamat_guru: "",
        no_guru: "",
        email_users: "",
        password: "",
      });

    } catch (err) {
      console.error(err);
      alert(err);
    }
  };

  // Fungsi handle edit / hapus
const handleEditGuru = () => {
  if (selectedGuru) {
    setForm({
      nama_guru: selectedGuru.nama_guru,
      nip_guru: selectedGuru.nip_guru,
      mapel_guru: selectedGuru.mapel_guru,
      jk_guru: selectedGuru.jk_guru,
      alamat_guru: selectedGuru.alamat_guru,
      no_guru: selectedGuru.no_guru,
      email_users: "", // biasanya email login harus diisi, sesuaikan jika API berbeda
      password: "",
    });
    setIsEditMode(true);
  }
};

const handleDeleteGuru = async () => {
  if (!selectedGuru) return;

  if (!confirm(`Apakah Anda yakin ingin menghapus guru ${selectedGuru.nama_guru}?`)) return;

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
    setShowDetailModal(false);
    setSelectedGuru(null);
  } catch (err: any) {
    console.error(err);
    alert(err.message || err);
  }
};

// Update handleSimpan untuk edit
const handleUpdateGuru = async () => {
  if (!selectedGuru) return;

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
  } catch (err) {
    console.error(err);
    alert(err);
  }
};

  const data = gurus;
  const totalPages = Math.ceil(data.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = data.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col">
        <PageHeader pageTitle="Data Guru" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">
              Daftar Data Guru
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
                    <TableHeadCell>Mapel</TableHeadCell>
                    <TableHeadCell>Jenis Kelamin</TableHeadCell>
                    <TableHeadCell>Alamat</TableHeadCell>
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

      {/* ===== MODAL TAMBAH GURU ===== */}
      <Modal dismissible show={showModal} size="4xl" onClose={() => setShowModal(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Tambah Data Guru</ModalHeader>

        <ModalBody className="px-6 py-4">
            <form className="grid grid-cols-2 gap-4">
              <div className="space-y-5">
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
                  <Label htmlFor="no_guru">Nomor HP</Label>
                  <TextInput
                    id="no_guru"
                    name="no_guru"
                    value={form.no_guru}
                    onChange={handleFormChange}
                    placeholder="Masukkan nomor HP"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="nip_guru">NIP</Label>
                  <TextInput
                    id="nip_guru"
                    name="nip_guru"
                    value={form.nip_guru}
                    onChange={handleFormChange}
                    placeholder="Masukkan NIP"
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
            </div>

            <div className="space-y-5">
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

              <div>
                  <Label htmlFor="alamat_guru">Alamat</Label>
                  <Textarea
                    id="alamat_guru"
                    name="alamat_guru"
                    value={form.alamat_guru}
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

        <ModalBody className="px-6 py-4">
          {selectedGuru && (
          <form className="grid grid-cols-2 gap-4">
            <div className="space-y-5">
              <div>
                <Label htmlFor="nama_guru">Nama Guru</Label>
                <TextInput
                  id="nama_guru"
                  name="nama_guru"
                  value={form.nama_guru || selectedGuru.nama_guru}
                  onChange={handleFormChange}
                  readOnly={!isEditMode}
                />
              </div>

              <div>
                <Label htmlFor="nip_guru">NIP</Label>
                <TextInput
                  id="nip_guru"
                  name="nip_guru"
                  value={form.nip_guru || selectedGuru.nip_guru}
                  onChange={handleFormChange}
                  readOnly={!isEditMode}
                />
              </div>

              <div>
                <Label htmlFor="no_guru">Nomor HP</Label>
                <TextInput
                  id="no_guru"
                  name="no_guru"
                  value={form.no_guru || selectedGuru.no_guru}
                  onChange={handleFormChange}
                  readOnly={!isEditMode}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="mapel_guru">Mata Pelajaran</Label>
                <TextInput
                  id="mapel_guru"
                  name="mapel_guru"
                  value={form.mapel_guru || selectedGuru.mapel_guru}
                  onChange={handleFormChange}
                  readOnly={!isEditMode}
                />
              </div>

              <div>
                <Label htmlFor="jk_guru">Jenis Kelamin</Label>
                <Select
                  id="jk_guru"
                  name="jk_guru"
                  value={form.jk_guru || selectedGuru.jk_guru}
                  onChange={handleFormChange}
                  disabled={!isEditMode}
                >
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="alamat_guru">Alamat</Label>
                <TextInput
                  id="alamat_guru"
                  name="alamat_guru"
                  value={form.alamat_guru || selectedGuru.alamat_guru}
                  onChange={handleFormChange}
                  readOnly={!isEditMode}
                />
              </div>
            </div>
          </form>
          )}
        </ModalBody>

        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          {!isEditMode ? (
            <>
              <Button color="blue" onClick={handleEditGuru}>
                Edit
              </Button>
              <Button color="red" onClick={handleDeleteGuru}>
                Hapus
              </Button>
            </>
            ) : (
            <>
              <Button color="blue" onClick={handleUpdateGuru}>
                Simpan
              </Button>
              <Button
                color="red"
                onClick={() => {
                  setIsEditMode(false);
                  setForm({
                    nama_guru: "",
                    nip_guru: "",
                    mapel_guru: "",
                    jk_guru: "",
                    alamat_guru: "",
                    no_guru: "",
                    email_users: "",
                    password: "",
                  });
                }}
              >
                Batal
              </Button>
            </>
            )}
        </ModalFooter>
      </Modal>
    </div>
  );
}
