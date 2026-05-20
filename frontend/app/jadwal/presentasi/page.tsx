"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PageHeader from "../../components/PageHeader";
import Toast, { ToastItem } from "../../components/Toast";
import {
  Modal, Button, Label, TextInput, Select,
  ModalHeader, ModalBody, ModalFooter,
  Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow,
} from "flowbite-react";

type PresentasiItem = {
  id_presentasi: number;
  nama_siswa: string;
  kelas_siswa: string;
  tempat_pkl: string;
  tanggal: string;
  tanggal_raw: string;
  jam: string;
  ruangan: string;
  status: string;
};

type Siswa = { 
  id_siswa: number; 
  nama_siswa: string; 
  kelas: string;
  jurusan: string;
};

type User = { name: string; email: string };

const DATA_PER_PAGE = 10;
const statusColor = (s: string) => s === "dijadwalkan" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
const statusLabel = (s: string) => s === "dijadwalkan" ? "Dijadwalkan" : "Selesai";

const emptyForm = {
  id_siswa: "", 
  tanggal_presentasi: "", 
  jam_presentasi: "",
  ruangan_presentasi: "", 
  status_presentasi: "dijadwalkan",
};

export default function PresentasiPage() {
  const [user, setUser]                   = useState<User | null>(null);
  const [list, setList]                   = useState<PresentasiItem[]>([]);
  const [siswaList, setSiswaList]         = useState<Siswa[]>([]);
  const [selected, setSelected]           = useState<PresentasiItem | null>(null);
  const [page, setPage]                   = useState(1);
  const [showTambah, setShowTambah]       = useState(false);
  const [showDetail, setShowDetail]       = useState(false);
  const [showFilter, setShowFilter]       = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEdit, setIsEdit]               = useState(false);
  const [saving, setSaving]               = useState(false);
  const [form, setForm]                   = useState(emptyForm);
  const [filterNama, setFilterNama]       = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [activeFilter, setActiveFilter]   = useState({ nama: "", status: "", tanggal: "" });
  const [searchQuery, setSearchQuery]     = useState("");

  // Toast State
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (type: ToastItem["type"], message: string, duration = 3500) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    setToasts((s) => [...s, { id, type, message, duration }]);
  };
  const removeToast = (id: string) => setToasts((s) => s.filter((t) => t.id !== id));

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  const fetchList = async (filter = activeFilter) => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filter.nama)    params.append("nama", filter.nama);
      if (filter.status)  params.append("status", filter.status);
      if (filter.tanggal) params.append("tanggal", filter.tanggal);
      const res = await fetch(`http://localhost:8000/api/admin/presentasi?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setList(json.data || []);
      setPage(1);
    } catch (err) { console.error(err); }
  };

  const fetchSiswa = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/api/admin/siswa", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      
      // Format siswa dengan kelas yang benar (contoh: X TKJ 1)
      const siswaFormatted = (json.data || []).map((s: any) => {
        let kelas = '-';
        
        if (s.kelas) {
          const tingkat = s.kelas.tingkat_kelas || '';
          const jurusanSingkatan = s.kelas.jurusan?.singkatan_jurusan || s.kelas.jurusan?.nama_jurusan || '';
          const rombel = s.kelas.rombel || '';
          kelas = `${tingkat} ${jurusanSingkatan} ${rombel}`.replace(/\s+/g, ' ').trim() || '-';
        }
        
        return {
          id_siswa: s.id_siswa,
          nama_siswa: s.nama_siswa,
          kelas: kelas,
          jurusan: '',
        };
      });
      
      setSiswaList(siswaFormatted);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchList({ nama: "", status: "", tanggal: "" }); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openTambah = async () => {
    await fetchSiswa();
    setForm(emptyForm); 
    setIsEdit(false); 
    setShowTambah(true);
  };

  const openEdit = async () => {
    if (!selected) return;
    await fetchSiswa();
    // Cari id_siswa dari data yang dipilih
    const siswa = siswaList.find(s => s.nama_siswa === selected.nama_siswa);
    setForm({
      id_siswa: siswa?.id_siswa?.toString() || "",
      tanggal_presentasi: selected.tanggal_raw,
      jam_presentasi: selected.jam,
      ruangan_presentasi: selected.ruangan,
      status_presentasi: selected.status,
    });
    setIsEdit(true); 
    setShowDetail(false); 
    setShowTambah(true);
  };

  const handleSimpan = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const url = isEdit 
        ? `http://localhost:8000/api/admin/presentasi/${selected?.id_presentasi}` 
        : "http://localhost:8000/api/admin/presentasi";
      const method = isEdit ? "PUT" : "POST";
      
      const payload = isEdit 
        ? {
            tanggal_presentasi: form.tanggal_presentasi,
            jam_presentasi: form.jam_presentasi,
            ruangan_presentasi: form.ruangan_presentasi,
            status_presentasi: form.status_presentasi,
          }
        : {
            id_siswa: parseInt(form.id_siswa),
            tanggal_presentasi: form.tanggal_presentasi,
            jam_presentasi: form.jam_presentasi,
            ruangan_presentasi: form.ruangan_presentasi,
            status_presentasi: form.status_presentasi,
          };
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      fetchList(activeFilter);
      setShowTambah(false);
      pushToast("success", isEdit ? "Jadwal presentasi berhasil diperbarui!" : "Jadwal presentasi berhasil ditambahkan!");
    } catch (err: any) { 
      pushToast("error", err.message || "Terjadi kesalahan saat menyimpan"); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/api/admin/presentasi/${selected.id_presentasi}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal menghapus jadwal presentasi");
      
      fetchList(activeFilter);
      setShowConfirmDelete(false);
      setShowDetail(false);
      setSelected(null);
      pushToast("success", "Jadwal presentasi berhasil dihapus!");
    } catch (err: any) {
      pushToast("error", err.message || "Terjadi kesalahan saat menghapus");
    }
  };

  const applyFilter = () => {
    const f = { nama: filterNama, status: filterStatus, tanggal: filterTanggal };
    setActiveFilter(f); 
    fetchList(f); 
    setShowFilter(false);
  };

  const resetFilter = () => {
    setFilterNama(""); 
    setFilterStatus(""); 
    setFilterTanggal("");
    const empty = { nama: "", status: "", tanggal: "" };
    setActiveFilter(empty); 
    fetchList(empty); 
    setShowFilter(false);
  };

  const hasFilter = activeFilter.nama || activeFilter.status || activeFilter.tanggal;
  const filteredList = list.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.nama_siswa?.toLowerCase().includes(q) ||
      item.kelas_siswa?.toLowerCase().includes(q) ||
      item.tempat_pkl?.toLowerCase().includes(q) ||
      item.ruangan?.toLowerCase().includes(q)
    );
  });
  const totalPages = Math.ceil(filteredList.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = filteredList.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Presentasi" userName={user.name} />
        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">Daftar Jadwal Presentasi</h1>

            {/* Tombol Tambah */}
            <button onClick={openTambah} className="mb-4 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-inter w-fit">
              Tambah <span className="text-lg">+</span>
            </button>

            {/* Toolbar Search & Filter */}
            <div className="flex items-center gap-3 mb-5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Cari..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-400 font-inter"
              />
              <button onClick={() => setShowFilter(true)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-inter border ${hasFilter ? "bg-blue-50 border-blue-400 text-blue-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                🔍 Filter
                {hasFilter && <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{[activeFilter.nama, activeFilter.status, activeFilter.tanggal].filter(Boolean).length}</span>}
              </button>
              {hasFilter && (
                <div className="flex items-center gap-2 flex-wrap font-inter">
                  {activeFilter.nama    && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Nama: {activeFilter.nama}</span>}
                  {activeFilter.status  && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Status: {statusLabel(activeFilter.status)}</span>}
                  {activeFilter.tanggal && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Tanggal: {activeFilter.tanggal}</span>}
                  <button onClick={resetFilter} className="text-xs text-red-500 hover:text-red-700 underline font-inter">Hapus filter</button>
                </div>
              )}
            </div>

            {/* Tabel */}
            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable className="text-sm font-inter">
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Nama Siswa</TableHeadCell>
                    <TableHeadCell>Kelas</TableHeadCell>
                    <TableHeadCell>Tanggal</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {currentData.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">Tidak ada data presentasi</TableCell></TableRow>
                  ) : currentData.map((item, i) => (
                    <TableRow key={item.id_presentasi} className="bg-white">
                      <TableCell>{start + i + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{item.nama_siswa}</TableCell>
                      <TableCell>{item.kelas_siswa || "-"}</TableCell>
                      <TableCell>{item.tanggal}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(item.status)}`}>{statusLabel(item.status)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <button onClick={() => { setSelected(item); setShowDetail(true); }} className="text-blue-500 hover:text-blue-700 font-medium text-sm">Detail</button>
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
                disabled={page === totalPages || totalPages === 0}
                className="px-3 py-1 rounded-md border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modal Filter */}
        <Modal dismissible show={showFilter} size="md" onClose={() => setShowFilter(false)}>
          <ModalHeader className="px-6 py-4 border-b border-gray-200">Filter Presentasi</ModalHeader>
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <div><Label>Nama Siswa</Label><TextInput value={filterNama} onChange={e=>setFilterNama(e.target.value)} placeholder="Cari nama siswa..." className="mt-1"/></div>
              <div>
                <Label>Status</Label>
                <Select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="mt-1">
                  <option value="">Semua Status</option>
                  <option value="dijadwalkan">Dijadwalkan</option>
                  <option value="selesai">Selesai</option>
                </Select>
              </div>
              <div><Label>Tanggal</Label><TextInput type="date" value={filterTanggal} onChange={e=>setFilterTanggal(e.target.value)} className="mt-1"/></div>
            </div>
          </ModalBody>
          <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
            <Button color="blue" onClick={applyFilter}>Terapkan</Button>
            <Button color="light" onClick={resetFilter}>Reset</Button>
          </ModalFooter>
        </Modal>

        {/* Modal Tambah/Edit */}
        <Modal dismissible show={showTambah} size="4xl" onClose={() => setShowTambah(false)}>
          <ModalHeader className="px-6 py-4 border-b border-gray-200">{isEdit ? "Edit Jadwal Presentasi" : "Tambah Jadwal Presentasi"}</ModalHeader>
          <ModalBody className="px-6 py-4">
            <form className="space-y-4">
              {!isEdit && (
                <div>
                  <Label>Siswa <span className="text-red-500">*</span></Label>
                  <Select name="id_siswa" value={form.id_siswa} onChange={handleChange} className="mt-1">
                    <option value="">Pilih siswa...</option>
                    {siswaList.map(s => <option key={s.id_siswa} value={s.id_siswa}>{s.nama_siswa} — {s.kelas}</option>)}
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tanggal <span className="text-red-500">*</span></Label>
                  <TextInput type="date" name="tanggal_presentasi" value={form.tanggal_presentasi} onChange={handleChange} className="mt-1"/>
                </div>
                <div>
                  <Label>Jam <span className="text-red-500">*</span></Label>
                  <TextInput type="time" name="jam_presentasi" value={form.jam_presentasi} onChange={handleChange} className="mt-1"/>
                </div>
              </div>
              <div>
                <Label>Ruangan <span className="text-red-500">*</span></Label>
                <TextInput name="ruangan_presentasi" value={form.ruangan_presentasi} onChange={handleChange} placeholder="Masukkan lokasi presentasi" className="mt-1"/>
              </div>
              <div>
                <Label>Status <span className="text-red-500">*</span></Label>
                <Select name="status_presentasi" value={form.status_presentasi} onChange={handleChange} className="mt-1">
                  <option value="dijadwalkan">Dijadwalkan</option>
                  <option value="selesai">Selesai</option>
                </Select>
              </div>
            </form>
          </ModalBody>
          <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
            <Button color="blue" onClick={handleSimpan} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
            <Button color="red" onClick={() => setShowTambah(false)}>Batal</Button>
          </ModalFooter>
        </Modal>

        {/* Modal Detail */}
        <Modal dismissible show={showDetail} size="4xl" onClose={() => { setShowDetail(false); setSelected(null); }}>
          <ModalHeader className="px-6 py-4 border-b border-gray-200">Detail Jadwal Presentasi</ModalHeader>
          <ModalBody className="px-6 py-4">
            {selected && (
              <div className="space-y-4 font-inter">
                <div className="grid grid-cols-2 gap-4">
                  {/* KIRI */}
                  <div className="space-y-4">
                    <div><Label>Nama Siswa</Label><TextInput value={selected.nama_siswa ?? "-"} readOnly className="mt-1 bg-gray-50" /></div>
                    <div><Label>Kelas</Label><TextInput value={selected.kelas_siswa ?? "-"} readOnly className="mt-1 bg-gray-50" /></div>
                    <div><Label>Tempat PKL</Label><TextInput value={selected.tempat_pkl ?? "-"} readOnly className="mt-1 bg-gray-50" /></div>
                  </div>

                  {/* KANAN */}
                  <div className="space-y-4">
                    <div><Label>Tanggal</Label><TextInput value={selected.tanggal ?? "-"} readOnly className="mt-1 bg-gray-50" /></div>
                    <div><Label>Jam</Label><TextInput value={selected.jam ?? "-"} readOnly className="mt-1 bg-gray-50" /></div>
                    <div><Label>Ruangan</Label><TextInput value={selected.ruangan ?? "-"} readOnly className="mt-1 bg-gray-50" /></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Label>Status</Label>
                  <div className="mt-2">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor(selected.status)}`}>
                      {statusLabel(selected.status)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
            <Button color="blue" onClick={openEdit}>Edit</Button>
            <Button color="red" onClick={() => { setShowConfirmDelete(true); setShowDetail(false); }}>Hapus</Button>
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
                Apakah Anda yakin ingin menghapus jadwal presentasi untuk siswa{" "}
                <span className="font-semibold text-gray-900">{selected?.nama_siswa}</span>?
              </p>
              <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
          </ModalBody>
          <ModalFooter className="px-6 py-4 flex justify-center gap-3 border-t border-gray-200">
            <Button color="gray" onClick={() => { setShowConfirmDelete(false); setShowDetail(true); }}>Batal</Button>
            <Button color="red" onClick={handleDelete}>Ya, Hapus</Button>
          </ModalFooter>
        </Modal>

        {/* Toast Notification Container */}
        <Toast items={toasts} onRemove={removeToast} />
      </main>
    </div>
  );
}