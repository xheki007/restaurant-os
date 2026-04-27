import Link from "next/link";
import {notFound} from "next/navigation";
import {Bell, Globe, Search} from "lucide-react";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {locales} from "@/i18n";
import AuthGate from "@/components/auth/AuthGate";
import LogoutButton from "@/components/auth/LogoutButton";

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

const localeLabels: Record<string, string> = {
  de: "Deutsch",
  en: "English",
  it: "Italiano",
  sq: "Shqip"
};

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({locale});

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthGate>
        <div className="min-h-screen bg-[#0b1020] text-white">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1020]/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-black">
                  ROS
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">Restaurant OS</p>
                  <p className="text-xs text-white/45">{t("sidebar.managerWeb")}</p>
                </div>
              </div>

              <div className="hidden min-w-[280px] flex-1 justify-center lg:flex">
                <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/45">
                  <Search className="h-4 w-4" />
                  <span>Search reservations, guests, tables...</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white">
                  <Bell className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <Globe className="h-4 w-4 text-white/70" />
                  <div className="flex items-center gap-1">
                    {locales.map((item) => (
                      <Link
                        key={item}
                        href={`/${item}`}
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
                </div>

                <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 lg:block">
                  <p className="text-xs text-white/45">Branch</p>
                  <p className="text-sm font-medium text-white">Main Branch</p>
                </div>

                <LogoutButton />
              </div>
            </div>
          </header>

          {children}
        </div>
      </AuthGate>
    </NextIntlClientProvider>
  );
}