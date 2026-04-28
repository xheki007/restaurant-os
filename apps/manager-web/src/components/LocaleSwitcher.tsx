"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { locales } from "@/i18n";

type Locale = (typeof locales)[number];

function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

function buildLocalizedHref(pathname: string | null, search: string, targetLocale: Locale) {
  const safePathname = pathname || `/${targetLocale}`;
  const segments = safePathname.split("/");

  if (isLocale(segments[1])) {
    segments[1] = targetLocale;
  } else {
    segments.splice(1, 0, targetLocale);
  }

  const nextPath = segments.join("/") || `/${targetLocale}`;

  return search ? `${nextPath}?${search}` : nextPath;
}

export default function LocaleSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  return (
    <div className="flex items-center gap-1">
      {locales.map((item) => (
        <Link
          key={item}
          href={buildLocalizedHref(pathname, search, item)}
          className={`rounded-xl px-2.5 py-1 text-sm transition ${
            item === locale
              ? "bg-white text-black"
              : "text-white/75 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}