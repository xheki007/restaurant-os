"use client";

import { usePathname } from "next/navigation";

function getLocaleFromPathname(pathname: string | null) {
  const firstSegment = String(pathname || "")
    .split("/")
    .filter(Boolean)[0];

  if (firstSegment === "de" || firstSegment === "en" || firstSegment === "it" || firstSegment === "sq") {
    return firstSegment;
  }

  return "sq";
}

export default function LogoutButton() {
  const pathname = usePathname();

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("tenantSlug");
    localStorage.removeItem("branchId");

    const locale = getLocaleFromPathname(pathname);
    window.location.href = "/" + locale + "/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
    >
      Logout
    </button>
  );
}
