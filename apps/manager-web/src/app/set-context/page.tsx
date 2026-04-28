"use client";

import { useEffect } from "react";

const allowedLocales = ["de", "en", "it", "sq"] as const;

function getSafeLocale(value: string | null) {
  if (value && allowedLocales.includes(value as (typeof allowedLocales)[number])) {
    return value;
  }

  return "de";
}

export default function SetContextPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locale = getSafeLocale(params.get("locale"));

    localStorage.setItem("tenantId", "cmocvsx2r0000xsvlzty3goyo");
    localStorage.setItem("branchId", "cmocvsx2v0002xsvlz7q2i5wy");

    window.location.replace(`/${locale}/dashboard`);
  }, []);

  return null;
}