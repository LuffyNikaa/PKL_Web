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
  tempat_pkl: string;
  tanggal: string;
  range_tanggal: string;
  kegiatan: string;
  dokumentasi: string | null;
};

type Siswa = {
  id_siswa: number;
  nama_siswa: string;
  kelas_siswa: string;
  jurusan_siswa: string;
  dudi?: { nama_dudi: string };
};

type RekapItem = {
  minggu_ke: number;
  range_tanggal: string;
  tanggal: string;
  kegiatan: string;
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
      setSiswaList(json.data || []);
    } catch (err) { console.error(err); }
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
        `http://localhost:8000/api/admin/jurnal-mingguan?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      const json = await res.json();
      // Tambah minggu_ke berdasarkan urutan
      const data = (json.data || [])
        .sort((a: JurnalItem, b: JurnalItem) => a.tanggal.localeCompare(b.tanggal))
        .map((item: JurnalItem, index: number) => ({
          minggu_ke:     index + 1,
          range_tanggal: item.range_tanggal,
          tanggal:       item.tanggal,
          kegiatan:      item.kegiatan,
        }));
      setRekapData(data);
    } catch (err) { console.error(err); }
    finally { setRekapLoading(false); }
  };

  const filteredSiswa = siswaList.filter((s) =>
    s.nama_siswa.toLowerCase().includes(searchSiswa.toLowerCase())
  );

  // Generate PDF
  const generatePDF = () => {
    if (!selectedSiswa || rekapData.length === 0) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

    // Header
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageW, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("REKAP JURNAL MINGGUAN PKL", pageW / 2, 14, { align: "center" });
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("Sistem Informasi PKL", pageW / 2, 22, { align: "center" });
    doc.text(`Dicetak: ${now}`, pageW / 2, 28, { align: "center" });

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
      ["Total Minggu",  `${rekapData.length} minggu`],
      ["Periode",       rekapData.length > 0
        ? `${rekapData[0].range_tanggal.split(" s/d ")[0]} s/d ${rekapData[rekapData.length - 1].range_tanggal.split(" s/d ")[1]}`
        : "-"],
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

    // Summary
    const sumY = 80;
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("Ringkasan", 14, sumY);
    doc.line(14, sumY + 2, pageW - 14, sumY + 2);

    const boxW = (pageW - 28 - 6) / 3;
    const boxes = [
      { label: "Total Minggu",   value: String(rekapData.length),       r: 200, g: 200, b: 200, tr: 50,  tg: 50,  tb: 50  },
      { label: "Minggu Pertama", value: rekapData[0]?.range_tanggal.split(" s/d ")[0] ?? "-", r: 187, g: 247, b: 208, tr: 22,  tg: 101, tb: 52  },
      { label: "Minggu Terakhir",value: rekapData[rekapData.length - 1]?.range_tanggal.split(" s/d ")[1] ?? "-", r: 191, g: 219, b: 254, tr: 29,  tg: 78,  tb: 216 },
    ];
    boxes.forEach((box, i) => {
      const bx = 14 + i * (boxW + 3);
      const by = sumY + 5;
      doc.setFillColor(box.r, box.g, box.b);
      doc.roundedRect(bx, by, boxW, 18, 2, 2, "F");
      doc.setTextColor(box.tr, box.tg, box.tb);
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text(box.value, bx + boxW / 2, by + 10, { align: "center" });
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(box.label, bx + boxW / 2, by + 15.5, { align: "center" });
    });

    // Tabel
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("Riwayat Jurnal Mingguan", 14, sumY + 32);

    autoTable(doc, {
      startY: sumY + 35,
      head: [["No", "Minggu ke-", "Periode", "Kegiatan"]],
      body: rekapData.map((r) => [r.minggu_ke, `Minggu ke-${r.minggu_ke}`, r.range_tanggal, r.kegiatan]),
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 24 },
        2: { cellWidth: 40 },
        3: { cellWidth: "auto" },
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

    doc.save(`Rekap_Jurnal_Mingguan_${selectedSiswa.nama_siswa.replace(/ /g, "_")}.pdf`);
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
                    <TableHeadCell>Tempat PKL</TableHeadCell>
                    <TableHeadCell className="text-center">Aksi</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-400 py-8">Tidak ada data jurnal mingguan</TableCell>
                    </TableRow>
                  ) : currentData.map((item, index) => (
                    <TableRow key={item.id_jurnal_mingguan} className="bg-white">
                      <TableCell>{start + index + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{item.nama}</TableCell>
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
                      <p className="text-xs text-gray-500">{siswa.kelas_siswa} · {siswa.jurusan_siswa}</p>
                      {siswa.dudi && <p className="text-xs text-blue-500">{siswa.dudi.nama_dudi}</p>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kanan: rekap */}
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">
                    {selectedSiswa ? `Rekap: ${selectedSiswa.nama_siswa}` : "Rekap Jurnal Mingguan"}
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
                        <p className="text-xs text-gray-500">Total Minggu</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-sm font-bold text-blue-600">
                          {rekapData.length > 0 ? rekapData[rekapData.length - 1].range_tanggal : "-"}
                        </p>
                        <p className="text-xs text-blue-400">Minggu Pertama</p>
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
                              <th className="px-3 py-2 text-left text-gray-600 font-medium">Minggu</th>
                              <th className="px-3 py-2 text-left text-gray-600 font-medium">Periode</th>
                              <th className="px-3 py-2 text-left text-gray-600 font-medium">Kegiatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {rekapData.map((r) => (
                              <tr key={r.minggu_ke} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-700 whitespace-nowrap font-medium">Ke-{r.minggu_ke}</td>
                                <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.range_tanggal}</td>
                                <td className="px-3 py-2 text-gray-600 max-w-[140px] truncate">{r.kegiatan}</td>
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
          <ModalHeader className="px-6 py-4 border-b border-gray-200">Detail Jurnal Mingguan</ModalHeader>
          <ModalBody className="px-6 py-4">
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
                    <Label htmlFor="d_periode">Periode Minggu</Label>
                    <TextInput id="d_periode" value={selected.range_tanggal ?? "-"} readOnly className="mt-1" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="d_kegiatan">Kegiatan</Label>
                    <textarea
                      id="d_kegiatan"
                      value={selected.kegiatan ?? "-"}
                      readOnly
                      rows={5}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 resize-none focus:outline-none"
                    />
                  </div>
                </div>

                {/* Dokumentasi full width */}
                {selected.dokumentasi && (
                  <div className="col-span-2">
                    <Label>Dokumentasi</Label>
                    <div className="mt-2">
                      <a href={selected.dokumentasi} target="_blank" rel="noopener noreferrer">
                        <img
                          src={selected.dokumentasi}
                          alt="Dokumentasi"
                          className="w-full max-h-40 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
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