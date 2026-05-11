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

  const [showDetailJurusan, setShowDetailJurusan] = useState(false);
  const [showDetailKelas, setShowDetailKelas] = useState(false);

  const [selectedJurusan, setSelectedJurusan] =
    useState<Jurusan | null>(null);

  const [selectedKelas, setSelectedKelas] =
    useState<Kelas | null>(null);

  const [isEditJurusan, setIsEditJurusan] = useState(false);
  const [isEditKelas, setIsEditKelas] = useState(false);

  const [jurusanForm, setJurusanForm] =
    useState(emptyJurusan);

  const [kelasForm, setKelasForm] =
    useState(emptyKelas);

  useEffect(() => {
    const userData = localStorage.getItem("user");

    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchJurusan = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:8000/api/admin/jurusan",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const json = await res.json();

      setJurusanList(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKelas = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:8000/api/admin/kelas",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

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

  const handleJurusanChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setJurusanForm({
      ...jurusanForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleKelasChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setKelasForm({
      ...kelasForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleTambahJurusan = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:8000/api/admin/jurusan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(jurusanForm),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message);
      }

      fetchJurusan();

      setShowJurusanModal(false);
      setJurusanForm(emptyJurusan);

    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTambahKelas = async () => {
    try {
      if (
        !kelasForm.tingkat_kelas ||
        !kelasForm.rombel ||
        !kelasForm.id_jurusan
      ) {
        alert("Semua field wajib diisi");
        return;
      }

      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:8000/api/admin/kelas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify(kelasForm),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message);
      }

      fetchKelas();

      setShowKelasModal(false);
      setKelasForm(emptyKelas);

    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditJurusan = () => {
    if (!selectedJurusan) return;

    setJurusanForm({
      nama_jurusan: selectedJurusan.nama_jurusan,
    });

    setIsEditJurusan(true);
  };

  const handleEditKelas = () => {
    if (!selectedKelas) return;

    setKelasForm({
      tingkat_kelas: selectedKelas.tingkat_kelas,
      rombel: selectedKelas.rombel,
      id_jurusan: selectedKelas.id_jurusan.toString(),
    });

    setIsEditKelas(true);
  };

  const handleUpdateJurusan = async () => {
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

      if (!res.ok) {
        throw new Error(json.message);
      }

      fetchJurusan();

      setShowDetailJurusan(false);
      setSelectedJurusan(null);
      setIsEditJurusan(false);

    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateKelas = async () => {
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

      if (!res.ok) {
        throw new Error(json.message);
      }

      fetchKelas();

      setShowDetailKelas(false);
      setSelectedKelas(null);
      setIsEditKelas(false);

    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteJurusan = async () => {
    if (!selectedJurusan) return;

    if (
      !confirm(
        `Hapus jurusan ${selectedJurusan.nama_jurusan}?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8000/api/admin/jurusan/${selectedJurusan.id_jurusan}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message);
      }

      fetchJurusan();

      setShowDetailJurusan(false);
      setSelectedJurusan(null);

    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteKelas = async () => {
    if (!selectedKelas) return;

    if (
      !confirm(
        `Hapus kelas ${selectedKelas.tingkat_kelas} ${selectedKelas.rombel}?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8000/api/admin/kelas/${selectedKelas.id_kelas}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message);
      }

      fetchKelas();

      setShowDetailKelas(false);
      setSelectedKelas(null);

    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalJurusanPages = Math.ceil(
    jurusanList.length / DATA_PER_PAGE
  );

  const startJurusan =
    (pageJurusan - 1) * DATA_PER_PAGE;

  const currentJurusan = jurusanList.slice(
    startJurusan,
    startJurusan + DATA_PER_PAGE
  );

  const totalKelasPages = Math.ceil(
    kelasList.length / DATA_PER_PAGE
  );

  const startKelas =
    (pageKelas - 1) * DATA_PER_PAGE;

  const currentKelas = kelasList.slice(
    startKelas,
    startKelas + DATA_PER_PAGE
  );

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader
          pageTitle="Data Kelas"
          userName={user.name}
        />

        <div className="p-6 space-y-6">

          {/* ================= JURUSAN ================= */}
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[400px]">

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold font-inter">
                Data Jurusan
              </h1>

              <button
                onClick={() => {
                  setJurusanForm(emptyJurusan);
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
                    <TableHeadCell className="text-center">
                      Aksi
                    </TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody className="divide-y">
                  {currentJurusan.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-gray-400"
                      >
                        Tidak ada data jurusan
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentJurusan.map((jurusan, index) => (
                      <TableRow key={jurusan.id_jurusan}>
                        <TableCell>
                          {startJurusan + index + 1}
                        </TableCell>

                        <TableCell>
                          {jurusan.nama_jurusan}
                        </TableCell>

                        <TableCell className="text-center">
                          <button
                            onClick={() => {
                              setSelectedJurusan(jurusan);
                              setShowDetailJurusan(true);
                              setIsEditJurusan(false);
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
          </div>

          {/* ================= KELAS ================= */}
          <div className="bg-white rounded-xl p-6 flex flex-col min-h-[400px]">

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold font-inter">
                Data Kelas
              </h1>

              <button
                onClick={() => {
                  setKelasForm(emptyKelas);
                  setShowKelasModal(true);
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
                    <TableHeadCell>Tingkat</TableHeadCell>
                    <TableHeadCell>Rombel</TableHeadCell>
                    <TableHeadCell>Jurusan</TableHeadCell>
                    <TableHeadCell className="text-center">
                      Aksi
                    </TableHeadCell>
                  </TableRow>
                </TableHead>

                <TableBody className="divide-y">
                  {currentKelas.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-400"
                      >
                        Tidak ada data kelas
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentKelas.map((kelas, index) => (
                      <TableRow key={kelas.id_kelas}>
                        <TableCell>
                          {startKelas + index + 1}
                        </TableCell>

                        <TableCell>
                          {kelas.tingkat_kelas}
                        </TableCell>

                        <TableCell>
                          {kelas.rombel}
                        </TableCell>

                        <TableCell>
                          {kelas.jurusan?.nama_jurusan || "-"}
                        </TableCell>

                        <TableCell className="text-center">
                          <button
                            onClick={() => {
                              setSelectedKelas(kelas);
                              setShowDetailKelas(true);
                              setIsEditKelas(false);
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
          </div>
        </div>
      </main>

      {/* ================= MODAL TAMBAH JURUSAN ================= */}
      <Modal
        dismissible
        show={showJurusanModal}
        size="md"
        onClose={() => setShowJurusanModal(false)}
      >
        <ModalHeader>Tambah Jurusan</ModalHeader>

        <ModalBody>
          <div>
            <Label>Nama Jurusan</Label>

            <TextInput
              name="nama_jurusan"
              value={jurusanForm.nama_jurusan}
              onChange={handleJurusanChange}
              placeholder="Masukkan nama jurusan"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="blue" onClick={handleTambahJurusan}>
            Simpan
          </Button>

          <Button
            color="gray"
            onClick={() => setShowJurusanModal(false)}
          >
            Batal
          </Button>
        </ModalFooter>
      </Modal>

      {/* ================= MODAL TAMBAH KELAS ================= */}
      <Modal
        dismissible
        show={showKelasModal}
        size="xl"
        onClose={() => setShowKelasModal(false)}
      >
        <ModalHeader>Tambah Kelas</ModalHeader>

        <ModalBody>
          <div className="space-y-4">

            <div>
              <Label>Tingkat Kelas</Label>

              <Select
                name="tingkat_kelas"
                value={kelasForm.tingkat_kelas}
                onChange={handleKelasChange}
              >
                <option value="">Pilih Tingkat</option>
                <option value="X">X</option>
                <option value="XI">XI</option>
                <option value="XII">XII</option>
              </Select>
            </div>

            <div>
              <Label>Rombel</Label>

              <TextInput
                name="rombel"
                value={kelasForm.rombel}
                onChange={handleKelasChange}
                placeholder="Contoh: 1"
              />
            </div>

            <div>
              <Label>Jurusan</Label>

              <Select
                name="id_jurusan"
                value={kelasForm.id_jurusan}
                onChange={handleKelasChange}
              >
                <option value="">
                  Pilih Jurusan
                </option>

                {jurusanList.map((jurusan) => (
                  <option
                    key={jurusan.id_jurusan}
                    value={jurusan.id_jurusan}
                  >
                    {jurusan.nama_jurusan}
                  </option>
                ))}
              </Select>
            </div>

          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="blue" onClick={handleTambahKelas}>
            Simpan
          </Button>

          <Button
            color="gray"
            onClick={() => setShowKelasModal(false)}
          >
            Batal
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}