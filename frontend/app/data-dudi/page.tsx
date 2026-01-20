"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import {
  Modal,
  Button,
  Label,
  TextInput,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
} from "flowbite-react";

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

  // =====================
  // FORM HANDLER
  // =====================
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
          body: JSON.stringify(form),
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-inter">
                    <thead className="bg-gray-100 text-left">
                      <tr>
                        <th className="px-4 py-2">No</th>
                        <th className="px-4 py-2">Nama</th>
                        <th className="px-4 py-2">Alamat</th>
                        <th className="px-4 py-2">Kontak</th>
                        <th className="px-4 py-2 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.map((dudi, index) => (
                        <tr key={dudi.id_dudi} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">{start + index + 1}</td>
                          <td className="px-4 py-2">{dudi.nama_dudi}</td>
                          <td className="px-4 py-2">{dudi.alamat_dudi}</td>
                          <td className="px-4 py-2">{dudi.kontak_dudi}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                                onClick={() => {
                                setSelectedDudi(dudi);
                                setShowDetailModal(true);
                                setIsEditMode(false);
                                }}
                                className="text-blue-500 hover:underline"
                            >
                                Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          <Modal show={showModal} size="lg" popup={true} onClose={() => setShowModal(false)}>
            <ModalHeader>
                Tambah Data Dudi
            </ModalHeader>
    
            <ModalBody>
                <form className="flex flex-col gap-4">
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
                    <TextInput
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
                        inputMode="decimal"
                        value={form.latitude_dudi}
                        onChange={handleFormChange}
                        placeholder="Masukkan latitude dudi"
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
                        inputMode="decimal"
                        value={form.longitude_dudi}
                        onChange={handleFormChange}
                        placeholder="Masukkan longitude dudi"
                        required
                    />
                </div>
                </form>
            </ModalBody>
    
            <ModalFooter className="flex justify-between">
                <Button onClick={handleSimpan} color="blue">
                    Simpan
                </Button>
                <Button onClick={() => setShowModal(false)} color="red">
                    Batal
                </Button>
            </ModalFooter>
            </Modal>
    
            <Modal
                show={showDetailModal}
                size="lg"
                popup={true}
                onClose={() => setShowDetailModal(false)}
                >
                <div className="flex items-center justify-between p-4 rounded-t dark:border-gray-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isEditMode || !selectedDudi ? "Edit Data Dudi" : "Detail Data Dudi"}
                </h3>
                <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                >
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span className="sr-only">Close modal</span>
                </button>
                </div>
    
                <ModalBody>
                    <form className="flex flex-col gap-4">
                    {selectedDudi && (
                        <>
                        <div>
                            <Label htmlFor="nama_dudi">Nama Dudi</Label>
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
                            <Label htmlFor="kontak">Kontak</Label>
                            <TextInput
                            id="kontak"
                            name="kontak"
                            value={form.kontak_dudi || selectedDudi.kontak_dudi}
                            onChange={handleFormChange}
                            readOnly={!isEditMode}
                            />
                        </div>

                        <div>
                            <Label htmlFor="latitude">Latitude</Label>
                            <TextInput
                            id="latitude"
                            name="latitude"
                            value={form.latitude_dudi || selectedDudi.latitude_dudi}
                            onChange={handleFormChange}
                            readOnly={!isEditMode}
                            />
                        </div>

                        <div>
                            <Label htmlFor="longitude">longitude</Label>
                            <TextInput
                            id="longitude"
                            name="longitude"
                            value={form.longitude_dudi || selectedDudi.longitude_dudi}
                            onChange={handleFormChange}
                            readOnly={!isEditMode}
                            />
                        </div>
                        </>
                    )}
                    </form>
                </ModalBody>
    
                <ModalFooter className="flex justify-between">
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
