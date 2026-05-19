"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import {
  Modal, Button, Label, TextInput, ModalHeader, ModalBody, ModalFooter,
  Table, TableHead, TableRow, TableHeadCell, TableBody, TableCell, Textarea
} from "flowbite-react";
import dynamic from "next/dynamic";
import Toast, { ToastItem } from "../components/Toast";

type Dudi = {
  id_dudi: number;
  nama_dudi: string;
  alamat_dudi: string;
  kontak_dudi: string;
  latitude_dudi?: string;
  longitude_dudi?: string;
};

type User = {
  name: string;
  email: string;
};

const DATA_PER_PAGE = 10;

export default function DataDudiPage() {
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [dudi, setDudi] = useState<Dudi[]>([]);
  const [selectedDudi, setSelectedDudi] = useState<Dudi | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Search (tanpa filter status — DUDI tidak punya status)
  const [search, setSearch] = useState("");

  // Toast
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (type: ToastItem["type"], message: string, duration = 3500) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    setToasts((s) => [...s, { id, type, message, duration }]);
  };
  const removeToast = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  const [form, setForm] = useState({
    nama_dudi: "",
    alamat_dudi: "",
    kontak_dudi: "",
    latitude_dudi: "",
    longitude_dudi: "",
  });

  const resetFormDudi = () => {
    setForm({
      nama_dudi: "",
      alamat_dudi: "",
      kontak_dudi: "",
      latitude_dudi: "",
      longitude_dudi: "",
    });
  };

  const MapComponent = dynamic(
    () => import("../components/MapComponents"),
    { ssr: false }
  );

  // =====================
  // AUTH USER
  // =====================
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  // =====================
  // FETCH DUDI
  // =====================
  const fetchDudi = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/admin/dudi", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setDudi(json.data || []);
    } catch (err) {
      console.error("Fetch dudi error:", err);
    }
  };

  useEffect(() => { fetchDudi(); }, []);

  useEffect(() => {
    if (!showDetailModal) resetFormDudi();
  }, [showDetailModal]);

  // =====================
  // FORM HANDLER
  // =====================
  const handleFormChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    
    if (name === "kontak_dudi") {
      const numericOnly = value.replace(/[^0-9]/g, "");
      setForm((prev) => ({ ...prev, [name]: numericOnly }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setForm((prev) => ({
      ...prev,
      latitude_dudi: lat.toString(),
      longitude_dudi: lng.toString(),
    }));
  };

  // =====================
  // CREATE
  // =====================
  const handleSimpan = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/dudi", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchDudi();
      setShowModal(false);
      resetFormDudi();
      pushToast("success", "DUDI berhasil ditambahkan");
    } catch (err: any) {
      pushToast("error", err.message || "Gagal menambahkan DUDI");
    }
  };

  // =====================
  // EDIT
  // =====================
  const handleEditDudi = () => {
    if (!selectedDudi) return;
    setForm({
      nama_dudi: selectedDudi.nama_dudi,
      alamat_dudi: selectedDudi.alamat_dudi,
      kontak_dudi: selectedDudi.kontak_dudi,
      latitude_dudi: selectedDudi.latitude_dudi || "",
      longitude_dudi: selectedDudi.longitude_dudi || "",
    });
    setIsEditMode(true);
  };

  // =====================
  // UPDATE
  // =====================
  const handleUpdateDudi = async () => {
    if (!selectedDudi) return;
    const payload = {
      ...form,
      latitude_dudi: form.latitude_dudi ? parseFloat(form.latitude_dudi) : null,
      longitude_dudi: form.longitude_dudi ? parseFloat(form.longitude_dudi) : null,
    };
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/dudi/${selectedDudi.id_dudi}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchDudi();
      setShowDetailModal(false);
      setSelectedDudi(null);
      setIsEditMode(false);
      pushToast("success", "Perubahan DUDI berhasil disimpan");
    } catch (err: any) {
      pushToast("error", err.message || "Gagal memperbarui DUDI");
    }
  };

  // =====================
  // DELETE
  // =====================
  const handleDeleteDudi = async () => {
    if (!selectedDudi) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/dudi/${selectedDudi.id_dudi}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchDudi();
      setShowConfirmDelete(false);
      setShowDetailModal(false);
      setSelectedDudi(null);
      pushToast("success", "DUDI berhasil dihapus");
    } catch (err: any) {
      pushToast("error", err.message || "Gagal menghapus DUDI");
    }
  };

  // =====================
  // SEARCH & PAGINATION
  // =====================
  const normalizedSearch = search.trim().toLowerCase();
  const filteredData = dudi.filter((d) =>
    !normalizedSearch ||
    [d.nama_dudi, d.alamat_dudi, d.kontak_dudi].some((v) =>
      (v || "").toLowerCase().includes(normalizedSearch)
    )
  );

  const totalPages = Math.ceil(filteredData.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = filteredData.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Data Dudi" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">Daftar Data Dudi</h1>

            <button
              onClick={() => setShowModal(true)}
              className="mb-4 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-inter w-fit"
            >
              Tambah <span className="text-lg">+</span>
            </button>

            {/* Search (tanpa filter) */}
            <div className="mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 font-inter"
              />
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable className="text-sm font-inter">
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Nama</TableHeadCell>
                    <TableHeadCell>Alamat</TableHeadCell>
                    <TableHeadCell>Kontak</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {currentData.map((d, index) => (
                    <TableRow key={d.id_dudi} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <TableCell>{start + index + 1}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {d.nama_dudi}
                      </TableCell>
                      <TableCell>{d.alamat_dudi}</TableCell>
                      <TableCell>{d.kontak_dudi}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => {
                            setSelectedDudi(d);
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

      {/* ===== MODAL TAMBAH DUDI ===== */}
      <Modal dismissible show={showModal} size="4xl" onClose={() => { setShowModal(false); resetFormDudi(); }}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Tambah Data Dudi</ModalHeader>
        <ModalBody className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* grid tinggi penuh agar map bisa stretch */}
          <div className="grid grid-cols-2 gap-4" style={{ minHeight: "480px" }}>
            {/* Kiri: Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="nama_dudi">Nama Dudi</Label>
                <TextInput
                  id="nama_dudi" name="nama_dudi"
                  value={form.nama_dudi} onChange={handleFormChange}
                  placeholder="Masukkan nama dudi" required
                />
              </div>
              <div>
                <Label htmlFor="kontak_dudi">Kontak</Label>
                <TextInput
                  id="kontak_dudi" name="kontak_dudi"
                  type="text" inputMode="numeric"
                  value={form.kontak_dudi} onChange={handleFormChange}
                  placeholder="Masukkan kontak" required
                />
              </div>
              <div>
                <Label htmlFor="latitude_dudi">Latitude</Label>
                <TextInput
                  id="latitude_dudi" name="latitude_dudi"
                  type="number" step="any"
                  value={form.latitude_dudi} readOnly
                  placeholder="Klik peta untuk mengisi"
                />
              </div>
              <div>
                <Label htmlFor="longitude_dudi">Longitude</Label>
                <TextInput
                  id="longitude_dudi" name="longitude_dudi"
                  type="number" step="any"
                  value={form.longitude_dudi} readOnly
                  placeholder="Klik peta untuk mengisi"
                />
              </div>
              <div>
                <Label htmlFor="alamat_dudi">Alamat</Label>
                <Textarea
                  id="alamat_dudi" name="alamat_dudi"
                  value={form.alamat_dudi} onChange={handleFormChange}
                  placeholder="Masukkan alamat" rows={3} required
                />
              </div>
              <p className="text-xs text-gray-500">* Klik peta untuk menentukan lokasi DUDI</p>
            </div>

            {/* Kanan: Map full height */}
            <div className="rounded-lg overflow-hidden h-full" style={{ minHeight: "480px" }}>
              <MapComponent
                onLocationSelect={handleLocationSelect}
                latLng={[
                  form.latitude_dudi ? Number(form.latitude_dudi) : -7.250445,
                  form.longitude_dudi ? Number(form.longitude_dudi) : 112.768845,
                ]}
                isEditing={false}
                isAddMode={true}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <Button onClick={handleSimpan} color="blue">Simpan</Button>
          <Button onClick={() => { setShowModal(false); resetFormDudi(); }} color="red">Batal</Button>
        </ModalFooter>
      </Modal>

      {/* ===== MODAL DETAIL / EDIT DUDI ===== */}
      <Modal
        dismissible
        show={showDetailModal}
        size="4xl"
        onClose={() => {
          setShowDetailModal(false);
          setIsEditMode(false);
          setSelectedDudi(null);
          resetFormDudi();
        }}
      >
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          {isEditMode ? "Edit Data DUDI" : "Detail Data DUDI"}
        </ModalHeader>
        <ModalBody className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {selectedDudi && (
            <div className="grid grid-cols-2 gap-6" style={{ minHeight: "480px" }}>
              {/* Kiri: Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nama_dudi">Nama DUDI</Label>
                  <TextInput
                    id="nama_dudi" name="nama_dudi"
                    value={isEditMode ? form.nama_dudi : selectedDudi.nama_dudi}
                    onChange={handleFormChange} readOnly={!isEditMode}
                  />
                </div>
                <div>
                  <Label htmlFor="kontak_dudi">Kontak</Label>
                  <TextInput
                    id="kontak_dudi" name="kontak_dudi"
                    type="text" inputMode="numeric"
                    value={isEditMode ? form.kontak_dudi : selectedDudi.kontak_dudi}
                    onChange={handleFormChange} readOnly={!isEditMode}
                  />
                </div>
                <div>
                  <Label htmlFor="latitude_dudi">Latitude</Label>
                  <TextInput
                    id="latitude_dudi" name="latitude_dudi"
                    value={isEditMode ? form.latitude_dudi : (selectedDudi.latitude_dudi || "")}
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="longitude_dudi">Longitude</Label>
                  <TextInput
                    id="longitude_dudi" name="longitude_dudi"
                    value={isEditMode ? form.longitude_dudi : (selectedDudi.longitude_dudi || "")}
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="alamat_dudi">Alamat</Label>
                  <Textarea
                    id="alamat_dudi" name="alamat_dudi"
                    value={isEditMode ? form.alamat_dudi : selectedDudi.alamat_dudi}
                    onChange={handleFormChange} readOnly={!isEditMode} rows={3}
                  />
                </div>
                {isEditMode && (
                  <p className="text-xs text-gray-500">* Klik peta untuk memperbarui lokasi DUDI</p>
                )}
              </div>

              {/* Kanan: Map full height */}
              <div className="rounded-lg overflow-hidden h-full" style={{ minHeight: "480px" }}>
                <MapComponent
                  onLocationSelect={handleLocationSelect}
                  latLng={[
                    form.latitude_dudi
                      ? Number(form.latitude_dudi)
                      : Number(selectedDudi.latitude_dudi) || -7.250445,
                    form.longitude_dudi
                      ? Number(form.longitude_dudi)
                      : Number(selectedDudi.longitude_dudi) || 112.768845,
                  ]}
                  isEditing={isEditMode}
                  isAddMode={false}
                />
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          {!isEditMode ? (
            <>
              <Button color="blue" onClick={handleEditDudi}>Edit</Button>
              <Button color="red" onClick={() => setShowConfirmDelete(true)}>Hapus</Button>
            </>
          ) : (
            <>
              <Button color="blue" onClick={handleUpdateDudi}>Simpan</Button>
              <Button color="red" onClick={() => { setIsEditMode(false); resetFormDudi(); }}>Batal</Button>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-inter">
              Apakah Anda yakin ingin menghapus data DUDI{" "}
              <span className="font-semibold text-gray-900">{selectedDudi?.nama_dudi}</span>?
            </p>
            <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-center gap-3 border-t border-gray-200">
          <Button color="gray" onClick={() => setShowConfirmDelete(false)}>Batal</Button>
          <Button color="red" onClick={handleDeleteDudi}>Ya, Hapus</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
