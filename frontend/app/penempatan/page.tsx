"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import SearchFilter from "../components/SearchFilter";
import Toast, { ToastItem } from "../components/Toast";
import {
  Modal, Button, Label, Select,
  ModalHeader, ModalBody, ModalFooter,
  Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow,
} from "flowbite-react";

type Siswa = {
  id_siswa: number;
  nama_siswa: string;
  user?: {
    name: string;
    email: string;
  };
  kelas?: {
    tingkat_kelas: string;
    rombel: number;
    jurusan?: {
      nama_jurusan: string;
    };
  };
};

type Dudi = {
  id_dudi: number;
  nama_dudi: string;
};

type Guru = {
  id_guru: number;
  nama_guru: string;
};

type Periode = {
  id_periode: number;
  nama_periode: string;
};

type Penempatan = {
  id_penempatan: number;
  id_siswa: number;
  id_dudi: number;
  id_guru: number;
  id_periode: number;
  siswa?: Siswa;
  dudi?: Dudi;
  guru?: Guru;
  periode?: Periode;
};

type User = { name: string; email: string };

const DATA_PER_PAGE = 10;

const emptyForm = {
  id_siswa: "",
  id_dudi: "",
  id_guru: "",
  id_periode: "",
};

export default function PenempatanPage() {
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [penempatanList, setPenempatanList] = useState<Penempatan[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [dudiList, setDudiList] = useState<Dudi[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [selectedPenempatan, setSelectedPenempatan] = useState<Penempatan | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("all");

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (type: ToastItem["type"], message: string, duration = 3500) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    setToasts((s) => [...s, { id, type, message, duration }]);
  };
  const removeToast = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const fetchPenempatan = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/admin/penempatan", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setPenempatanList(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
      try {
        const [resP, resS, resD, resG, resPer] = await Promise.all([
          fetch("http://localhost:8000/api/admin/penempatan", { headers }),
          fetch("http://localhost:8000/api/admin/siswa", { headers }),
          fetch("http://localhost:8000/api/admin/dudi", { headers }),
          fetch("http://localhost:8000/api/admin/guru", { headers }),
          fetch("http://localhost:8000/api/admin/periode", { headers }),
        ]);

        const [jsonP, jsonS, jsonD, jsonG, jsonPer] = await Promise.all([
          resP.json(), resS.json(), resD.json(), resG.json(), resPer.json()
        ]);

        setPenempatanList(jsonP.data || []);
        setSiswaList(jsonS.data || []);
        setDudiList(jsonD.data || []);
        setGuruList(jsonG.data || []);
        setPeriodeList(jsonPer.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadAllData();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation(); // Tambahkan ini
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddPenempatan = () => {
    setForm(emptyForm);
    setIsEditMode(false);
    setSelectedPenempatan(null);
    setShowModal(true);
  };

  const handleEditPenempatan = (penempatan: Penempatan, fromDetail: boolean = false) => {
    setForm({
      id_siswa: penempatan.id_siswa.toString(),
      id_dudi: penempatan.id_dudi.toString(),
      id_guru: penempatan.id_guru.toString(),
      id_periode: penempatan.id_periode.toString(),
    });
    setIsEditMode(true);
    setSelectedPenempatan(penempatan);
    if (fromDetail) {
      setShowDetailModal(true);
    } else {
      setShowModal(true);
    }
  };

  const handleViewDetail = (penempatan: Penempatan) => {
    setSelectedPenempatan(penempatan);
    setIsEditMode(false);
    setShowDetailModal(true);
  };

  const handleSimpan = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Validasi form
    if (!form.id_siswa || !form.id_dudi || !form.id_guru || !form.id_periode) {
      pushToast("error", "Semua field harus diisi!");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `http://localhost:8000/api/admin/penempatan/${selectedPenempatan?.id_penempatan}`
        : "http://localhost:8000/api/admin/penempatan";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      await fetchPenempatan();
      setShowModal(false);
      setShowDetailModal(false);
      setForm(emptyForm);
      setIsEditMode(false);
      setSelectedPenempatan(null);
      pushToast("success", isEditMode ? "Penempatan berhasil diperbarui!" : "Penempatan berhasil ditambahkan!");
    } catch (err: any) {
      console.error(err);
      pushToast("error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPenempatan) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/penempatan/${selectedPenempatan.id_penempatan}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Gagal menghapus penempatan");

      await fetchPenempatan();
      setShowConfirmDelete(false);
      setShowDetailModal(false);
      setSelectedPenempatan(null);
      pushToast("success", "Penempatan berhasil dihapus!");
    } catch (err: any) {
      console.error(err);
      pushToast("error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowDetailModal(false);
    setIsEditMode(false);
    setForm(emptyForm);
    setSelectedPenempatan(null);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (selectedPenempatan) {
      setForm({
        id_siswa: selectedPenempatan.id_siswa.toString(),
        id_dudi: selectedPenempatan.id_dudi.toString(),
        id_guru: selectedPenempatan.id_guru.toString(),
        id_periode: selectedPenempatan.id_periode.toString(),
      });
    } else {
      setForm(emptyForm);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredData = penempatanList.filter((item) => {
    const matchSearch =
      !normalizedSearch ||
      (item.siswa?.nama_siswa || "").toLowerCase().includes(normalizedSearch) ||
      (item.dudi?.nama_dudi || "").toLowerCase().includes(normalizedSearch) ||
      (item.guru?.nama_guru || "").toLowerCase().includes(normalizedSearch);

    const matchFilter = filterPeriode === "all" || item.id_periode.toString() === filterPeriode;

    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filteredData.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = filteredData.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Reset page to 1 when searching or filtering
  useEffect(() => {
    setPage(1);
  }, [search, filterPeriode]);

  // Reset form when edit mode changes in detail modal
  useEffect(() => {
    if (showDetailModal && selectedPenempatan && !isEditMode) {
      setForm({
        id_siswa: selectedPenempatan.id_siswa.toString(),
        id_dudi: selectedPenempatan.id_dudi.toString(),
        id_guru: selectedPenempatan.id_guru.toString(),
        id_periode: selectedPenempatan.id_periode.toString(),
      });
    }
  }, [isEditMode, selectedPenempatan, showDetailModal]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Penempatan Siswa" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">
              Daftar Penempatan Siswa
            </h1>

            <button
              onClick={handleAddPenempatan}
              className="mb-4 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-inter w-fit"
            >
              Tambah <span className="text-lg">+</span>
            </button>

            <div className="mb-4">
              <SearchFilter
                search={search}
                onSearchChange={setSearch}
                filter={filterPeriode}
                onFilterChange={setFilterPeriode}
                filterOptions={[
                  { value: "all", label: "Semua Periode" },
                  ...periodeList.map((p) => ({ value: p.id_periode.toString(), label: p.nama_periode }))
                ]}
                placeholder="Cari"
              />
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable className="text-sm font-inter">
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Siswa</TableHeadCell>
                    <TableHeadCell>DuDi</TableHeadCell>
                    <TableHeadCell>Guru</TableHeadCell>
                    <TableHeadCell>Periode</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody className="divide-y">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        Tidak ada data penempatan
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((item, index) => (
                    <TableRow
                      key={item.id_penempatan}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                      <TableCell>{start + index + 1}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {item.siswa?.nama_siswa}
                      </TableCell>
                      <TableCell>{item.dudi?.nama_dudi}</TableCell>
                      <TableCell>{item.guru?.nama_guru}</TableCell>
                      <TableCell>{item.periode?.nama_periode}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleViewDetail(item)}
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
            {totalPages > 0 && (
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
            )}
          </div>
        </div>
        
        {/* TOAST */}
        <Toast items={toasts} onRemove={removeToast} />
      </main>

      {/* Modal Tambah/Edit */}
      <Modal dismissible show={showModal} size="4xl" onClose={handleCloseModal}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          {isEditMode ? "Edit Penempatan" : "Tambah Penempatan"}
        </ModalHeader>

        <ModalBody className="px-6 py-4">
          <form id="penempatan-form" onSubmit={handleSimpan} className="grid grid-cols-2 gap-4">
            <div className="space-y-5">
              <div>
                <Label htmlFor="id_siswa">Siswa</Label>
                <Select
                  id="id_siswa"
                  name="id_siswa"
                  value={form.id_siswa}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Pilih Siswa</option>
                  {siswaList.map((siswa) => (
                    <option key={siswa.id_siswa} value={siswa.id_siswa}>
                      {siswa.nama_siswa} - {siswa.kelas?.tingkat_kelas} {siswa.kelas?.jurusan?.nama_jurusan} {siswa.kelas?.rombel}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="id_guru">Guru</Label>
                <Select
                  id="id_guru"
                  name="id_guru"
                  value={form.id_guru}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Pilih Guru</option>
                  {guruList.map((guru) => (
                    <option key={guru.id_guru} value={guru.id_guru}>
                      {guru.nama_guru}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="id_dudi">DuDi</Label>
                <Select
                  id="id_dudi"
                  name="id_dudi"
                  value={form.id_dudi}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Pilih DuDi</option>
                  {dudiList.map((dudi) => (
                    <option key={dudi.id_dudi} value={dudi.id_dudi}>
                      {dudi.nama_dudi}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="id_periode">Periode</Label>
                <Select
                  id="id_periode"
                  name="id_periode"
                  value={form.id_periode}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Pilih Periode</option>
                  {periodeList.map((periode) => (
                    <option key={periode.id_periode} value={periode.id_periode}>
                      {periode.nama_periode}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </form>
        </ModalBody>

        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <Button form="penempatan-form" type="submit" color="blue" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button type="button" onClick={handleCloseModal} color="red">
            Batal
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal Detail */}
      <Modal
        dismissible
        show={showDetailModal}
        size="4xl"
        onClose={handleCloseModal}
      >
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          {isEditMode ? "Edit Penempatan" : "Detail Penempatan"}
        </ModalHeader>

        <ModalBody className="px-6 py-4">
          {selectedPenempatan && (
            <form 
              id="penempatan-detail-form" 
              onSubmit={handleSimpan}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-5">
                <div>
                  <Label htmlFor="detail_id_siswa">Siswa</Label>
                  <Select
                    id="detail_id_siswa"
                    name="id_siswa"
                    value={form.id_siswa || selectedPenempatan.id_siswa.toString()}
                    onChange={handleFormChange}
                    disabled={!isEditMode}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Pilih Siswa</option>
                    {siswaList.map((siswa) => (
                      <option key={siswa.id_siswa} value={siswa.id_siswa}>
                        {siswa.nama_siswa} - {siswa.kelas?.tingkat_kelas} {siswa.kelas?.jurusan?.nama_jurusan} {siswa.kelas?.rombel}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="detail_id_guru">Guru</Label>
                  <Select
                    id="detail_id_guru"
                    name="id_guru"
                    value={form.id_guru || selectedPenempatan.id_guru.toString()}
                    onChange={handleFormChange}
                    disabled={!isEditMode}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Pilih Guru</option>
                    {guruList.map((guru) => (
                      <option key={guru.id_guru} value={guru.id_guru}>
                        {guru.nama_guru}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="detail_id_dudi">DuDi</Label>
                  <Select
                    id="detail_id_dudi"
                    name="id_dudi"
                    value={form.id_dudi || selectedPenempatan.id_dudi.toString()}
                    onChange={handleFormChange}
                    disabled={!isEditMode}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Pilih DuDi</option>
                    {dudiList.map((dudi) => (
                      <option key={dudi.id_dudi} value={dudi.id_dudi}>
                        {dudi.nama_dudi}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="detail_id_periode">Periode</Label>
                  <Select
                    id="detail_id_periode"
                    name="id_periode"
                    value={form.id_periode || selectedPenempatan.id_periode.toString()}
                    onChange={handleFormChange}
                    disabled={!isEditMode}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Pilih Periode</option>
                    {periodeList.map((periode) => (
                      <option key={periode.id_periode} value={periode.id_periode}>
                        {periode.nama_periode}
                      </option>
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
              <Button 
                type="button"
                color="blue" 
                onClick={(e) => {
                  e.preventDefault();
                  if (selectedPenempatan) {
                    handleEditPenempatan(selectedPenempatan, true);
                  }
                }}
              >
                Edit
              </Button>
              <Button 
                type="button"
                color="red" 
                onClick={(e) => {
                  e.preventDefault();
                  setShowDetailModal(false);
                  setShowConfirmDelete(true);
                }}
              >
                Hapus
              </Button>
            </>
          ) : (
            <>
              <Button 
                form="penempatan-detail-form" 
                type="submit" 
                color="blue"
                disabled={isLoading}
              >
                {isLoading ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button
                type="button"
                color="red"
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Batal
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal dismissible show={showConfirmDelete} size="sm" onClose={() => setShowConfirmDelete(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Konfirmasi Hapus</ModalHeader>
        <ModalBody className="px-6 py-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-inter">
              Apakah Anda yakin ingin menghapus penempatan untuk siswa{" "}
              <span className="font-semibold text-gray-900">{selectedPenempatan?.siswa?.nama_siswa}</span>?
            </p>
            <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-center gap-3 border-t border-gray-200">
          <Button type="button" color="gray" onClick={() => setShowConfirmDelete(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button type="button" color="red" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Menghapus..." : "Ya, Hapus"}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}