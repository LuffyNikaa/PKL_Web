"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

interface User {
  id: number;
  name: string;
  email: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/");
      return;
    }

    setUser(JSON.parse(userData));
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:8000/api/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    localStorage.clear();
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <Sidebar
        user={{
          name: user.name,
          email: user.email,
        }}
      />

      {/* CONTENT */}
      <main className="flex-1 flex flex-col">
        {/* PAGE HEADER */}
        <PageHeader pageTitle="Dashboard" userName={user.name} />

        {/* PAGE CONTENT */}
        <div className="p-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h1 className="text-2xl font-bold mb-2">Selamat Datang</h1>

            <p className="text-lg mb-6">👤 {user.name}</p>

            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Logout ({localStorage.getItem("role")})
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
