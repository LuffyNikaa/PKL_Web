"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { Modal, Button, Label, TextInput, Select, ModalHeader, ModalBody, ModalFooter } from "flowbite-react";

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

type User = {
  name: string;
  email: string;
};

const DATA_PER_PAGE = 10;

export default function DataSiswaPage() {
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [dudiList, setDudiList] = useState<Dudi[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // modal state
  const [showModal, setShowModal] = useState(false);

  // form state
  const [form, setForm] = useState({
    nama_siswa: "",
    email: "",
    password: "",
    jk_siwa: "",
    jurusan_siswa: "",
    kelas_siswa: "",
    nis_siswa: "",
    alamat_siswa: "",
    no_siswa: "",
    id_dudi: "",
  });

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
      const siswaArray = json.data || [];
      setSiswaList(siswaArray);
    } catch (error) {
      console.error("Fetch siswa error:", error);
    }
  };

  const fetchDudi = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:8000/api/admin/dudi", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      const dudiArray = json.data?.data || json.data || [];
      setDudiList(dudiArray);
    } catch (error) {
      console.error("Fetch dudi error:", error);
    }
  };

  useEffect(() => {
    fetchSiswa();
    fetchDudi();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSimpan = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/siswa", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menambahkan siswa");

      // refresh tabel
      fetchSiswa();
      setShowModal(false);

      // reset form
      setForm({
        nama_siswa: "",
        email: "",
        password: "",
        jk_siwa: "",
        jurusan_siswa: "",
        kelas_siswa: "",
        nis_siswa: "",
        alamat_siswa: "",
        no_siswa: "",
        id_dudi: "",
      });

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal menambahkan siswa");
    }
  };

  const handleEditSiswa = () => {
    if (selectedSiswa) {
      setForm({
        nama_siswa: selectedSiswa.nama_siswa,
        email: "",
        password: "",
        jk_siwa: selectedSiswa.jk_siwa,
        jurusan_siswa: selectedSiswa.jurusan_siswa,
        kelas_siswa: selectedSiswa.kelas_siswa,
        nis_siswa: selectedSiswa.nis_siswa,
        alamat_siswa: selectedSiswa.alamat_siswa,
        no_siswa: selectedSiswa.no_siswa,
        id_dudi: selectedSiswa.id_dudi.toString(),
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
        body: JSON.stringify({
          nama_siswa: form.nama_siswa,
          jk_siwa: form.jk_siwa,
          jurusan_siswa: form.jurusan_siswa,
          kelas_siswa: form.kelas_siswa,
          alamat_siswa: form.alamat_siswa,
          no_siswa: form.no_siswa,
          id_dudi: form.id_dudi,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memperbarui siswa");

      fetchSiswa();
      setShowDetailModal(false);
      setSelectedSiswa(null);
      setIsEditMode(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal memperbarui siswa");
    }
  };

  const data = siswaList;
  const totalPages = Math.ceil(data.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = data.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col">
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-inter">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-4 py-2">No</th>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Alamat</th>
                    <th className="px-4 py-2">Jenis Kelamin</th>
                    <th className="px-4 py-2">Jurursan</th>
                    <th className="px-4 py-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((siswa, index) => (
                    <tr key={siswa.id_siswa} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{start + index + 1}</td>
                      <td className="px-4 py-2">{siswa.nama_siswa}</td>
                      <td className="px-4 py-2">{siswa.alamat_siswa}</td>
                      <td className="px-4 py-2">{siswa.jk_siwa}</td>
                      <td className="px-4 py-2">{siswa.jurusan_siswa}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedSiswa(siswa);
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

      {/* ===== MODAL TAMBAH SISWA ===== */}
      <Modal show={showModal} size="lg" popup={true} onClose={() => setShowModal(false)}>
        <ModalHeader>
          Tambah Data Siswa
        </ModalHeader>

        <ModalBody>
          <form className="flex flex-col gap-4">
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
              <Label htmlFor="jk_siwa">Jenis Kelamin</Label>
              <Select
                id="jk_siwa"
                name="jk_siwa"
                value={form.jk_siwa}
                onChange={handleFormChange}
                required
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="jurusan_siswa">Jurusan</Label>
              <TextInput
                id="jurusan_siswa"
                name="jurusan_siswa"
                value={form.jurusan_siswa}
                onChange={handleFormChange}
                placeholder="Masukkan jurusan"
                required
              />
            </div>

            <div>
              <Label htmlFor="kelas_siswa">Kelas</Label>
              <TextInput
                id="kelas_siswa"
                name="kelas_siswa"
                value={form.kelas_siswa}
                onChange={handleFormChange}
                placeholder="Contoh: XII RPL 1"
                required
              />
            </div>

            <div>
              <Label htmlFor="alamat_siswa">Alamat</Label>
              <TextInput
                id="alamat_siswa"
                name="alamat_siswa"
                value={form.alamat_siswa}
                onChange={handleFormChange}
                placeholder="Masukkan alamat"
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
              <Label htmlFor="id_dudi">DUDI</Label>
              <Select
                id="id_dudi"
                name="id_dudi"
                value={form.id_dudi}
                onChange={handleFormChange}
                required
              >
                <option value="">Pilih DUDI</option>
                {dudiList.map((dudi) => (
                  <option key={dudi.id_dudi} value={dudi.id_dudi}>
                    {dudi.nama_dudi}
                  </option>
                ))}
              </Select>
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

      {/* ===== MODAL DETAIL/EDIT SISWA ===== */}
      <Modal
        show={showDetailModal}
        size="lg"
        popup={true}
        onClose={() => setShowDetailModal(false)}
      >
        <div className="flex items-center justify-between p-4 rounded-t dark:border-gray-600">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditMode || !selectedSiswa ? "Edit Data Siswa" : "Detail Data Siswa"}
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
            {selectedSiswa && (
              <>
                <div>
                  <Label htmlFor="nama_siswa">Nama Siswa</Label>
                  <TextInput
                    id="nama_siswa"
                    name="nama_siswa"
                    value={form.nama_siswa || selectedSiswa.nama_siswa}
                    onChange={handleFormChange}
                    readOnly={!isEditMode}
                  />
                </div>

                <div>
                  <Label htmlFor="nis_siswa">NIS</Label>
                  <TextInput
                    id="nis_siswa"
                    name="nis_siswa"
                    value={form.nis_siswa || selectedSiswa.nis_siswa}
                    onChange={handleFormChange}
                    readOnly={true}
                  />
                </div>

                <div>
                  <Label htmlFor="jk_siwa">Jenis Kelamin</Label>
                  <Select
                    id="jk_siwa"
                    name="jk_siwa"
                    value={form.jk_siwa || selectedSiswa.jk_siwa}
                    onChange={handleFormChange}
                    disabled={!isEditMode}
                  >
                    <option value="laki-laki">Laki-laki</option>
                    <option value="perempuan">Perempuan</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="jurusan_siswa">Jurusan</Label>
                  <TextInput
                    id="jurusan_siswa"
                    name="jurusan_siswa"
                    value={form.jurusan_siswa || selectedSiswa.jurusan_siswa}
                    onChange={handleFormChange}
                    readOnly={!isEditMode}
                  />
                </div>

                <div>
                  <Label htmlFor="kelas_siswa">Kelas</Label>
                  <TextInput
                    id="kelas_siswa"
                    name="kelas_siswa"
                    value={form.kelas_siswa || selectedSiswa.kelas_siswa}
                    onChange={handleFormChange}
                    readOnly={!isEditMode}
                  />
                </div>

                <div>
                  <Label htmlFor="alamat_siswa">Alamat</Label>
                  <TextInput
                    id="alamat_siswa"
                    name="alamat_siswa"
                    value={form.alamat_siswa || selectedSiswa.alamat_siswa}
                    onChange={handleFormChange}
                    readOnly={!isEditMode}
                  />
                </div>

                <div>
                  <Label htmlFor="no_siswa">Nomor HP</Label>
                  <TextInput
                    id="no_siswa"
                    name="no_siswa"
                    value={form.no_siswa || selectedSiswa.no_siswa}
                    onChange={handleFormChange}
                    readOnly={!isEditMode}
                  />
                </div>

                <div>
                  <Label htmlFor="id_dudi">DUDI</Label>
                  <Select
                    id="id_dudi"
                    name="id_dudi"
                    value={form.id_dudi || selectedSiswa.id_dudi.toString()}
                    onChange={handleFormChange}
                    disabled={!isEditMode}
                  >
                    {dudiList.map((dudi) => (
                      <option key={dudi.id_dudi} value={dudi.id_dudi}>
                        {dudi.nama_dudi}
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            )}
          </form>
        </ModalBody>

        <ModalFooter className="flex justify-between">
          {!isEditMode ? (
            <>
              <Button color="blue" onClick={handleEditSiswa}>
                Edit
              </Button>
              <Button color="red" onClick={handleDeleteSiswa}>
                Hapus
              </Button>
            </>
          ) : (
            <>
              <Button color="blue" onClick={handleUpdateSiswa}>
                Simpan
              </Button>
              <Button
                color="red"
                onClick={() => {
                  setIsEditMode(false);
                  setForm({
                    nama_siswa: "",
                    email: "",
                    password: "",
                    jk_siwa: "",
                    jurusan_siswa: "",
                    kelas_siswa: "",
                    nis_siswa: "",
                    alamat_siswa: "",
                    no_siswa: "",
                    id_dudi: "",
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