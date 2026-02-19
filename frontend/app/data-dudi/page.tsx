"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { Modal, Button, Label, TextInput, ModalHeader, ModalBody, ModalFooter, Select, Table, TableHead, TableRow, TableHeadCell, TableBody, TableCell, Textarea} from "flowbite-react";
import dynamic from "next/dynamic";

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

  const handleAddDudi = () => {
    resetFormDudi();
    setIsEditMode(false);
    setSelectedDudi(null);
    setShowDetailModal(true);
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
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const json = await res.json();
      setDudi(json.data || []);
    } catch (err) {
      console.error("Fetch dudi error:", err);
    }
  };

  useEffect(() => {
    fetchDudi();
  }, []);

  useEffect(() => {
    if (!showDetailModal) {
      resetFormDudi();
    }
  }, [showDetailModal]);

  // =====================
  // FORM HANDLER
  // =====================
  const handleFormChange = (e: React.ChangeEvent<any>) => {
  const { name, value } = e.target;
    setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
  };

  // =====================
  // Handle Location
  // =====================
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchDudi();
      setShowModal(false);
      setForm({
        nama_dudi: "",
        alamat_dudi: "",
        kontak_dudi: "",
        latitude_dudi: "",
        longitude_dudi: "",
      });
    } catch (err: any) {
      alert(err.message || err);
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
    latitude_dudi: form.latitude_dudi
      ? parseFloat(form.latitude_dudi)
      : null,
    longitude_dudi: form.longitude_dudi
      ? parseFloat(form.longitude_dudi)
      : null,
  };

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:8000/api/admin/dudi/${selectedDudi.id_dudi}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json.message);

    fetchDudi();
    setShowDetailModal(false);
    setSelectedDudi(null);
    setIsEditMode(false);
  } catch (err: any) {
    alert(err.message || err);
  }
};

  // =====================
  // DELETE
  // =====================
  const handleDeleteDudi = async () => {
    if (!selectedDudi) return;

    if (!confirm(`Hapus DUDI ${selectedDudi.nama_dudi}?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8000/api/admin/dudi/${selectedDudi.id_dudi}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      fetchDudi();
      setShowDetailModal(false);
      setSelectedDudi(null);
    } catch (err: any) {
      alert(err.message || err);
    }
  };

  // =====================
  // PAGINATION
  // =====================
  const data = dudi;
  const totalPages = Math.ceil(data.length / DATA_PER_PAGE);
  const start = (page - 1) * DATA_PER_PAGE;
  const currentData = dudi.slice(start, start + DATA_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
          <Sidebar user={user} />
    
          <main className="flex-1 flex flex-col">
            <PageHeader pageTitle="Data Dudi" userName={user.name} />
    
            <div className="p-6">
              <div className="bg-white rounded-xl p-6 flex flex-col min-h-[600px]">
                <h1 className="text-lg font-semibold mb-4 font-inter">
                  Daftar Data Dudi
                </h1>
    
                <button
                  onClick={() => setShowModal(true)}
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
                        <TableHeadCell>Nama</TableHeadCell>
                        <TableHeadCell>Alamat</TableHeadCell>
                        <TableHeadCell>Kontak</TableHeadCell>
                        <TableHeadCell className="text-center">Aksi</TableHeadCell>
                      </TableRow>
                    </TableHead>

                    <TableBody className="divide-y">
                      {currentData.map((dudi, index) => (
                        <TableRow
                          key={dudi.id_dudi}
                          className="bg-white dark:border-gray-700 dark:bg-gray-800"
                        >
                          <TableCell>{start + index + 1}</TableCell>
                          <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                            {dudi.nama_dudi}
                          </TableCell>
                          <TableCell>{dudi.alamat_dudi}</TableCell>
                          <TableCell>{dudi.kontak_dudi}</TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => {
                                setSelectedDudi(dudi);
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
    
          {/* ===== MODAL TAMBAH Dudi ===== */}
          <Modal dismissible show={showModal} size="4xl" onClose={() => setShowModal(false)}>
            <ModalHeader className="px-6 py-4 border-b border-gray-200">Tambah Data Dudi</ModalHeader>
              <ModalBody className="px-6 py-4">
                <form className="grid grid-cols-2 gap-4">
                  <div  className="space-y-5">
                    <div>
                      <Label htmlFor="nama_dudi">Nama Dudi</Label>
                      <TextInput
                        id="nama_dudi"
                        name="nama_dudi"
                        value={form.nama_dudi}
                        onChange={handleFormChange}
                        placeholder="Masukkan nama dudi"
                        required
                      />
                    </div>
    
                    <div>
                      <Label htmlFor="alamat_dudi">Alamat</Label>
                      <Textarea
                        id="alamat_dudi"
                        name="alamat_dudi"
                        value={form.alamat_dudi}
                        onChange={handleFormChange}
                        placeholder="Masukkan alamat"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="kontak_dudi">Kontak</Label>
                      <TextInput
                        id="kontak_dudi"
                        name="kontak_dudi"
                        value={form.kontak_dudi}
                        onChange={handleFormChange}
                        placeholder="Masukkan kontak"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="latitude_dudi">Latitude DUDI</Label>
                      <TextInput
                        id="latitude_dudi"
                        name="latitude_dudi"
                        type="number"
                        step="any"
                        value={form.latitude_dudi}
                        readOnly
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="longitude_dudi">Longitude DUDI</Label>
                      <TextInput
                        id="longitude_dudi"
                        name="longitude_dudi"
                        type="number"
                        step="any"
                        value={form.longitude_dudi}
                        readOnly
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="h-[420px] rounded-lg overflow-hidden">
                      <MapComponent
                        onLocationSelect={handleLocationSelect}
                        latLng={[
                          form.latitude_dudi
                            ? Number(form.latitude_dudi)
                            : -7.250445,      // default Indonesia
                          form.longitude_dudi
                            ? Number(form.longitude_dudi)
                            : 112.768845
                        ]}
                        isEditing={false}
                        isAddMode={true}
                      />
                    </div>
                  </div>
                </form>
                
              </ModalBody>
    
              <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
                <Button onClick={handleSimpan} color="blue">
                  Simpan
                </Button>
                <Button onClick={() => setShowModal(false)} color="red">
                  Batal
                </Button>
              </ModalFooter>
            </Modal>
    
            {/* ===== MODAL DETAIL Dudi ===== */}
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
                <ModalBody className="px-6 py-4">
                  {selectedDudi && (
                    <form className="grid grid-cols-2 gap-6">

                      {/* ===== KIRI: FORM ===== */}
                      <div className="space-y-5">
                        <div>
                          <Label htmlFor="nama_dudi">Nama DUDI</Label>
                          <TextInput
                            id="nama_dudi"
                            name="nama_dudi"
                            value={form.nama_dudi || selectedDudi.nama_dudi}
                            onChange={handleFormChange}
                            readOnly={!isEditMode}
                          />
                        </div>

                        <div>
                          <Label htmlFor="alamat_dudi">Alamat</Label>
                          <TextInput
                            id="alamat_dudi"
                            name="alamat_dudi"
                            value={form.alamat_dudi || selectedDudi.alamat_dudi}
                            onChange={handleFormChange}
                            readOnly={!isEditMode}
                          />
                        </div>

                        <div>
                          <Label htmlFor="kontak_dudi">Kontak</Label>
                          <TextInput
                            id="kontak_dudi"
                            name="kontak_dudi"
                            value={form.kontak_dudi || selectedDudi.kontak_dudi}
                            onChange={handleFormChange}
                            readOnly={!isEditMode}
                          />
                        </div>

                        <div>
                          <Label htmlFor="latitude_dudi">Latitude</Label>
                          <TextInput
                            id="latitude_dudi"
                            name="latitude_dudi"
                            value={form.latitude_dudi || selectedDudi.latitude_dudi}
                            readOnly
                          />
                        </div>

                        <div>
                          <Label htmlFor="longitude_dudi">Longitude</Label>
                          <TextInput
                            id="longitude_dudi"
                            name="longitude_dudi"
                            value={form.longitude_dudi || selectedDudi.longitude_dudi}
                            readOnly
                          />
                        </div>

                        {isEditMode && (
                          <p className="text-xs text-gray-500">
                            * Geser atau klik peta untuk memperbarui lokasi DUDI
                          </p>
                        )}
                      </div>

                      {/* ===== KANAN: MAP ===== */}
                      <div className="h-[420px] rounded-lg overflow-hidden">
                        <MapComponent
                          onLocationSelect={handleLocationSelect}
                          latLng={[
                            form.latitude_dudi
                              ? Number(form.latitude_dudi)
                              : Number(selectedDudi.latitude_dudi) || -7.250445,
                            form.longitude_dudi
                              ? Number(form.longitude_dudi)
                              : Number(selectedDudi.longitude_dudi) || 112.768845
                          ]}
                          isEditing={isEditMode}
                          isAddMode={false}
                        />
                      </div>

                    </form>
                  )}
                </ModalBody>
    
                <ModalFooter className="px-6 py-4 flex justify-between border-t border-gray-200">
                  {!isEditMode ? (
                    <>
                      <Button color="blue" onClick={handleEditDudi}>
                        Edit
                      </Button>
                      <Button color="red" onClick={handleDeleteDudi}>
                        Hapus
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button color="blue" onClick={handleUpdateDudi}>
                        Simpan
                      </Button>
                      <Button
                        color="red"
                        onClick={() => {
                          setIsEditMode(false);
                          setForm({
                            nama_dudi: "",
                            alamat_dudi: "",
                            kontak_dudi: "",
                            latitude_dudi: "",
                            longitude_dudi: "",
                          });
                        }}
                      >
                        Batal
                      </Button>
                    </>
                  )}
                </ModalFooter>
            </Modal>
        </div>
  );
}
