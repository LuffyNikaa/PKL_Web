"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PageHeader from "../../components/PageHeader";
import {
  Modal, Button, Label, TextInput, Select, Textarea,
  ModalHeader, ModalBody, ModalFooter,
  Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow,
} from "flowbite-react";

type MonitoringItem = {
  id_monitoring: number;
  nama_siswa: string;
  tempat_pkl: string;
  nama_guru: string;
  tanggal: string;
  tanggal_raw: string;
  jam: string;
  lokasi: string;
  alasan: string | null;
  status: string;
};

type Siswa = { id_siswa: number; nama_siswa: string; kelas_siswa: string; jurusan_siswa: string };
type User  = { name: string; email: string };

const DATA_PER_PAGE = 10;
const statusColor = (s: string) => s === "dijadwalkan" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
const statusLabel = (s: string) => s === "dijadwalkan" ? "Dijadwalkan" : "Selesai";

const emptyForm = {
  siswa_id_siswa: "", tanggal_monitoring: "", jam_monitoring: "",
  lokasi_monitoring: "", alasan_monitoring: "", status_monitoring: "dijadwalkan",
};

export default function MonitoringPage() {
  const [user, setUser]                   = useState<User | null>(null);
  const [list, setList]                   = useState<MonitoringItem[]>([]);
  const [siswaList, setSiswaList]         = useState<Siswa[]>([]);
  const [selected, setSelected]           = useState<MonitoringItem | null>(null);
  const [page, setPage]                   = useState(1);
  const [showTambah, setShowTambah]       = useState(false);
  const [showDetail, setShowDetail]       = useState(false);
  const [showFilter, setShowFilter]       = useState(false);
  const [isEdit, setIsEdit]               = useState(false);
  const [saving, setSaving]               = useState(false);
  const [form, setForm]                   = useState(emptyForm);
  const [filterNama, setFilterNama]       = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [activeFilter, setActiveFilter]   = useState({ nama: "", status: "", tanggal: "" });

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
      const res = await fetch(`http://localhost:8000/api/admin/monitoring?${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setList(json.data || []);
      setPage(1);
    } catch (err) { console.error(err); }
  };

  const fetchSiswa = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8000/api/admin/siswa", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const json = await res.json();
    setSiswaList(json.data || []);
  };

  useEffect(() => { fetchList({ nama: "", status: "", tanggal: "" }); }, []);

  const handleChange = (e: React.ChangeEvent<any>) => setForm({ ...form, [e.target.name]: e.target.value });

  const openTambah = async () => {
    await fetchSiswa();
    setForm(emptyForm); setIsEdit(false); setShowTambah(true);
  };

  const openEdit = async () => {
    if (!selected) return;
    await fetchSiswa();
    setForm({
      siswa_id_siswa:     String(selected.id_monitoring),
      tanggal_monitoring: selected.tanggal_raw,
      jam_monitoring:     selected.jam,
      lokasi_monitoring:  selected.lokasi,
      alasan_monitoring:  selected.alasan ?? "",
      status_monitoring:  selected.status,
    });
    setIsEdit(true); setShowDetail(false); setShowTambah(true);
  };

  const handleSimpan = async () => {
    setSaving(true);
    try {
      const token  = localStorage.getItem("token");
      const url    = isEdit ? `http://localhost:8000/api/admin/monitoring/${selected?.id_monitoring}` : "http://localhost:8000/api/admin/monitoring";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      fetchList(activeFilter);
      setShowTambah(false);
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected || !confirm(`Hapus jadwal monitoring ${selected.nama_siswa}?`)) return;
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:8000/api/admin/monitoring/${selected.id_monitoring}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    fetchList(activeFilter);
    setShowDetail(false);
  };

  const applyFilter = () => {
    const f = { nama: filterNama, status: filterStatus, tanggal: filterTanggal };
    setActiveFilter(f); fetchList(f); setShowFilter(false);
  };

  const resetFilter = () => {
    setFilterNama(""); setFilterStatus(""); setFilterTanggal("");
    const empty = { nama: "", status: "", tanggal: "" };
    setActiveFilter(empty); fetchList(empty); setShowFilter(false);
  };

  const hasFilter   = activeFilter.nama || activeFilter.status || activeFilter.tanggal;
  const totalPages  = Math.ceil(list.length / DATA_PER_PAGE);
  const start       = (page - 1) * DATA_PER_PAGE;
  const currentData = list.slice(start, start + DATA_PER_PAGE);
  const pages       = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Monitoring" userName={user.name} />
        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">Daftar Jadwal Monitoring</h1>

            <div className="flex items-center gap-3 mb-5">
              <button onClick={openTambah} className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-inter">
                Tambah <span className="text-lg">+</span>
              </button>
              <button onClick={() => setShowFilter(true)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-inter border ${hasFilter ? "bg-blue-50 border-blue-400 text-blue-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                🔍 Filter
                {hasFilter && <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{[activeFilter.nama, activeFilter.status, activeFilter.tanggal].filter(Boolean).length}</span>}
              </button>
              {hasFilter && (
                <div className="flex items-center gap-2 flex-wrap">
                  {activeFilter.nama    && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Nama: {activeFilter.nama}</span>}
                  {activeFilter.status  && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Status: {statusLabel(activeFilter.status)}</span>}
                  {activeFilter.tanggal && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Tanggal: {activeFilter.tanggal}</span>}
                  <button onClick={resetFilter} className="text-xs text-red-500 hover:text-red-700 underline">Hapus filter</button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable className="text-sm font-inter">
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Nama Siswa</TableHeadCell>
                    <TableHeadCell>Tempat PKL</TableHeadCell>
                    <TableHeadCell>Tanggal</TableHeadCell>
                    <TableHeadCell>Jam</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {currentData.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">Tidak ada data monitoring</TableCell></TableRow>
                  ) : currentData.map((item, i) => (
                    <TableRow key={item.id_monitoring} className="bg-white">
                      <TableCell>{start + i + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{item.nama_siswa}</TableCell>
                      <TableCell>{item.tempat_pkl ?? "-"}</TableCell>
                      <TableCell>{item.tanggal}</TableCell>
                      <TableCell>{item.jam ?? "-"}</TableCell>
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

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 mt-6">
                <button onClick={() => setPage(1)} disabled={page===1} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">«</button>
                <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">‹</button>
                {pages.map(p=><button key={p} onClick={()=>setPage(p)} className={`px-3 py-1 text-sm rounded ${page===p?"bg-blue-500 text-white":"hover:bg-gray-100 text-gray-700"}`}>{p}</button>)}
                <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page===totalPages} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">»</button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Filter */}
        <Modal dismissible show={showFilter} size="md" onClose={() => setShowFilter(false)}>
          <ModalHeader className="px-6 py-4 border-b border-gray-200">Filter Monitoring</ModalHeader>
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <div><Label>Nama Siswa</Label><TextInput value={filterNama} onChange={e=>setFilterNama(e.target.value)} placeholder="Cari nama siswa..." className="mt-1"/></div>
              <div><Label>Status</Label>
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
          <ModalHeader className="px-6 py-4 border-b border-gray-200">{isEdit ? "Edit Jadwal Monitoring" : "Tambah Jadwal Monitoring"}</ModalHeader>
          <ModalBody className="px-6 py-4">
            <form className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Siswa <span className="text-red-500">*</span></Label>
                <Select name="siswa_id_siswa" value={form.siswa_id_siswa} onChange={handleChange} className="mt-1" disabled={isEdit}>
                  <option value="">Pilih siswa...</option>
                  {siswaList.map(s => <option key={s.id_siswa} value={s.id_siswa}>{s.nama_siswa} — {s.kelas_siswa} {s.jurusan_siswa}</option>)}
                </Select>
              </div>
              <div><Label>Tanggal <span className="text-red-500">*</span></Label><TextInput type="date" name="tanggal_monitoring" value={form.tanggal_monitoring} onChange={handleChange} className="mt-1"/></div>
              <div><Label>Jam <span className="text-red-500">*</span></Label><TextInput type="time" name="jam_monitoring" value={form.jam_monitoring} onChange={handleChange} className="mt-1"/></div>
              <div className="col-span-2"><Label>Lokasi <span className="text-red-500">*</span></Label><TextInput name="lokasi_monitoring" value={form.lokasi_monitoring} onChange={handleChange} placeholder="Masukkan lokasi monitoring" className="mt-1"/></div>
              <div>
                <Label>Status <span className="text-red-500">*</span></Label>
                <Select name="status_monitoring" value={form.status_monitoring} onChange={handleChange} className="mt-1">
                  <option value="dijadwalkan">Dijadwalkan</option>
                  <option value="selesai">Selesai</option>
                </Select>
              </div>
              <div><Label>Alasan</Label><TextInput name="alasan_monitoring" value={form.alasan_monitoring} onChange={handleChange} placeholder="Alasan monitoring (opsional)" className="mt-1"/></div>
            </form>
          </ModalBody>
          <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
            <Button color="blue" onClick={handleSimpan} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
            <Button color="light" onClick={() => setShowTambah(false)}>Batal</Button>
          </ModalFooter>
        </Modal>

        {/* Modal Detail */}
        <Modal dismissible show={showDetail} size="4xl" onClose={() => { setShowDetail(false); setSelected(null); }}>
          <ModalHeader className="px-6 py-4 border-b border-gray-200">Detail Monitoring</ModalHeader>
          <ModalBody className="px-6 py-4">
            {selected && (
              <form className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div><Label>Nama Siswa</Label><TextInput value={selected.nama_siswa ?? "-"} readOnly className="mt-1"/></div>
                  <div><Label>Tempat PKL</Label><TextInput value={selected.tempat_pkl ?? "-"} readOnly className="mt-1"/></div>
                  <div><Label>Guru Pembimbing</Label><TextInput value={selected.nama_guru ?? "-"} readOnly className="mt-1"/></div>
                </div>
                <div className="space-y-4">
                  <div><Label>Tanggal</Label><TextInput value={selected.tanggal ?? "-"} readOnly className="mt-1"/></div>
                  <div><Label>Jam</Label><TextInput value={selected.jam ?? "-"} readOnly className="mt-1"/></div>
                  <div><Label>Lokasi</Label><TextInput value={selected.lokasi ?? "-"} readOnly className="mt-1"/></div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-2"><span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor(selected.status)}`}>{statusLabel(selected.status)}</span></div>
                  </div>
                  <div><Label>Alasan</Label><TextInput value={selected.alasan ?? "-"} readOnly className="mt-1"/></div>
                </div>
              </form>
            )}
          </ModalBody>
          <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
            <div className="flex gap-2">
              <Button color="blue" onClick={openEdit}>Edit</Button>
              <Button color="red" onClick={handleDelete}>Hapus</Button>
            </div>
            <Button color="gray" onClick={() => { setShowDetail(false); setSelected(null); }}>Tutup</Button>
          </ModalFooter>
        </Modal>
      </main>
    </div>
  );
}