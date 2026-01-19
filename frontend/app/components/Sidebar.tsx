"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/dist/client/components/navigation";
import Link from "next/dist/client/link";

type User = {
    name: string;
    email: string;
    avatar?: string;
};

function getDiceBearAvatar(seed: string) {
    return `https://api.dicebear.com/9.x/avataaars/svg?backgroundColor=b6e3f4&seed=${encodeURIComponent(
        seed
    )}`;
}

export default function Sidebar({ user }: { user: User }) {
    const router = useRouter();
    const [openAdmin, setOpenAdmin] = useState(true);
    const [role, setRole] = useState<string>("");
    const pathname = usePathname();
    const isActive = pathname === "/dashboard";

    // ambil role dari localStorage
    useEffect(() => {
        const savedRole = localStorage.getItem("role");
        if (savedRole) setRole(savedRole);
    }, []);

    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        try {
            await fetch("http://localhost:8000/api/logout", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (err) {
            console.error("Logout error", err);
        } finally {
            localStorage.clear();
            router.push("/");
        }
    };

  return (
    <aside className="w-64 h-screen bg-white flex flex-col justify-between">
        {/* TOP */}
        <div>
            {/* PROFILE */}
            <div className="flex items-center gap-3 p-4">
                <Image
                    src={getDiceBearAvatar(user.email)}
                    alt="avatar"
                    width={50}
                    height={50}
                    className="rounded-full object-cover bg-gray-100"
                    unoptimized
                />
                <div>
                    <p className="font-semibold text-sm font-inter">{user.name}</p>
                    <p className="text-xs text-gray-500 font-inter">{user.email}</p>
                </div>
            </div>

            {/* MENU */}
            <nav className="p-4 space-y-6 text-sm">
                <div>
                    <p className="text-black text-xl font-bold mb-1 font-inter">
                        Dashboard
                    </p>

                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition
                        ${
                            isActive
                            ? "bg-[#DBEAFE] text-blue-700 font-semibold"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}>
                        {/* ICON DI KIRI */}
                        <img
                            src="/icons/dashboard.png"
                            alt="Dashboard"
                            className="w-[25px] h-[25px]"
                        />

                        {/* LABEL */}
                        <span className="font-inter">Dashboard</span>
                    </Link>
                </div>

                {/* KELOLA DATA */}
                <div>
                    <p className="text-black text-xl font-bold mb-1 font-inter">
                        Kelola Data
                    </p>
                    <div className="space-y-1">
                        <MenuItem
                            icon="/icons/logout.png"
                            label="Data Guru"
                            href="/data-guru"
                            pathname={pathname}
                        />
                        <MenuItem icon="/icons/dudi.svg" label="Data DuDi" />
                        <MenuItem icon="/icons/siswa.svg" label="Data Siswa" />
                    </div>
                </div> 
                {/* MANAJEMEN SISWA */}
          <div>
            <p className="text-gray-400 uppercase text-xs mb-2">
              Manajemen Siswa
            </p>

            <button
              onClick={() => setOpenAdmin(!openAdmin)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <span className="flex items-center gap-3">
                <SidebarIcon src="/icons/administrasi.svg" />
                Administrasi
              </span>
              <SidebarIcon
                src={
                  openAdmin
                    ? "/icons/chevron-up.svg"
                    : "/icons/chevron-down.svg"
                }
                size={14}
              />
            </button>

            {openAdmin && (
              <div className="ml-9 mt-1 space-y-1">
                <SubMenuItem icon="/icons/jadwal.svg" label="Jadwal" />
                <SubMenuItem
                  icon="/icons/sertifikat.svg"
                  label="Cetak Sertifikat"
                />
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* BOTTOM */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
        >
          {/* KIRI */}
          <span className="flex items-center gap-3 font-inter">
            <SidebarIcon src="/icons/logout.png" />
            Logout {role || "User"}
          </span>
          {/* KANAN */}
          <SidebarIcon src="/icons/logoutt.png" />
        </button>
      </div>
    </aside>
  );
}

/* ===== COMPONENT KECIL ===== */

function SidebarIcon({ src, size = 25 }: { src: string; size?: number }) {
  return <Image src={src} alt="icon" width={size} height={size} />;
}

function MenuItem({
  icon,
  label,
  href,
  pathname,
}: {
  icon: string;
  label: string;
  href?: string;
  pathname?: string;
}) {
  const isActive = href && pathname === href;

  if (href) {
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition w-[25px] h-[25px]"
          ${
            isActive
              ? "bg-[#DBEAFE] text-blue-700 font-semibold"
              : "hover:bg-gray-100"
          }
        `}
      >
        <SidebarIcon src={icon} />
        {label}
      </Link>
    );
  }

  // fallback (menu lain tetap button)
  return (
    <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100">
      <SidebarIcon src={icon} />
      {label}
    </button>
  );
}

function SubMenuItem({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600">
      <SidebarIcon src={icon} size={16} />
      {label}
    </button>
  );
}
