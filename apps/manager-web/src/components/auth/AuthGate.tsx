"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
      return;
    }

    setReady(true);
  }, [router]);

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