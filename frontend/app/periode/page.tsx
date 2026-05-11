"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
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

type Periode = {
  id_periode: number;
  nama_periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status_periode: "aktif" | "selesai";
};

type User = { name: string; email: string };

const DATA_PER_PAGE = 10;

const emptyForm = {
  nama_periode: "",
  tanggal_mulai: "",
  tanggal_selesai: "",
  status_periode: "aktif",
};

export default function PeriodePage() {
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<Periode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    fetchPeriode();
  }, []);

  const fetchPeriode = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/admin/periode", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setPeriodeList(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpenDetailModal = (periode: Periode) => {
    setSelectedPeriode(periode);
    setForm({
      nama_periode: periode.nama_periode,
      tanggal_mulai: periode.tanggal_mulai,
      tanggal_selesai: periode.tanggal_selesai,
      status_periode: periode.status_periode,
    });
    setIsEditMode(false);
    setShowDetailModal(true);
  };

  const handleEditPeriode = () => {
    if (selectedPeriode) {
      setIsEditMode(true);
    }
  };

  const handleDeletePeriode = async () => {
    if (!selectedPeriode) return;
    if (!confirm(`Hapus periode ${selectedPeriode.nama_periode}?`)) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `http://localhost:8000/api/admin/periode/${selectedPeriode.id_periode}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus periode");

      await fetchPeriode();
      setShowDetailModal(false);
      setSelectedPeriode(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSimpanPeriode = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:8000/api/admin/periode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menambahkan periode");

      await fetchPeriode();
      setShowModal(false);
      setForm(emptyForm);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdatePeriode = async () => {
    if (!selectedPeriode) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `http://localhost:8000/api/admin/periode/${selectedPeriode.id_periode}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal memperbarui periode");

      await fetchPeriode();
      setShowDetailModal(false);
      setSelectedPeriode(null);
      setIsEditMode(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalPages = Math.ceil(periodeList.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = periodeList.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Data Periode" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">
              Daftar Data Periode
            </h1>

            <button
              onClick={() => {
                setForm(emptyForm);
                setSelectedPeriode(null);
                setIsEditMode(false);
                setShowModal(true);
              }}
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
                    <TableHeadCell>Nama Periode</TableHeadCell>
                    <TableHeadCell>Tanggal Mulai</TableHeadCell>
                    <TableHeadCell>Tanggal Selesai</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                        Belum ada periode.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((periode, index) => (
                      <TableRow key={periode.id_periode} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                        <TableCell>{start + index + 1}</TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {periode.nama_periode}
                        </TableCell>
                        <TableCell>{periode.tanggal_mulai}</TableCell>
                        <TableCell>{periode.tanggal_selesai}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-white text-xs ${
                              periode.status_periode === "aktif"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          >
                            {periode.status_periode}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleOpenDetailModal(periode)}
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

      {/* MODAL TAMBAH PERIODE */}
      <Modal dismissible show={showModal} size="md" onClose={() => setShowModal(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">Tambah Data Periode</ModalHeader>
        <ModalBody className="px-6 py-4">
          <form className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="nama_periode">Nama Periode</Label>
              <TextInput
                id="nama_periode"
                name="nama_periode"
                value={form.nama_periode}
                onChange={handleFormChange}
                placeholder="Contoh: 2026/2027"
                required
              />
            </div>
            <div>
              <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
              <TextInput
                id="tanggal_mulai"
                name="tanggal_mulai"
                type="date"
                value={form.tanggal_mulai}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="tanggal_selesai">Tanggal Selesai</Label>
              <TextInput
                id="tanggal_selesai"
                name="tanggal_selesai"
                type="date"
                value={form.tanggal_selesai}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="status_periode">Status</Label>
              <Select
                id="status_periode"
                name="status_periode"
                value={form.status_periode}
                onChange={handleFormChange}
              >
                <option value="aktif">aktif</option>
                <option value="selesai">selesai</option>
              </Select>
            </div>
          </form>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <Button color="gray" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button onClick={handleSimpanPeriode}>Tambah</Button>
        </ModalFooter>
      </Modal>

      {/* MODAL DETAIL PERIODE */}
      <Modal dismissible show={showDetailModal} size="md" onClose={() => setShowDetailModal(false)}>
        <ModalHeader className="px-6 py-4 border-b border-gray-200">
          {isEditMode ? "Edit Data Periode" : "Detail Data Periode"}
        </ModalHeader>
        <ModalBody className="px-6 py-4">
          <form className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="detail_nama_periode">Nama Periode</Label>
              <TextInput
                id="detail_nama_periode"
                name="nama_periode"
                value={form.nama_periode}
                onChange={handleFormChange}
                placeholder="Contoh: 2026/2027"
                disabled={!isEditMode}
                required
              />
            </div>
            <div>
              <Label htmlFor="detail_tanggal_mulai">Tanggal Mulai</Label>
              <TextInput
                id="detail_tanggal_mulai"
                name="tanggal_mulai"
                type="date"
                value={form.tanggal_mulai}
                onChange={handleFormChange}
                disabled={!isEditMode}
                required
              />
            </div>
            <div>
              <Label htmlFor="detail_tanggal_selesai">Tanggal Selesai</Label>
              <TextInput
                id="detail_tanggal_selesai"
                name="tanggal_selesai"
                type="date"
                value={form.tanggal_selesai}
                onChange={handleFormChange}
                disabled={!isEditMode}
                required
              />
            </div>
            <div>
              <Label htmlFor="detail_status_periode">Status</Label>
              <Select
                id="detail_status_periode"
                name="status_periode"
                value={form.status_periode}
                onChange={handleFormChange}
                disabled={!isEditMode}
              >
                <option value="aktif">aktif</option>
                <option value="selesai">selesai</option>
              </Select>
            </div>
          </form>
        </ModalBody>
        <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
          <div className="flex gap-2">
            {!isEditMode && (
              <>
                <Button color="warning" onClick={handleEditPeriode}>
                  Edit
                </Button>
                <Button color="failure" onClick={handleDeletePeriode}>
                  Hapus
                </Button>
              </>
            )}
            {isEditMode && (
              <>
                <Button color="gray" onClick={() => setIsEditMode(false)}>
                  Batal
                </Button>
                <Button onClick={handleUpdatePeriode}>Simpan</Button>
              </>
            )}
          </div>
          <Button color="gray" onClick={() => setShowDetailModal(false)}>
            Tutup
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
