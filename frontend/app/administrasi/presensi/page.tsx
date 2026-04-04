"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PageHeader from "../../components/PageHeader";
import {
  Modal, Button, Label, TextInput, Select,
  ModalHeader, ModalBody, ModalFooter,
  Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow,
} from "flowbite-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Presensi = {
  id_absensi: number;
  nama: string;
  tempat_pkl: string;
  tanggal_absensi: string;
  waktu_absensi: string;
  waktu_pulang: string | null;
  latitude_absensi: string;
  longitude_absensi: string;
  status_absensi: string;
  alasan_absensi: string | null;
  foto_surat: string | null;
};

type Siswa = {
  id_siswa: number;
  nama_siswa: string;
  kelas_siswa: string;
  jurusan_siswa: string;
  dudi?: { nama_dudi: string };
};

type User = { name: string; email: string };

const DATA_PER_PAGE = 10;

const statusColor = (status: string) => {
  switch (status) {
    case "hadir": return "bg-green-100 text-green-700";
    case "izin":  return "bg-yellow-100 text-yellow-700";
    case "sakit": return "bg-red-100 text-red-700";
    default:      return "bg-gray-100 text-gray-600";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "hadir": return "Hadir";
    case "izin":  return "Izin";
    case "sakit": return "Sakit";
    default:      return status;
  }
};

export default function DataPresensiPage() {
  const [user, setUser]                   = useState<User | null>(null);
  const [presensiList, setPresensiList]   = useState<Presensi[]>([]);
  const [siswaList, setSiswaList]         = useState<Siswa[]>([]);
  const [selected, setSelected]           = useState<Presensi | null>(null);
  const [showDetail, setShowDetail]       = useState(false);
  const [page, setPage]                   = useState(1);

  // Filter modal
  const [showFilter, setShowFilter]       = useState(false);
  const [filterNama, setFilterNama]       = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  // aktif filter (yang sudah diapply)
  const [activeFilter, setActiveFilter]   = useState({ nama: "", status: "", tanggal: "" });

  // Rekap modal
  const [showRekap, setShowRekap]         = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [rekapData, setRekapData]         = useState<Presensi[]>([]);
  const [rekapLoading, setRekapLoading]   = useState(false);
  const [searchSiswa, setSearchSiswa]     = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const fetchPresensi = async (filter = activeFilter) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const params = new URLSearchParams();
      if (filter.nama)    params.append("nama", filter.nama);
      if (filter.status)  params.append("status", filter.status);
      if (filter.tanggal) params.append("tanggal", filter.tanggal);
      const res = await fetch(
        `http://localhost:8000/api/admin/presensi?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      const json = await res.json();
      setPresensiList(json.data || []);
      setPage(1);
    } catch (err) {
      console.error("Fetch presensi error:", err);
    }
  };

  const fetchSiswa = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/admin/siswa", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setSiswaList(json.data || []);
    } catch (err) {
      console.error("Fetch siswa error:", err);
    }
  };

  useEffect(() => { fetchPresensi({ nama: "", status: "", tanggal: "" }); }, []);

  // Apply filter dari modal
  const handleApplyFilter = () => {
    const newFilter = { nama: filterNama, status: filterStatus, tanggal: filterTanggal };
    setActiveFilter(newFilter);
    fetchPresensi(newFilter);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterNama("");
    setFilterStatus("");
    setFilterTanggal("");
    const empty = { nama: "", status: "", tanggal: "" };
    setActiveFilter(empty);
    fetchPresensi(empty);
    setShowFilter(false);
  };

  // Buka modal rekap — fetch siswa dulu
  const handleOpenRekap = async () => {
    await fetchSiswa();
    setSelectedSiswa(null);
    setRekapData([]);
    setSearchSiswa("");
    setShowRekap(true);
  };

  // Pilih siswa di modal rekap → fetch rekap presensinya
  const handlePilihSiswa = async (siswa: Siswa) => {
    setSelectedSiswa(siswa);
    setRekapLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ nama: siswa.nama_siswa });
      const res = await fetch(
        `http://localhost:8000/api/admin/presensi?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      const json = await res.json();
      setRekapData(json.data || []);
    } catch (err) {
      console.error("Fetch rekap error:", err);
    } finally {
      setRekapLoading(false);
    }
  };

  // Filter siswa berdasarkan search
  const filteredSiswa = siswaList.filter((s) =>
    s.nama_siswa.toLowerCase().includes(searchSiswa.toLowerCase())
  );
  const rekapSummary = {
    hadir: rekapData.filter((r) => r.status_absensi === "hadir").length,
    izin:  rekapData.filter((r) => r.status_absensi === "izin").length,
    sakit: rekapData.filter((r) => r.status_absensi === "sakit").length,
    total: rekapData.length,
  };

  // Cek filter aktif
  const hasActiveFilter = activeFilter.nama || activeFilter.status || activeFilter.tanggal;

  const totalPages  = Math.ceil(presensiList.length / DATA_PER_PAGE);
  const start       = (page - 1) * DATA_PER_PAGE;
  const currentData = presensiList.slice(start, start + DATA_PER_PAGE);
  const pages       = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Generate PDF rekap
  const generatePDF = () => {
    if (!selectedSiswa || rekapData.length === 0) return;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

    // ===== HEADER =====
    doc.setFillColor(30, 64, 175); // biru gelap
    doc.rect(0, 0, pageW, 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("REKAP PRESENSI PKL", pageW / 2, 14, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Sistem Informasi PKL", pageW / 2, 22, { align: "center" });
    doc.text(`Dicetak: ${now}`, pageW / 2, 28, { align: "center" });

    // ===== INFO SISWA =====
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Informasi Siswa", 14, 44);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, 46, pageW - 14, 46);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const infoKiri = [
      ["Nama Siswa", selectedSiswa.nama_siswa],
      ["Kelas", selectedSiswa.kelas_siswa],
      ["Jurusan", selectedSiswa.jurusan_siswa],
    ];
    const infoKanan = [
      ["Tempat PKL", selectedSiswa.dudi?.nama_dudi ?? "-"],
      ["Total Presensi", `${rekapSummary.total} hari`],
      ["Periode", rekapData.length > 0
        ? `${rekapData[rekapData.length - 1].tanggal_absensi} s/d ${rekapData[0].tanggal_absensi}`
        : "-"],
    ];

    let y = 52;
    infoKiri.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${value}`, 52, y);
      y += 7;
    });

    y = 52;
    infoKanan.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}`, pageW / 2, y);
      doc.setFont("helvetica", "normal");
      doc.text(`: ${value}`, pageW / 2 + 32, y);
      y += 7;
    });

    // ===== RINGKASAN =====
    const summaryY = 80;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan", 14, summaryY);
    doc.line(14, summaryY + 2, pageW - 14, summaryY + 2);

    const boxW = (pageW - 28 - 9) / 4;
    const boxes = [
      { label: "Total", value: rekapSummary.total, r: 200, g: 200, b: 200, tr: 50, tg: 50, tb: 50 },
      { label: "Hadir", value: rekapSummary.hadir, r: 187, g: 247, b: 208, tr: 22, tg: 101, tb: 52 },
      { label: "Izin",  value: rekapSummary.izin,  r: 254, g: 240, b: 138, tr: 133, tg: 100, tb: 4 },
      { label: "Sakit", value: rekapSummary.sakit, r: 254, g: 202, b: 202, tr: 185, tg: 28, tb: 28 },
    ];

    boxes.forEach((box, i) => {
      const bx = 14 + i * (boxW + 3);
      const by = summaryY + 5;
      doc.setFillColor(box.r, box.g, box.b);
      doc.roundedRect(bx, by, boxW, 18, 2, 2, "F");
      doc.setTextColor(box.tr, box.tg, box.tb);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(String(box.value), bx + boxW / 2, by + 10, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(box.label, bx + boxW / 2, by + 15.5, { align: "center" });
    });

    // ===== TABEL =====
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Riwayat Presensi", 14, summaryY + 32);

    autoTable(doc, {
      startY: summaryY + 35,
      head: [["No", "Tanggal", "Waktu Masuk", "Waktu Pulang", "Status", "Alasan"]],
      body: rekapData.map((r, i) => [
        i + 1,
        r.tanggal_absensi,
        r.waktu_absensi ?? "-",
        r.waktu_pulang ?? "-",
        statusLabel(r.status_absensi),
        r.alasan_absensi ?? "-",
      ]),
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 28 },
        2: { cellWidth: 26 },
        3: { cellWidth: 26 },
        4: { cellWidth: 20 },
        5: { cellWidth: "auto" },
      },
      margin: { left: 14, right: 14 },
    });

    // ===== FOOTER =====
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Halaman ${i} dari ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
      doc.text(
        "Dokumen ini digenerate otomatis oleh Sistem Informasi PKL",
        pageW / 2,
        doc.internal.pageSize.getHeight() - 4,
        { align: "center" }
      );
    }

    doc.save(`Rekap_Presensi_${selectedSiswa.nama_siswa.replace(/ /g, "_")}.pdf`);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Data Presensi" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">Daftar Data Presensi</h1>

            {/* ===== TOMBOL REKAP & FILTER ===== */}
            <div className="flex items-center gap-3 mb-5">
              {/* Rekap */}
              <button
                onClick={handleOpenRekap}
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-inter"
              >
                📊 Rekap
              </button>

              {/* Filter */}
              <button
                onClick={() => setShowFilter(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-inter border ${
                  hasActiveFilter
                    ? "bg-blue-50 border-blue-400 text-blue-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                🔍 Filter
                {hasActiveFilter && (
                  <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {[activeFilter.nama, activeFilter.status, activeFilter.tanggal].filter(Boolean).length}
                  </span>
                )}
              </button>

              {/* Indikator filter aktif */}
              {hasActiveFilter && (
                <div className="flex items-center gap-2 flex-wrap">
                  {activeFilter.nama && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      Nama: {activeFilter.nama}
                    </span>
                  )}
                  {activeFilter.status && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      Status: {statusLabel(activeFilter.status)}
                    </span>
                  )}
                  {activeFilter.tanggal && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                      Tanggal: {activeFilter.tanggal}
                    </span>
                  )}
                  <button
                    onClick={handleResetFilter}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Hapus filter
                  </button>
                </div>
              )}
            </div>

            {/* ===== TABLE ===== */}
            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable className="text-sm font-inter">
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Nama</TableHeadCell>
                    <TableHeadCell>Tempat PKL</TableHeadCell>
                    <TableHeadCell>Tanggal Presensi</TableHeadCell>
                    <TableHeadCell>Status Presensi</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                        Tidak ada data presensi
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((item, index) => (
                      <TableRow key={item.id_absensi} className="bg-white">
                        <TableCell>{start + index + 1}</TableCell>
                        <TableCell className="font-medium text-gray-900">{item.nama}</TableCell>
                        <TableCell>{item.tempat_pkl ?? "-"}</TableCell>
                        <TableCell>{item.tanggal_absensi}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(item.status_absensi)}`}>
                            {statusLabel(item.status_absensi)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => { setSelected(item); setShowDetail(true); }}
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

            {/* ===== PAGINATION ===== */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 mt-6">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">«</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">‹</button>
                {pages.map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded ${page === p ? "bg-blue-500 text-white" : "hover:bg-gray-100 text-gray-700"}`}>{p}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 text-sm rounded disabled:opacity-40 hover:bg-gray-100">»</button>
              </div>
            )}
          </div>
        </div>

        {/* ===== MODAL FILTER ===== */}
        <Modal dismissible show={showFilter} size="md" onClose={() => setShowFilter(false)}>
          <ModalHeader className="px-6 py-4 border-b border-gray-200">
            Filter Presensi
          </ModalHeader>
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="filterNama">Nama Siswa</Label>
                <TextInput
                  id="filterNama"
                  placeholder="Cari nama siswa..."
                  value={filterNama}
                  onChange={(e) => setFilterNama(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="filterStatus">Status Presensi</Label>
                <Select
                  id="filterStatus"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="mt-1"
                >
                  <option value="">Semua Status</option>
                  <option value="hadir">Hadir</option>
                  <option value="izin">Izin</option>
                  <option value="sakit">Sakit</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="filterTanggal">Tanggal</Label>
                <TextInput
                  id="filterTanggal"
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
            <Button color="blue" onClick={handleApplyFilter}>Terapkan Filter</Button>
            <Button color="light" onClick={handleResetFilter}>Reset</Button>
          </ModalFooter>
        </Modal>

        {/* ===== MODAL REKAP ===== */}
        <Modal dismissible show={showRekap} size="4xl" onClose={() => setShowRekap(false)}>
          <ModalHeader className="px-6 py-4 border-b border-gray-200">
            Rekap Presensi Siswa
          </ModalHeader>
          <ModalBody className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4 h-[420px]">

              {/* Kiri: Daftar siswa */}
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">Pilih Siswa</p>
                </div>
                {/* Search siswa */}
                <div className="px-3 py-2 border-b border-gray-100">
                  <TextInput
                    placeholder="Cari nama siswa..."
                    sizing="sm"
                    value={searchSiswa}
                    onChange={(e) => setSearchSiswa(e.target.value)}
                  />
                </div>
                <div className="overflow-y-auto flex-1">
                  {filteredSiswa.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">
                      {searchSiswa ? "Siswa tidak ditemukan" : "Tidak ada data siswa"}
                    </p>
                  ) : (
                    filteredSiswa.map((siswa) => (
                      <button
                        key={siswa.id_siswa}
                        onClick={() => handlePilihSiswa(siswa)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                          selectedSiswa?.id_siswa === siswa.id_siswa ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{siswa.nama_siswa}</p>
                        <p className="text-xs text-gray-500">{siswa.kelas_siswa} · {siswa.jurusan_siswa}</p>
                        {siswa.dudi && (
                          <p className="text-xs text-blue-500">{siswa.dudi.nama_dudi}</p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Kanan: Rekap */}
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">
                    {selectedSiswa ? `Rekap: ${selectedSiswa.nama_siswa}` : "Rekap Presensi"}
                  </p>
                </div>

                {!selectedSiswa ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Pilih siswa untuk melihat rekap</p>
                  </div>
                ) : rekapLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Memuat...</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Summary card */}
                    <div className="grid grid-cols-4 gap-2 p-3 border-b border-gray-100">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-700">{rekapSummary.total}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-600">{rekapSummary.hadir}</p>
                        <p className="text-xs text-green-500">Hadir</p>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded-lg">
                        <p className="text-lg font-bold text-yellow-600">{rekapSummary.izin}</p>
                        <p className="text-xs text-yellow-500">Izin</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded-lg">
                        <p className="text-lg font-bold text-red-600">{rekapSummary.sakit}</p>
                        <p className="text-xs text-red-500">Sakit</p>
                      </div>
                    </div>

                    {/* Tabel riwayat */}
                    <div className="overflow-y-auto flex-1">
                      {rekapData.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">Belum ada data presensi</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-gray-600 font-medium">Tanggal</th>
                              <th className="px-3 py-2 text-left text-gray-600 font-medium">Masuk</th>
                              <th className="px-3 py-2 text-left text-gray-600 font-medium">Pulang</th>
                              <th className="px-3 py-2 text-left text-gray-600 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {rekapData.map((r) => (
                              <tr key={r.id_absensi} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-700">{r.tanggal_absensi}</td>
                                <td className="px-3 py-2 text-gray-600">{r.waktu_absensi ?? "-"}</td>
                                <td className="px-3 py-2 text-gray-600">{r.waktu_pulang ?? "-"}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status_absensi)}`}>
                                    {statusLabel(r.status_absensi)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <Button
              color="blue"
              onClick={generatePDF}
              disabled={!selectedSiswa || rekapData.length === 0}
            >
              📄 Cetak PDF
            </Button>
            <Button color="gray" onClick={() => setShowRekap(false)}>Tutup</Button>
          </ModalFooter>
        </Modal>

        {/* ===== MODAL DETAIL ===== */}
        <Modal dismissible show={showDetail} size="4xl" onClose={() => { setShowDetail(false); setSelected(null); }}>
          <ModalHeader className="px-6 py-4 border-b border-gray-200">
            Detail Presensi
          </ModalHeader>
          <ModalBody className="px-6 py-4">
            {selected && (
              <form className="grid grid-cols-2 gap-4">
                {/* Kolom kiri */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="d_nama">Nama Siswa</Label>
                    <TextInput
                      id="d_nama"
                      value={selected.nama ?? "-"}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="d_pkl">Tempat PKL</Label>
                    <TextInput
                      id="d_pkl"
                      value={selected.tempat_pkl ?? "-"}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="d_tanggal">Tanggal</Label>
                    <TextInput
                      id="d_tanggal"
                      value={selected.tanggal_absensi ?? "-"}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="d_masuk">Waktu Absen Masuk</Label>
                    <TextInput
                      id="d_masuk"
                      value={selected.waktu_absensi ?? "-"}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="d_pulang">Waktu Pulang</Label>
                    <TextInput
                      id="d_pulang"
                      value={selected.waktu_pulang ?? "-"}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Kolom kanan */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="d_status">Status Presensi</Label>
                    <div className="mt-2">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor(selected.status_absensi)}`}>
                        {statusLabel(selected.status_absensi)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="d_lat">Latitude</Label>
                    <TextInput
                      id="d_lat"
                      value={selected.latitude_absensi ?? "-"}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="d_lon">Longitude</Label>
                    <TextInput
                      id="d_lon"
                      value={selected.longitude_absensi ?? "-"}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="d_alasan">Alasan</Label>
                    <TextInput
                      id="d_alasan"
                      value={selected.alasan_absensi ?? "-"}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Foto surat — full width */}
                {selected.foto_surat && (
                  <div className="col-span-2">
                    <Label>Foto / Surat Keterangan</Label>
                    <div className="mt-2">
                      <a href={selected.foto_surat} target="_blank" rel="noopener noreferrer">
                        <img
                          src={selected.foto_surat}
                          alt="Surat Keterangan"
                          className="w-full max-h-64 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                        />
                      </a>
                      <p className="text-xs text-gray-400 mt-1 text-center">Klik gambar untuk melihat ukuran penuh</p>
                    </div>
                  </div>
                )}
              </form>
            )}
          </ModalBody>
          <ModalFooter className="px-6 py-4 border-t border-gray-200">
            <Button color="gray" onClick={() => { setShowDetail(false); setSelected(null); }}>Tutup</Button>
          </ModalFooter>
        </Modal>
      </main>
    </div>
  );
}