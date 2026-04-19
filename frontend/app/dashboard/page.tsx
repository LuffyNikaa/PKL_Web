"use client";

import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

type JurusanStat = { label: string; total: number };

type DashboardData = {
  total_siswa: number;
  total_guru: number;
  total_dudi: number;
  siswa_per_jurusan: JurusanStat[];
};

type User = { name: string; email: string };

// Warna tetap sesuai urutan jurusan + guru + dudi
const CARD_CONFIG = [
  { key: "TKJ",     color: "#3B82F6" },
  { key: "RPL",     color: "#A855F7" },
  { key: "DKV",     color: "#F97316" },
  { key: "Kuliner", color: "#22C55E" },
  { key: "Guru",    color: "#64748B" },
  { key: "DuDi",    color: "#14B8A6" },
];

function getColor(label: string, index: number): string {
  const found = CARD_CONFIG.find((c) =>
    label.toLowerCase().includes(c.key.toLowerCase())
  );
  return found?.color ?? CARD_CONFIG[index % CARD_CONFIG.length].color;
}

export default function DashboardPage() {
  const [user, setUser]       = useState<User | null>(null);
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // Semua card: jurusan + guru + dudi
  const allCards = [
    ...(data?.siswa_per_jurusan ?? []).map((j) => ({
      label: `Siswa ${j.label}`,
      value: j.total,
      color: getColor(j.label, 0),
    })),
    { label: "Guru", value: data?.total_guru ?? 0, color: "#64748B" },
    { label: "DuDi", value: data?.total_dudi ?? 0, color: "#14B8A6" },
  ];

  // Bagi jadi 2 baris (3 atas, 3 bawah)
  const row1 = allCards.slice(0, 3);
  const row2 = allCards.slice(3, 6);

  // Data chart
  const chartData = allCards.map((c) => ({
    name:  c.label.replace("Siswa ", ""),
    total: c.value,
    color: c.color,
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar user={user} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <PageHeader pageTitle="Dashboard" userName={user.name} />

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400 text-sm font-inter">Memuat data...</p>
            </div>
          ) : data ? (
            <>
              {/* ===== STAT CARDS ===== */}
              <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                {/* Baris 1 */}
                <div className="grid grid-cols-3 gap-4">
                  {row1.map((card) => (
                    <div
                      key={card.label}
                      className="flex flex-col items-center justify-center rounded-2xl py-8 px-4"
                      style={{ backgroundColor: card.color }}
                    >
                      <p
                        className="font-inter font-bold text-center leading-tight"
                        style={{ fontSize: 24, color: "#000000" }}
                      >
                        {card.label}
                      </p>
                      <p
                        className="font-inter font-bold mt-2"
                        style={{ fontSize: 48, color: "#000000", lineHeight: 1 }}
                      >
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Baris 2 */}
                <div className="grid grid-cols-3 gap-4">
                  {row2.map((card) => (
                    <div
                      key={card.label}
                      className="flex flex-col items-center justify-center rounded-2xl py-8 px-4"
                      style={{ backgroundColor: card.color }}
                    >
                      <p
                        className="font-inter font-bold text-center leading-tight"
                        style={{ fontSize: 24, color: "#000000" }}
                      >
                        {card.label}
                      </p>
                      <p
                        className="font-inter font-bold mt-2"
                        style={{ fontSize: 48, color: "#000000", lineHeight: 1 }}
                      >
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== CHART ===== */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-2xl font-bold font-inter mb-6">Visualisasi Data</h2>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 13, fontFamily: "Inter, sans-serif", fill: "#6B7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 13, fontFamily: "Inter, sans-serif", fill: "#6B7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8, border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontFamily: "Inter, sans-serif",
                      }}
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={80}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400 text-sm font-inter">Gagal memuat data</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}