"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { Modal, Button, Label, TextInput, Select, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";

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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-inter">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-4 py-2">No</th>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Mapel</th>
                    <th className="px-4 py-2">Jenis Kelamin</th>
                    <th className="px-4 py-2">Alamat</th>
                    <th className="px-4 py-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((guru, index) => (
                    <tr key={guru.id_guru} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{start + index + 1}</td>
                      <td className="px-4 py-2">{guru.nama_guru}</td>
                      <td className="px-4 py-2">{guru.mapel_guru}</td>
                      <td className="px-4 py-2">{guru.jk_guru}</td>
                      <td className="px-4 py-2">{guru.alamat_guru}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                            onClick={() => {
                            setSelectedGuru(guru);
                            setShowDetailModal(true);
                            setIsEditMode(false);
                            }}
                            className="text-blue-500 hover:underline"
                        >
                            Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      <Modal show={showModal} size="lg" popup={true} onClose={() => setShowModal(false)}>
        <ModalHeader>
            Tambah Data Guru
        </ModalHeader>

        <ModalBody>
            <form className="flex flex-col gap-4">
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
                value={form.nip_guru}
                onChange={handleFormChange}
                placeholder="Masukkan NIP"
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
                <TextInput
                id="alamat_guru"
                name="alamat_guru"
                value={form.alamat_guru}
                onChange={handleFormChange}
                placeholder="Masukkan alamat"
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
            </form>
        </ModalBody>

        <ModalFooter className="flex justify-between">
            <Button onClick={handleSimpan} color="blue">
                Simpan
            </Button>
            <Button onClick={() => setShowModal(false)} color="red">
                Batal
            </Button>
        </ModalFooter>
        </Modal>

        <Modal
            show={showDetailModal}
            size="lg"
            popup={true}
            onClose={() => setShowDetailModal(false)}
            >
            <div className="flex items-center justify-between p-4 rounded-t dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditMode || !selectedGuru ? "Edit Data Guru" : "Detail Data Guru"}
            </h3>
            <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
            >
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
                <span className="sr-only">Close modal</span>
            </button>
            </div>

            <ModalBody>
                <form className="flex flex-col gap-4">
                {selectedGuru && (
                    <>
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
                    </>
                )}
                </form>
            </ModalBody>

            <ModalFooter className="flex justify-between">
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
