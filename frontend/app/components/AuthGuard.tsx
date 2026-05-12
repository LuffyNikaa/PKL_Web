"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const publicRoutes = ["/"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isPublicRoute && !token) {
      router.replace("/");
      return;
    }

    setAuthorized(true);
  }, [pathname, router]);

  if (!authorized) return null;

  return <>{children}</>;
}
