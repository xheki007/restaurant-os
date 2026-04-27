"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("accessToken");
    router.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
    >
      Logout
    </button>
  );
}