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
  id_jurnal_mingguan: number;
  nama: string;
  kelas: string;
  tempat_pkl: string;
  tanggal: string;
  range_tanggal: string;
  minggu_ke: number;
  kegiatan: string;
  dokumentasi: string | null;
};

type Siswa = {
  id_siswa: number;
  nama_siswa: string;
  kelas: string;
  jurusan_siswa: string;
  dudi?: { nama_dudi: string };
  periode?: { nama_periode: string };
};

type RekapItem = {
  minggu_ke: number;
  range_tanggal: string;
  tanggal: string;
  kegiatan: string;
  dokumentasi: string | null;
};

type User = { name: string; email: string };

const DATA_PER_PAGE = 10;

export default function DataJurnalMingguanPage() {
  const [user, setUser]                   = useState<User | null>(null);
  const [jurnalList, setJurnalList]       = useState<JurnalItem[]>([]);
  const [siswaList, setSiswaList]         = useState<Siswa[]>([]);
  const [selected, setSelected]           = useState<JurnalItem | null>(null);
  const [showDetail, setShowDetail]       = useState(false);
  const [page, setPage]                   = useState(1);

  // Filter
  const [showFilter, setShowFilter]       = useState(false);
  const [filterNama, setFilterNama]       = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [activeFilter, setActiveFilter]   = useState({ nama: "", tanggal: "" });

  // Rekap
  const [showRekap, setShowRekap]         = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [rekapData, setRekapData]         = useState<RekapItem[]>([]);
  const [rekapLoading, setRekapLoading]   = useState(false);
  const [searchSiswa, setSearchSiswa]     = useState("");
  const [generating, setGenerating]       = useState(false);

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
        `http://localhost:8000/api/admin/jurnal-mingguan?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      const json = await res.json();
      setJurnalList(json.data || []);
      setPage(1);
    } catch (err) { console.error(err); }
  };

  const fetchSiswa = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/admin/siswa", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      // Format siswa dengan kelas
      const siswaFormatted = (json.data || []).map((s: any) => ({
        id_siswa: s.id_siswa,
        nama_siswa: s.nama_siswa,
        kelas: s.kelas ? `${s.kelas.tingkat_kelas} ${s.kelas.jurusan?.nama_jurusan || ''} ${s.kelas.rombel}`.replace(/\s+/g, ' ').trim() : '-',
        jurusan_siswa: s.kelas?.jurusan?.nama_jurusan || '-',
        dudi: s.dudi || null,
        periode: s.periode || null,
      }));
      setSiswaList(siswaFormatted);
    } catch (err) { console.error(err); }
  };

  const fetchRekapBySiswa = async (siswa: Siswa) => {
    setRekapLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8000/api/admin/jurnal-mingguan/siswa/${siswa.id_siswa}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      const json = await res.json();
      setRekapData(json.data || []);
    } catch (err) { console.error(err); }
    finally { setRekapLoading(false); }
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
    await fetchRekapBySiswa(siswa);
  };

  const filteredSiswa = siswaList.filter((s) =>
    s.nama_siswa.toLowerCase().includes(searchSiswa.toLowerCase())
  );

  // Generate PDF
  const generatePDF = async () => {
    if (!selectedSiswa || rekapData.length === 0) return;
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const now = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

      // Preload semua gambar ke base64 secara paralel
      const preloadedImages: { [key: number]: string | null } = {};
      await Promise.all(
        rekapData.map(async (r) => {
          if (r.dokumentasi) {
            if (r.dokumentasi.startsWith("data:")) {
              // Jika data sudah dalam format base64 dari backend, langsung pakai tanpa fetch!
              preloadedImages[r.minggu_ke] = r.dokumentasi;
            } else {
              try {
                const res = await fetch(r.dokumentasi);
                const blob = await res.blob();
                const base64 = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
                preloadedImages[r.minggu_ke] = base64;
              } catch (e) {
                console.error("Gagal memuat gambar untuk minggu ke-", r.minggu_ke, e);
                preloadedImages[r.minggu_ke] = null;
              }
            }
          } else {
            preloadedImages[r.minggu_ke] = null;
          }
        })
      );

      const drawFotoPlaceholder = (d: typeof doc, x: number, y: number, w: number, h: number) => {
        d.setDrawColor(220, 220, 220);
        d.setFillColor(248, 250, 252);
        d.rect(x, y, w, h, "FD");
        d.setFontSize(8); d.setTextColor(150); d.setFont("helvetica", "normal");
        d.text("Tempel Foto Dokumentasi Di Sini", x + w / 2, y + h / 2 - 2, { align: "center" });
        d.setFontSize(7);
        d.text("(Atau upload melalui aplikasi agar otomatis tercetak)", x + w / 2, y + h / 2 + 3, { align: "center" });
      };

      rekapData.forEach((r, idx) => {
        if (idx > 0) {
          doc.addPage();
        }

        // ===== HEADER (KOP SURAT RESMI) =====
        doc.setTextColor(20, 20, 20);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("LAPORAN JURNAL MINGGUAN PRAKTEK KERJA LAPANGAN (PKL)", pageW / 2, 14, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("SISTEM INFORMASI PKL - MONITORING JURNAL SISWA", pageW / 2, 19, { align: "center" });
        
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Tanggal Cetak: ${now}`, pageW / 2, 24, { align: "center" });

        // Double line below header (Kop border)
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.6);
        doc.line(14, 27, pageW - 14, 27);
        doc.setLineWidth(0.2);
        doc.line(14, 28, pageW - 14, 28);

        // ===== INFO SISWA (DUAL COLUMN) =====
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(9);
        
        // Kiri
        doc.setFont("helvetica", "bold"); doc.text("Nama Siswa", 14, 34);
        doc.setFont("helvetica", "normal"); doc.text(`: ${selectedSiswa.nama_siswa}`, 38, 34);
        
        doc.setFont("helvetica", "bold"); doc.text("Kelas/Jurusan", 14, 39);
        doc.setFont("helvetica", "normal"); doc.text(`: ${selectedSiswa.kelas} / ${selectedSiswa.jurusan_siswa}`, 38, 39);
        
        // Kanan
        doc.setFont("helvetica", "bold"); doc.text("Tempat PKL", pageW / 2 + 10, 34);
        doc.setFont("helvetica", "normal"); doc.text(`: ${selectedSiswa.dudi?.nama_dudi ?? "-"}`, pageW / 2 + 35, 34);
        
        doc.setFont("helvetica", "bold"); doc.text("Periode", pageW / 2 + 10, 39);
        doc.setFont("helvetica", "normal"); doc.text(`: ${selectedSiswa.periode?.nama_periode ?? "-"}`, pageW / 2 + 35, 39);

        // Thin separator
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(14, 43, pageW - 14, 43);

        // ===== A. LAPORAN KEGIATAN MINGGUAN =====
        doc.setFontSize(9.5); doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(`A. LAPORAN KEGIATAN MINGGUAN (MINGGU KE-${r.minggu_ke})`, 14, 49);
        doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Rentang Tanggal: ${r.range_tanggal}`, 14, 53);

        // Kegiatan Box
        const kegiatanY = 56;
        const kegiatanH = 50;
        doc.setDrawColor(180, 180, 180);
        doc.setFillColor(250, 250, 252);
        doc.rect(14, kegiatanY, pageW - 28, kegiatanH, "FD");

        doc.setFontSize(9); doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "normal");
        const kegiatanLines = doc.splitTextToSize(r.kegiatan || "Tidak ada rincian kegiatan mingguan.", pageW - 34);
        doc.text(kegiatanLines, 17, kegiatanY + 5);

        // ===== B. FOTO DOKUMENTASI KEGIATAN =====
        const fotoTitleY = kegiatanY + kegiatanH + 6;
        doc.setFontSize(9.5); doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text("B. FOTO DOKUMENTASI KEGIATAN", 14, fotoTitleY);

        const fotoY = fotoTitleY + 3;
        const fotoW = 80;
        const fotoH = 50;
        const fotoX = (pageW - fotoW) / 2;

        const base64Img = preloadedImages[r.minggu_ke];
        if (base64Img) {
          try {
            doc.addImage(base64Img, "JPEG", fotoX, fotoY, fotoW, fotoH);
            // Draw image border
            doc.setDrawColor(180, 180, 180);
            doc.rect(fotoX, fotoY, fotoW, fotoH, "S");
          } catch (e) {
            drawFotoPlaceholder(doc, fotoX, fotoY, fotoW, fotoH);
          }
        } else {
          drawFotoPlaceholder(doc, fotoX, fotoY, fotoW, fotoH);
        }

        // ===== C. CATATAN / EVALUASI INSTRUKTUR =====
        const catatanTitleY = fotoY + fotoH + 6;
        doc.setFontSize(9.5); doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text("C. CATATAN / EVALUASI INSTRUKTUR DUDI", 14, catatanTitleY);

        const catatanY = catatanTitleY + 3;
        const catatanH = 22;
        doc.setDrawColor(180, 180, 180);
        doc.rect(14, catatanY, pageW - 28, catatanH, "S");

        // Draw horizontal ruled lines for manual writing inside comments
        doc.setDrawColor(220, 220, 220);
        doc.line(18, catatanY + 7, pageW - 18, catatanY + 7);
        doc.line(18, catatanY + 14, pageW - 18, catatanY + 14);

        // ===== SIGNATURE AREA =====
        const sigY = pageH - 36;
        doc.setFontSize(9); doc.setTextColor(30, 30, 30); doc.setFont("helvetica", "normal");
        doc.text("Pembimbing Lapangan / Instruktur DUDI,", pageW - 75, sigY);
        doc.text("( __________________________________ )", pageW - 75, sigY + 20);
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(150); doc.setFont("helvetica", "normal");
        doc.text(`Halaman ${i} dari ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
        doc.text("Dokumen ini digenerate otomatis oleh Sistem Informasi PKL", pageW / 2, doc.internal.pageSize.getHeight() - 4, { align: "center" });
      }

      doc.save(`Rekap_Jurnal_Mingguan_${selectedSiswa.nama_siswa.replace(/ /g, "_")}.pdf`);
    } catch (err) {
      console.error("Gagal membuat PDF Jurnal Mingguan:", err);
    } finally {
      setGenerating(false);
    }
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
        <PageHeader pageTitle="Jurnal Mingguan" userName={user.name} />

        <div className="p-6">
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
            <h1 className="text-lg font-semibold mb-4 font-inter">Daftar Jurnal Mingguan</h1>

            {/* Tombol */}
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
                  {activeFilter.nama && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Nama: {activeFilter.nama}</span>}
                  {activeFilter.tanggal && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Minggu: {activeFilter.tanggal}</span>}
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
                    <TableHeadCell>Kelas</TableHeadCell>
                    <TableHeadCell>Tempat PKL</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-400 py-8">Tidak ada data jurnal mingguan</TableCell>
                    </TableRow>
                  ) : currentData.map((item, index) => (
                    <TableRow key={item.id_jurnal_mingguan} className="bg-white">
                      <TableCell>{start + index + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{item.nama}</TableCell>
                      <TableCell>{item.kelas || "-"}</TableCell>
                      <TableCell>{item.tempat_pkl ?? "-"}</TableCell>
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
          <ModalHeader className="px-6 py-4 border-b border-gray-200">Filter Jurnal Mingguan</ModalHeader>
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="filterNama">Nama Siswa</Label>
                <TextInput id="filterNama" placeholder="Cari nama siswa..." value={filterNama} onChange={(e) => setFilterNama(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="filterTanggal">Tanggal (dalam minggu yang dicari)</Label>
                <TextInput id="filterTanggal" type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="mt-1" />
                <p className="text-xs text-gray-400 mt-1">Masukkan tanggal manapun dalam minggu yang ingin dicari</p>
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
          <ModalHeader className="px-6 py-4 border-b border-gray-200">Rekap Jurnal Mingguan Siswa</ModalHeader>
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
                      <p className="text-xs text-gray-500">{siswa.kelas} · {siswa.jurusan_siswa}</p>
                      {siswa.dudi && <p className="text-xs text-blue-500">{siswa.dudi.nama_dudi}</p>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kanan: rekap */}
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

                    {/* List minggu */}
                    <div className="overflow-y-auto flex-1">
                      {rekapData.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">Belum ada jurnal mingguan</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-gray-600 font-medium">Minggu Ke</th>
                              <th className="px-3 py-2 text-left text-gray-600 font-medium">Kegiatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {rekapData.map((r) => (
                              <tr key={r.minggu_ke} className="hover:bg-gray-50">
                                <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                                  <div className="font-semibold text-gray-900">Minggu ke-{r.minggu_ke}</div>
                                  <div className="text-[10px] text-gray-500 mt-0.5">{r.range_tanggal}</div>
                                </td>
                                <td className="px-3 py-3 text-gray-600">{r.kegiatan}</td>
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
            <Button color="blue" onClick={generatePDF} disabled={!selectedSiswa || rekapData.length === 0 || generating}>
              {generating ? "⏳ Memproses PDF..." : "📄 Cetak PDF"}
            </Button>
            <Button color="gray" onClick={() => setShowRekap(false)} disabled={generating}>Tutup</Button>
          </ModalFooter>
        </Modal>

        {/* ===== MODAL DETAIL ===== */}
        <Modal dismissible show={showDetail} size="4xl" onClose={() => { setShowDetail(false); setSelected(null); }}>
          <ModalHeader className="px-6 py-4 border-b border-gray-200">Detail Jurnal Mingguan</ModalHeader>
          <ModalBody className="px-6 py-4 max-h-[65vh] overflow-y-auto">
            {selected && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label>Nama Siswa</Label>
                    <TextInput value={selected.nama ?? "-"} readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label>Kelas</Label>
                    <TextInput value={selected.kelas ?? "-"} readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label>Tempat PKL</Label>
                    <TextInput value={selected.tempat_pkl ?? "-"} readOnly className="mt-1" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Tanggal</Label>
                    <TextInput value={selected.range_tanggal ?? "-"} readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label>Minggu ke-</Label>
                    <TextInput value={selected.minggu_ke ?? "-"} readOnly className="mt-1" />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Kegiatan</Label>
                  <textarea
                    value={selected.kegiatan ?? "-"}
                    readOnly
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 resize-none focus:outline-none"
                  />
                </div>

                {/* Dokumentasi */}
                {selected.dokumentasi && (
                  <div className="col-span-2">
                    <Label>Dokumentasi</Label>
                    <div className="mt-2">
                      <a href={selected.dokumentasi} target="_blank" rel="noopener noreferrer">
                        <img
                          src={selected.dokumentasi}
                          alt="Dokumentasi"
                          className="w-full max-h-60 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                        />
                      </a>
                      <p className="text-xs text-gray-400 mt-1 text-center">Klik gambar untuk melihat ukuran penuh</p>
                    </div>
                  </div>
                )}
              </div>
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