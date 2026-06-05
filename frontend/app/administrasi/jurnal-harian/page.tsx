"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PageHeader from "../../components/PageHeader";
import {
  Modal, Button, Label, TextInput,
  ModalHeader, ModalBody, ModalFooter,
  Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow,
} from "flowbite-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type JurnalItem = {
  id_jurnal_harian: number;
  nama: string;
  tempat_pkl: string;
  tanggal: string;
  kegiatan: string;
  status_jurnal?: string;
  approve_by?: string;
  approve_at?: string;
  catatan?: string;
};

type Siswa = {
  id_siswa: number;
  nama_siswa: string;
  kelas_siswa: string;
  jurusan_siswa: string;
  dudi?: { nama_dudi: string };
  periode?: { nama_periode: string };
};

type User = { name: string; email: string };

const DATA_PER_PAGE = 10;

export default function DataJurnalHarianPage() {
  const [user, setUser]                   = useState<User | null>(null);
  const [jurnalList, setJurnalList]       = useState<JurnalItem[]>([]);
  const [siswaList, setSiswaList]         = useState<Siswa[]>([]);
  const [selected, setSelected]           = useState<JurnalItem | null>(null);
  const [showDetail, setShowDetail]       = useState(false);
  const [page, setPage]                   = useState(1);

  // Filter modal
  const [showFilter, setShowFilter]       = useState(false);
  const [filterNama, setFilterNama]       = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [activeFilter, setActiveFilter]   = useState({ nama: "", tanggal: "" });

  // Rekap modal
  const [showRekap, setShowRekap]         = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [rekapData, setRekapData]         = useState<JurnalItem[]>([]);
  const [rekapLoading, setRekapLoading]   = useState(false);
  const [searchSiswa, setSearchSiswa]     = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const fetchJurnal = async (filter = activeFilter) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const params = new URLSearchParams();
      if (filter.nama)    params.append("nama", filter.nama);
      if (filter.tanggal) params.append("tanggal", filter.tanggal);
      const res = await fetch(
        `http://localhost:8000/api/admin/jurnal-harian?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      const json = await res.json();
      console.log("Jurnal data:", json.data); // Debug log
      setJurnalList(json.data || []);
      setPage(1);
    } catch (err) {
      console.error("Fetch jurnal error:", err);
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
      console.log("Siswa data:", json.data); // Debug log
      const siswaFormatted = (json.data || []).map((s: any) => ({
        id_siswa: s.id_siswa,
        nama_siswa: s.nama_siswa,
        kelas_siswa: s.kelas ? `${s.kelas.tingkat_kelas} ${s.kelas.jurusan?.nama_jurusan || ''} ${s.kelas.rombel}`.replace(/\s+/g, ' ').trim() : '-',
        jurusan_siswa: s.kelas?.jurusan?.nama_jurusan || '-',
        dudi: s.dudi || null,
        periode: s.periode || null,
      }));
      setSiswaList(siswaFormatted);
    } catch (err) { console.error("Fetch siswa error:", err); }
  };

  useEffect(() => { fetchJurnal({ nama: "", tanggal: "" }); }, []);

  const handleApplyFilter = () => {
    const f = { nama: filterNama, tanggal: filterTanggal };
    setActiveFilter(f);
    fetchJurnal(f);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setFilterNama(""); setFilterTanggal("");
    const empty = { nama: "", tanggal: "" };
    setActiveFilter(empty);
    fetchJurnal(empty);
    setShowFilter(false);
  };

  const handleOpenRekap = async () => {
    await fetchSiswa();
    setSelectedSiswa(null);
    setRekapData([]);
    setSearchSiswa("");
    setShowRekap(true);
  };

  const handlePilihSiswa = async (siswa: Siswa) => {
    setSelectedSiswa(siswa);
    setRekapLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ nama: siswa.nama_siswa });
      const res = await fetch(
        `http://localhost:8000/api/admin/jurnal-harian?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      const json = await res.json();
      console.log("Rekap data for", siswa.nama_siswa, ":", json.data); // Debug log
      setRekapData(json.data || []);
    } catch (err) { console.error("Fetch rekap error:", err); }
    finally { setRekapLoading(false); }
  };

  const filteredSiswa = siswaList.filter((s) =>
    s.nama_siswa.toLowerCase().includes(searchSiswa.toLowerCase())
  );

  // Generate PDF rekap jurnal
  const generatePDF = () => {
    if (!selectedSiswa || rekapData.length === 0) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

    // ===== HEADER (KOP SURAT RESMI) =====
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("REKAP JURNAL HARIAN PRAKTEK KERJA LAPANGAN (PKL)", pageW / 2, 14, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SISTEM INFORMASI PKL - MONITORING JURNAL SISWA", pageW / 2, 20, { align: "center" });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Tanggal Cetak: ${now}`, pageW / 2, 26, { align: "center" });

    // Double line below header (Kop border)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(14, 29, pageW - 14, 29);
    doc.setLineWidth(0.2);
    doc.line(14, 30, pageW - 14, 30);

    // Info siswa
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("Informasi Siswa", 14, 44);
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
    doc.line(14, 46, pageW - 14, 46);

    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const infoKiri = [
      ["Nama Siswa", selectedSiswa.nama_siswa],
      ["Kelas",      selectedSiswa.kelas_siswa],
      ["Jurusan",    selectedSiswa.jurusan_siswa],
    ];
    const infoKanan = [
      ["Tempat PKL",    selectedSiswa.dudi?.nama_dudi ?? "-"],
      ["Total Jurnal",  `${rekapData.length} entri`],
      ["Periode",       selectedSiswa.periode?.nama_periode ?? "-"],
    ];

    let y = 52;
    infoKiri.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold"); doc.text(label, 14, y);
      doc.setFont("helvetica", "normal"); doc.text(`: ${value}`, 50, y);
      y += 7;
    });
    y = 52;
    infoKanan.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold"); doc.text(label, pageW / 2, y);
      doc.setFont("helvetica", "normal"); doc.text(`: ${value}`, pageW / 2 + 32, y);
      y += 7;
    });

    // Helper format hari dan tanggal
    const formatHariTanggal = (dateStr: string) => {
      try {
        let dateObj: Date;
        if (dateStr.includes("-")) {
          const parts = dateStr.split("-");
          if (parts[0].length === 4) {
            dateObj = new Date(dateStr);
          } else {
            dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        } else {
          dateObj = new Date(dateStr);
        }

        if (isNaN(dateObj.getTime())) return dateStr;

        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const dayName = days[dateObj.getDay()];

        const formattedDate = dateObj.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }).replace(/\//g, "-");

        return `${dayName}, ${formattedDate}`;
      } catch {
        return dateStr;
      }
    };

    // Tabel
    const tableStartY = 80;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("Riwayat Jurnal Harian", 14, tableStartY);

    // Sort rekapData ascending (oldest first)
    const sortedRekap = [...rekapData].sort((a, b) => {
      const parseDate = (dStr: string) => {
        if (!dStr || dStr === "-") return 0;
        const [d, m, y] = dStr.split("-").map(Number);
        return new Date(y, m - 1, d).getTime();
      };
      return parseDate(a.tanggal) - parseDate(b.tanggal);
    });

    autoTable(doc, {
      startY: tableStartY + 4,
      theme: "grid",
      head: [["No", "Hari/Tanggal", "Kegiatan Jurnal", "Status Approval", "Catatan DUDI", "Paraf"]],
      body: sortedRekap.map((r, i) => {
        let statusText = "Pending";
        if (r.status_jurnal === "approved") statusText = "Disetujui";
        else if (r.status_jurnal === "rejected") statusText = "Ditolak";

        return [
          i + 1,
          formatHariTanggal(r.tanggal),
          r.kegiatan,
          statusText,
          r.catatan && r.catatan !== "-" ? r.catatan : "", // tampilkan catatan dudi jika ada dari db, jika tidak kosong
          ""  // area kosong untuk paraf manual DUDI
        ];
      }),
      styles: { lineColor: [180, 180, 180], lineWidth: 0.2 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8.5, valign: "middle" },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 35 },
        2: { cellWidth: 63 },
        3: { cellWidth: 24 }, // status approval
        4: { cellWidth: 36 }, // catatan dudi
        5: { cellWidth: 16, halign: "center" }, // paraf dudi
      },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(150); doc.setFont("helvetica", "normal");
      doc.text(`Halaman ${i} dari ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
      doc.text("Dokumen ini digenerate otomatis oleh Sistem Informasi PKL", pageW / 2, doc.internal.pageSize.getHeight() - 4, { align: "center" });
    }

    doc.save(`Rekap_Jurnal_${selectedSiswa.nama_siswa.replace(/ /g, "_")}.pdf`);
  };

  const hasActiveFilter = activeFilter.nama || activeFilter.tanggal;
  const totalPages  = Math.ceil(jurnalList.length / DATA_PER_PAGE);
  const start       = (page - 1) * DATA_PER_PAGE;
  const currentData = jurnalList.slice(start, start + DATA_PER_PAGE);
  const pages       = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Jurnal Harian" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">Daftar Jurnal Harian</h1>

            {/* Tombol Rekap & Filter */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={handleOpenRekap}
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-inter"
              >
                📊 Rekap
              </button>
              <button
                onClick={() => setShowFilter(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-inter border ${
                  hasActiveFilter ? "bg-blue-50 border-blue-400 text-blue-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                🔍 Filter
                {hasActiveFilter && (
                  <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {[activeFilter.nama, activeFilter.tanggal].filter(Boolean).length}
                  </span>
                )}
              </button>

              {hasActiveFilter && (
                <div className="flex items-center gap-2 flex-wrap">
                  {activeFilter.nama && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Nama: {activeFilter.nama}</span>
                  )}
                  {activeFilter.tanggal && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Tanggal: {activeFilter.tanggal}</span>
                  )}
                  <button onClick={handleResetFilter} className="text-xs text-red-500 hover:text-red-700 underline">Hapus filter</button>
                </div>
              )}
            </div>

            {/* Tabel */}
            <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
              <Table hoverable className="text-sm font-inter">
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableHeadCell>No</TableHeadCell>
                    <TableHeadCell>Nama</TableHeadCell>
                    <TableHeadCell>Tempat PKL</TableHeadCell>
                    <TableHeadCell>Tanggal</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-8">Tidak ada data jurnal</TableCell>
                    </TableRow>
                  ) : currentData.map((item, index) => (
                    <TableRow key={item.id_jurnal_harian} className="bg-white">
                      <TableCell>{start + index + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{item.nama}</TableCell>
                      <TableCell>{item.tempat_pkl ?? "-"}</TableCell>
                      <TableCell>{item.tanggal}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => { setSelected(item); setShowDetail(true); }}
                          className="text-blue-500 hover:text-blue-700 font-medium text-sm"
                        >
                          Detail
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
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
          <ModalHeader className="px-6 py-4 border-b border-gray-200">Filter Jurnal Harian</ModalHeader>
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="filterNama">Nama Siswa</Label>
                <TextInput id="filterNama" placeholder="Cari nama siswa..." value={filterNama} onChange={(e) => setFilterNama(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="filterTanggal">Tanggal</Label>
                <TextInput id="filterTanggal" type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="mt-1" />
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
          <ModalHeader className="px-6 py-4 border-b border-gray-200">Rekap Jurnal Harian Siswa</ModalHeader>
          <ModalBody className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4 h-[420px]">
              {/* Kiri: daftar siswa */}
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">Pilih Siswa</p>
                </div>
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
                  ) : filteredSiswa.map((siswa) => (
                    <button
                      key={siswa.id_siswa}
                      onClick={() => handlePilihSiswa(siswa)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                        selectedSiswa?.id_siswa === siswa.id_siswa ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{siswa.nama_siswa}</p>
                      <p className="text-xs text-gray-500">{siswa.kelas_siswa} · {siswa.jurusan_siswa}</p>
                      {siswa.dudi && <p className="text-xs text-blue-500">{siswa.dudi.nama_dudi}</p>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kanan: rekap jurnal */}
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">
                    {selectedSiswa ? `Rekap: ${selectedSiswa.nama_siswa}` : "Rekap Jurnal"}
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
                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-2 p-3 border-b border-gray-100">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-lg font-bold text-gray-700">{rekapData.length}</p>
                        <p className="text-xs text-gray-500">Total Jurnal</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-lg flex flex-col justify-center">
                        <p className="text-sm font-bold text-blue-600 truncate max-w-full">
                          {selectedSiswa.periode?.nama_periode ?? "-"}
                        </p>
                        <p className="text-xs text-blue-400">Periode PKL</p>
                      </div>
                    </div>

                    {/* Tabel riwayat */}
                    <div className="overflow-y-auto flex-1">
                      {rekapData.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">Belum ada jurnal</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-gray-600 font-medium">Tanggal</th>
                              <th className="px-3 py-2 text-left text-gray-600 font-medium">Kegiatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {rekapData.map((r) => (
                              <tr key={r.id_jurnal_harian} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{r.tanggal}</td>
                                <td className="px-3 py-2 text-gray-600 max-w-[180px] truncate">{r.kegiatan}</td>
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
            <Button color="blue" onClick={generatePDF} disabled={!selectedSiswa || rekapData.length === 0}>
              📄 Cetak PDF
            </Button>
            <Button color="gray" onClick={() => setShowRekap(false)}>Tutup</Button>
          </ModalFooter>
        </Modal>

        {/* ===== MODAL DETAIL ===== */}
        <Modal dismissible show={showDetail} size="4xl" onClose={() => { setShowDetail(false); setSelected(null); }}>
          <ModalHeader className="px-6 py-4 border-b border-gray-200">Detail Jurnal Harian</ModalHeader>
          <ModalBody className="px-6 py-4 max-h-[65vh] overflow-y-auto">
            {selected && (
              <form className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="d_nama">Nama Siswa</Label>
                    <TextInput id="d_nama" value={selected.nama ?? "-"} readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="d_pkl">Tempat PKL</Label>
                    <TextInput id="d_pkl" value={selected.tempat_pkl ?? "-"} readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="d_tanggal">Tanggal</Label>
                    <TextInput id="d_tanggal" value={selected.tanggal ?? "-"} readOnly className="mt-1" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="d_kegiatan">Kegiatan</Label>
                    <textarea
                      id="d_kegiatan"
                      value={selected.kegiatan ?? "-"}
                      readOnly
                      rows={6}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 resize-none focus:outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-2 border-t border-gray-200 pt-4 mt-2">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Informasi Approval Jurnal</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="d_status">Status Jurnal</Label>
                        <div className="mt-1.5">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                            selected.status_jurnal === 'approved' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : selected.status_jurnal === 'rejected' 
                              ? 'bg-red-100 text-red-800 border border-red-200' 
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {selected.status_jurnal === 'approved' 
                              ? 'Disetujui' 
                              : selected.status_jurnal === 'rejected' 
                              ? 'Ditolak' 
                              : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="d_approve_by">Disetujui/Ditolak Oleh</Label>
                        <TextInput id="d_approve_by" value={selected.approve_by ?? "-"} readOnly className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="d_approve_at">Tanggal Aksi</Label>
                        <TextInput id="d_approve_at" value={selected.approve_at ?? "-"} readOnly className="mt-1" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="d_catatan">Catatan</Label>
                        <textarea
                          id="d_catatan"
                          value={selected.catatan ?? "-"}
                          readOnly
                          rows={6}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 resize-none focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
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