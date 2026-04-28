import Link from "next/link";
import { ArrowLeft, ChevronRight, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function GuestsPage({ params }: Props) {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "guestsPage" });

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
                <Users className="h-3.5 w-3.5" />
                {t("breadcrumb")}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-5xl">
                {t("title")}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60 lg:text-base">
                {t("subtitle")}
              </p>
            </div>

            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToDashboard")}
            </Link>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{t("cardTitle")}</h2>
                <p className="mt-1 text-sm text-white/50">
                  {t("cardSubtitle")}
                </p>
              </div>

              <Link
                href={`/${locale}/reservations`}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                {t("openReservations")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/60">
              {t("placeholder")}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}