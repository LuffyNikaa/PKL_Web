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

type User = {
  name: string;
  email: string;
};

type Jurusan = {
  id_jurusan: number;
  nama_jurusan: string;
};

type Kelas = {
  id_kelas: number;
  tingkat_kelas: string;
  rombel: string;
  id_jurusan: number;
  jurusan?: Jurusan;
};

const DATA_PER_PAGE = 10;

const emptyJurusan = {
  nama_jurusan: "",
};

const emptyKelas = {
  tingkat_kelas: "",
  rombel: "",
  id_jurusan: "",
};

export default function DataKelasPage() {
  const [user, setUser] = useState<User | null>(null);

  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  const [pageJurusan, setPageJurusan] = useState(1);
  const [pageKelas, setPageKelas] = useState(1);

  const [showJurusanModal, setShowJurusanModal] = useState(false);
  const [showKelasModal, setShowKelasModal] = useState(false);
  const [showDetailKelas, setShowDetailKelas] = useState(false);
  const [showConfirmDeleteJurusan, setShowConfirmDeleteJurusan] = useState(false);
  const [showConfirmDeleteKelas, setShowConfirmDeleteKelas] = useState(false);

  const [selectedJurusan, setSelectedJurusan] = useState<Jurusan | null>(null);
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null);

  const [isEditJurusan, setIsEditJurusan] = useState(false);
  const [isEditKelas, setIsEditKelas] = useState(false);

  const [jurusanForm, setJurusanForm] = useState(emptyJurusan);
  const [kelasForm, setKelasForm] = useState(emptyKelas);

  const [searchKelas, setSearchKelas] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("all");

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (type: ToastItem["type"], message: string, duration = 3500) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    setToasts((s) => [...s, { id, type, message, duration }]);
  };
  const removeToast = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchJurusan = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/jurusan", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const json = await res.json();
      setJurusanList(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKelas = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/kelas", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const json = await res.json();
      setKelasList(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJurusan();
    fetchKelas();
  }, []);

  const handleJurusanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJurusanForm({
      ...jurusanForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleKelasChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setKelasForm({
      ...kelasForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleTambahJurusan = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/jurusan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jurusanForm),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchJurusan();
      setShowJurusanModal(false);
      setJurusanForm(emptyJurusan);
      pushToast("success", "Jurusan berhasil ditambahkan!");
    } catch (err: any) {
      pushToast("error", err.message);
    }
  };

  const handleTambahKelas = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    try {
      if (!kelasForm.tingkat_kelas || !kelasForm.rombel || !kelasForm.id_jurusan) {
        pushToast("error", "Semua field wajib diisi");
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/kelas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(kelasForm),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchKelas();
      setShowKelasModal(false);
      setKelasForm(emptyKelas);
      pushToast("success", "Kelas berhasil ditambahkan!");
    } catch (err: any) {
      pushToast("error", err.message);
    }
  };

  const handleUpdateJurusan = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!selectedJurusan) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8000/api/admin/jurusan/${selectedJurusan.id_jurusan}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(jurusanForm),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchJurusan();
      setShowJurusanModal(false);
      setSelectedJurusan(null);
      setIsEditJurusan(false);
      pushToast("success", "Jurusan berhasil diperbarui!");
    } catch (err: any) {
      pushToast("error", err.message);
    }
  };

  const handleUpdateKelas = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!selectedKelas) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8000/api/admin/kelas/${selectedKelas.id_kelas}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(kelasForm),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchKelas();
      setShowKelasModal(false);
      setShowDetailKelas(false);
      setSelectedKelas(null);
      setIsEditKelas(false);
      pushToast("success", "Kelas berhasil diperbarui!");
    } catch (err: any) {
      pushToast("error", err.message);
    }
  };

  const handleDeleteJurusan = async () => {
    if (!selectedJurusan) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/jurusan/${selectedJurusan.id_jurusan}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchJurusan();
      setShowConfirmDeleteJurusan(false);
      pushToast("success", "Jurusan berhasil dihapus!");
    } catch (err: any) {
      pushToast("error", err.message);
    }
  };

  const handleDeleteKelas = async () => {
    if (!selectedKelas) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/kelas/${selectedKelas.id_kelas}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchKelas();
      setShowConfirmDeleteKelas(false);
      pushToast("success", "Kelas berhasil dihapus!");
    } catch (err: any) {
      pushToast("error", err.message);
    }
  };

  // Jurusan Pagination (No search/filter)
  const totalJurusanPages = Math.ceil(jurusanList.length / DATA_PER_PAGE);
  const startJurusan = (pageJurusan - 1) * DATA_PER_PAGE;
  const currentJurusan = jurusanList.slice(startJurusan, startJurusan + DATA_PER_PAGE);

  // Kelas Filtering & Pagination
  const normalizedSearchKelas = searchKelas.trim().toLowerCase();
  const filteredKelas = kelasList.filter((k) => {
    const matchSearch =
      !normalizedSearchKelas ||
      [k.tingkat_kelas, k.rombel, k.jurusan?.nama_jurusan].some((v) =>
        (v || "").toLowerCase().includes(normalizedSearchKelas)
      );
    
    const matchFilter = filterJurusan === "all" || k.id_jurusan.toString() === filterJurusan;
    
    return matchSearch && matchFilter;
  });

  const totalKelasPages = Math.ceil(filteredKelas.length / DATA_PER_PAGE);
  const startKelas = (pageKelas - 1) * DATA_PER_PAGE;
  const currentKelas = filteredKelas.slice(startKelas, startKelas + DATA_PER_PAGE);

  // Reset page to 1 when searching or filtering
  useEffect(() => {
    setPageKelas(1);
  }, [searchKelas, filterJurusan]);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <PageHeader pageTitle="Data Kelas & Jurusan" userName={user.name} />

        <div className="p-6 space-y-6">
          {/* ================= JURUSAN ================= */}
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold font-inter">Data Jurusan</h1>

              <button
                onClick={() => {
                  setJurusanForm(emptyJurusan);
                  setIsEditJurusan(false);
                  setShowJurusanModal(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Tambah <span className="text-lg">+</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable>
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Nama Jurusan</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody className="divide-y">
                  {currentJurusan.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-400">
                        Tidak ada data jurusan
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentJurusan.map((jurusan, index) => (
                      <TableRow key={jurusan.id_jurusan}>
                        <TableCell>{startJurusan + index + 1}</TableCell>
                        <TableCell>{jurusan.nama_jurusan}</TableCell>
                        <TableCell className="text-center flex justify-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedJurusan(jurusan);
                              setJurusanForm({ nama_jurusan: jurusan.nama_jurusan });
                              setIsEditJurusan(true);
                              setShowJurusanModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSelectedJurusan(jurusan);
                              setShowConfirmDeleteJurusan(true);
                            }}
                            className="text-red-500 hover:text-red-700 font-medium text-sm"
                          >
                            Hapus
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* JURUSAN PAGINATION */}
            {totalJurusanPages > 0 && (
              <div className="mt-4 flex justify-center gap-2 text-sm font-inter">
                <button
                  onClick={() => setPageJurusan(pageJurusan - 1)}
                  disabled={pageJurusan === 1}
                  className="px-3 py-1 rounded-md border disabled:opacity-40"
                >
                  Prev
                </button>
                {Array.from({ length: totalJurusanPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPageJurusan(p)}
                    className={`px-3 py-1 rounded-md border ${
                      p === pageJurusan ? "bg-blue-500 text-white border-blue-500" : "hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPageJurusan(pageJurusan + 1)}
                  disabled={pageJurusan === totalJurusanPages}
                  className="px-3 py-1 rounded-md border disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* ================= KELAS ================= */}
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <h1 className="text-lg font-semibold font-inter">Data Kelas</h1>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                <SearchFilter
                  search={searchKelas}
                  onSearchChange={setSearchKelas}
                  filter={filterJurusan}
                  onFilterChange={setFilterJurusan}
                  filterOptions={[
                    { value: "all", label: "Semua Jurusan" },
                    ...jurusanList.map(j => ({ value: j.id_jurusan.toString(), label: j.nama_jurusan }))
                  ]}
                  placeholder="Cari kelas..."
                />
                <button
                  onClick={() => {
                    setKelasForm(emptyKelas);
                    setIsEditKelas(false);
                    setShowKelasModal(true);
                  }}
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap"
                >
                  Tambah <span className="text-lg">+</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable>
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Tingkat Kelas</TableHeadCell>
                    <TableHeadCell>Jurusan</TableHeadCell>
                    <TableHeadCell>Rombel</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody className="divide-y">
                  {currentKelas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                        Tidak ada data kelas
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentKelas.map((kelas, index) => (
                      <TableRow key={kelas.id_kelas}>
                        <TableCell>{startKelas + index + 1}</TableCell>
                        <TableCell>{kelas.tingkat_kelas}</TableCell>
                        <TableCell>{kelas.jurusan?.nama_jurusan || "-"}</TableCell>
                        <TableCell>{kelas.rombel}</TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => {
                              setSelectedKelas(kelas);
                              setKelasForm({
                                tingkat_kelas: kelas.tingkat_kelas,
                                rombel: kelas.rombel,
                                id_jurusan: kelas.id_jurusan.toString(),
                              });
                              setIsEditKelas(false);
                              setShowDetailKelas(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 font-medium text-sm"
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

            {/* KELAS PAGINATION */}
            {totalKelasPages > 0 && (
              <div className="mt-4 flex justify-center gap-2 text-sm font-inter">
                <button
                  onClick={() => setPageKelas(pageKelas - 1)}
                  disabled={pageKelas === 1}
                  className="px-3 py-1 rounded-md border disabled:opacity-40"
                >
                  Prev
                </button>
                {Array.from({ length: totalKelasPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPageKelas(p)}
                    className={`px-3 py-1 rounded-md border ${
                      p === pageKelas ? "bg-blue-500 text-white border-blue-500" : "hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPageKelas(pageKelas + 1)}
                  disabled={pageKelas === totalKelasPages}
                  className="px-3 py-1 rounded-md border disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TOAST CONTAINER */}
        <Toast items={toasts} onRemove={removeToast} />
      </main>

      {/* ================= MODAL JURUSAN ================= */}
      <Modal dismissible show={showJurusanModal} size="md" onClose={() => setShowJurusanModal(false)}>
        <ModalHeader>{isEditJurusan ? "Edit Jurusan" : "Tambah Jurusan"}</ModalHeader>
          <ModalBody>
            <form id="jurusan-form" onSubmit={isEditJurusan ? handleUpdateJurusan : handleTambahJurusan}>
              <div>
                <Label>Nama Jurusan</Label>
                <TextInput
                  name="nama_jurusan"
                  value={jurusanForm.nama_jurusan}
                  onChange={handleJurusanChange}
                  placeholder="Masukkan nama jurusan"
                  required
                />
              </div>
            </form>
          </ModalBody>
          <ModalFooter className="flex justify-between">
            <Button form="jurusan-form" type="submit" color="blue">Simpan</Button>
            <Button color="red" onClick={() => setShowJurusanModal(false)}>Batal</Button>
          </ModalFooter>
      </Modal>

      {/* ================= MODAL KELAS ================= */}
      <Modal dismissible show={showKelasModal} size="xl" onClose={() => setShowKelasModal(false)}>
        <ModalHeader>{isEditKelas ? "Edit Kelas" : "Tambah Kelas"}</ModalHeader>
        <ModalBody>
          <form id="kelas-form" onSubmit={isEditKelas ? handleUpdateKelas : handleTambahKelas}>
            <div className="space-y-4">
              <div>
                <Label>Tingkat Kelas</Label>
                <Select
                  name="tingkat_kelas"
                  value={kelasForm.tingkat_kelas}
                  onChange={handleKelasChange}
                  required
                >
                  <option value="">Pilih Tingkat</option>
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </Select>
              </div>
              <div>
                <Label>Jurusan</Label>
                <Select
                  name="id_jurusan"
                  value={kelasForm.id_jurusan}
                  onChange={handleKelasChange}
                  required
                >
                  <option value="">Pilih Jurusan</option>
                  {jurusanList.map((jurusan) => (
                    <option key={jurusan.id_jurusan} value={jurusan.id_jurusan}>
                      {jurusan.nama_jurusan}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Rombel</Label>
                <TextInput
                  name="rombel"
                  value={kelasForm.rombel}
                  onChange={handleKelasChange}
                  placeholder="Contoh: 1"
                  required
                />
              </div>
            </div>
          </form>
        </ModalBody>
        <ModalFooter className="flex justify-between">
          <Button form="kelas-form" type="submit" color="blue">Simpan</Button>
          <Button color="red" onClick={() => setShowKelasModal(false)}>Batal</Button>
        </ModalFooter>
      </Modal>
      {/* ================= MODAL DETAIL KELAS ================= */}
      <Modal dismissible show={showDetailKelas} size="xl" onClose={() => setShowDetailKelas(false)}>
        <ModalHeader>{isEditKelas ? "Edit Data Kelas" : "Detail Data Kelas"}</ModalHeader>
        <ModalBody>
          {selectedKelas && (
            <div className="space-y-4">
              <div>
                <Label>Tingkat Kelas</Label>
                <Select
                  name="tingkat_kelas"
                  value={isEditKelas ? kelasForm.tingkat_kelas : selectedKelas.tingkat_kelas}
                  onChange={handleKelasChange}
                  disabled={!isEditKelas}
                >
                  <option value="">Pilih Tingkat</option>
                  <option value="X">X</option>
                  <option value="XI">XI</option>
                  <option value="XII">XII</option>
                </Select>
              </div>
              <div>
                <Label>Jurusan</Label>
                <Select
                  name="id_jurusan"
                  value={isEditKelas ? kelasForm.id_jurusan : selectedKelas.id_jurusan.toString()}
                  onChange={handleKelasChange}
                  disabled={!isEditKelas}
                >
                  <option value="">Pilih Jurusan</option>
                  {jurusanList.map((jurusan) => (
                    <option key={jurusan.id_jurusan} value={jurusan.id_jurusan}>
                      {jurusan.nama_jurusan}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Rombel</Label>
                <TextInput
                  name="rombel"
                  value={isEditKelas ? kelasForm.rombel : selectedKelas.rombel}
                  onChange={handleKelasChange}
                  readOnly={!isEditKelas}
                  placeholder="Contoh: 1"
                />
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="flex justify-between">
          {!isEditKelas ? (
            <>
              <Button color="blue" onClick={() => setIsEditKelas(true)}>Edit</Button>
              <Button color="red" onClick={() => {
                setShowDetailKelas(false);
                setShowConfirmDeleteKelas(true);
              }}>Hapus</Button>
            </>
          ) : (
            <>
              <Button color="blue" onClick={handleUpdateKelas}>Simpan</Button>
              <Button color="red" onClick={() => {
                setIsEditKelas(false);
                if (selectedKelas) {
                  setKelasForm({
                    tingkat_kelas: selectedKelas.tingkat_kelas,
                    rombel: selectedKelas.rombel,
                    id_jurusan: selectedKelas.id_jurusan.toString(),
                  });
                }
              }}>Batal</Button>
            </>
          )}
        </ModalFooter>
      </Modal>

      {/* ===== MODAL KONFIRMASI HAPUS JURUSAN ===== */}
      <Modal dismissible show={showConfirmDeleteJurusan} size="sm" onClose={() => setShowConfirmDeleteJurusan(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Konfirmasi Hapus</ModalHeader>
        <ModalBody className="px-6 py-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-inter">
              Apakah Anda yakin ingin menghapus jurusan{" "}
              <span className="font-semibold text-gray-900">{selectedJurusan?.nama_jurusan}</span>?
            </p>
            <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-center gap-3 border-t border-gray-200">
          <Button color="gray" onClick={() => setShowConfirmDeleteJurusan(false)}>Batal</Button>
          <Button color="red" onClick={handleDeleteJurusan}>Ya, Hapus</Button>
        </ModalFooter>
      </Modal>

      {/* ===== MODAL KONFIRMASI HAPUS KELAS ===== */}
      <Modal dismissible show={showConfirmDeleteKelas} size="sm" onClose={() => setShowConfirmDeleteKelas(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Konfirmasi Hapus</ModalHeader>
        <ModalBody className="px-6 py-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-inter">
              Apakah Anda yakin ingin menghapus kelas{" "}
              <span className="font-semibold text-gray-900">{selectedKelas?.tingkat_kelas} {selectedKelas?.jurusan?.nama_jurusan} {selectedKelas?.rombel}</span>?
            </p>
            <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-center gap-3 border-t border-gray-200">
          <Button color="gray" onClick={() => setShowConfirmDeleteKelas(false)}>Batal</Button>
          <Button color="red" onClick={handleDeleteKelas}>Ya, Hapus</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}