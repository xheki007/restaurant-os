"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

function getLocaleFromPathname(pathname: string | null) {
  const firstSegment = String(pathname || "")
    .split("/")
    .filter(Boolean)[0];

  if (firstSegment === "de" || firstSegment === "en" || firstSegment === "it" || firstSegment === "sq") {
    return firstSegment;
  }

  return "sq";
}

export default function AuthGate({ children }: Props) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const currentPath = String(pathname || "");
    const isLoginRoute = currentPath.endsWith("/login");

    if (isLoginRoute) {
      setReady(true);
      return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
      const locale = getLocaleFromPathname(pathname);
      window.location.replace("/" + locale + "/login");
      return;
    }

    setReady(true);
  }, [pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1020] text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70">
          Checking access...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
