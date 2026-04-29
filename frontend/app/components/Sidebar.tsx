"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/dist/client/components/navigation";
import Link from "next/dist/client/link";

type User = { name: string; email: string; avatar?: string };

function getDiceBearAvatar(seed: string) {
  return `https://api.dicebear.com/9.x/rings/svg?backgroundColor=d1d4f9&seed=${encodeURIComponent(seed)}`;
}

export default function Sidebar({ user }: { user: User }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [openAdmin, setOpenAdmin] = useState(false);
  const [openJadwal, setOpenJadwal] = useState(false);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) setRole(savedRole);

    setOpenAdmin(pathname.includes("/administrasi"));
    setOpenJadwal(pathname.includes("/jadwal"));
    }, [pathname]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await fetch("http://localhost:8000/api/logout", {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) { console.error(err); }
    finally { localStorage.clear(); router.push("/"); }
  };

  return (
    <aside className="w-64 h-screen bg-white flex flex-col justify-between sticky top-0 overflow-hidden">
      <div>
        {/* Profile */}
        <Link
          href="/profile"
          className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition rounded-lg mx-2 mt-2 ${pathname === "/profile" ? "bg-[#DBEAFE]" : ""}`}
        >
          <Image src={getDiceBearAvatar(user.email)} alt="avatar" width={50} height={50} className="rounded-full object-cover bg-gray-100 flex-shrink-0" unoptimized />
          <div className="overflow-hidden">
            <p className={`font-semibold text-sm font-inter truncate ${pathname === "/profile" ? "text-blue-700" : ""}`}>{user.name}</p>
            <p className="text-xs text-gray-500 font-inter truncate">{user.email}</p>
            <p className="text-xs text-blue-500 font-inter mt-0.5">Lihat Profil →</p>
          </div>
        </Link>

        <nav className="p-4 space-y-5 text-sm">

          {/* Dashboard */}
          <div>
            <p className="text-black text-xl font-bold mb-1 font-inter">Dashboard</p>
            <Link href="/dashboard" className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition ${pathname === "/dashboard" ? "bg-[#DBEAFE] text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-100"}`}>
              <img src="/icons/dashboard.png" alt="Dashboard" className="w-[25px] h-[25px]" />
              <span className="font-inter">Dashboard</span>
            </Link>
          </div>

          {/* Kelola Data */}
          <div>
            <p className="text-black text-xl font-bold mb-1 font-inter">Kelola Data</p>
            <div className="space-y-1">
              {role === "admin" && (
                <>
                  <MenuItem icon="/icons/logout.png" label="Data Guru"  href="/data-guru"  pathname={pathname} />
                  <MenuItem icon="/icons/dudi.png"   label="Data DuDi"  href="/data-dudi"  pathname={pathname} />
                </>
              )}
              {(role === "admin" || role === "guru") && (
                <MenuItem icon="/icons/logout.png" label="Data Siswa" href="/data-siswa" pathname={pathname} />
              )}
            </div>
          </div>

          {/* Manajemen Siswa */}
          <div>
            <p className="text-black text-xl font-bold mb-1 font-inter">Manajemen Siswa</p>

            {/* Administrasi */}
            <button onClick={() => setOpenAdmin(!openAdmin)} className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100">
              <span className="flex items-center gap-3">
                <SidebarIcon src="/icons/administrasi.png" />
                Administrasi
              </span>
              <SidebarIcon src={openAdmin ? "/icons/panah-atas.png" : "/icons/panah-bawah.png"} size={14} />
            </button>
            {openAdmin && (
              <div className="ml-9 mt-1 space-y-1">
                <SubMenuItem icon="/icons/presensi.png" label="Presensi"         href="/administrasi/presensi"       pathname={pathname} />
                <SubMenuItem icon="/icons/jurnal.png"   label="Jurnal Harian"    href="/administrasi/jurnal-harian"  pathname={pathname} />
                <SubMenuItem icon="/icons/jurnal.png"   label="Jurnal Mingguan"  href="/administrasi/jurnal-mingguan" pathname={pathname} />
              </div>
            )}

            {/* Jadwal */}
            <button onClick={() => setOpenJadwal(!openJadwal)} className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-100 mt-1">
              <span className="flex items-center gap-3">
                <SidebarIcon src="/icons/jadwal.png" />
                Jadwal
              </span>
              <SidebarIcon src={openJadwal ? "/icons/panah-atas.png" : "/icons/panah-bawah.png"} size={14} />
            </button>
            {openJadwal && (
              <div className="ml-9 mt-1 space-y-1">
                <SubMenuItem icon="/icons/monitoring.png"   label="Monitoring"   href="/jadwal/monitoring"   pathname={pathname} />
                <SubMenuItem icon="/icons/monitoring.png"   label="Presentasi"   href="/jadwal/presentasi"   pathname={pathname} />
              </div>
            )}
          </div>

        </nav>
      </div>

      {/* Logout */}
      <div className="p-4">
        <button onClick={handleLogout} className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">
          <span className="flex items-center gap-3 font-inter">
            <SidebarIcon src="/icons/logout.png" />
            Logout {role || "User"}
          </span>
          <SidebarIcon src="/icons/logoutt.png" />
        </button>
      </div>
    </aside>
  );
}

function SidebarIcon({ src, size = 25 }: { src: string; size?: number }) {
  return <Image src={src} alt="icon" width={size} height={size} />;
}

function MenuItem({ icon, label, href, pathname }: { icon: string; label: string; href: string; pathname: string }) {
  const isActive = pathname === href;
  return (
    <Link href={href} className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition ${isActive ? "bg-[#DBEAFE] text-blue-700 font-semibold" : "hover:bg-gray-100 text-gray-700"}`}>
      <SidebarIcon src={icon} />
      {label}
    </Link>
  );
}

function SubMenuItem({ icon, label, href, pathname }: { icon: string; label: string; href: string; pathname: string }) {
  const isActive = pathname === href;
  return (
    <Link href={href} className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition ${isActive ? "bg-[#DBEAFE] text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-100"}`}>
      <SidebarIcon src={icon} size={20} />
      {label}
    </Link>
  );
}