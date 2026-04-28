import Link from "next/link";
import { ArrowLeft, Brain, ChevronRight, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AiAssistantPage({ params }: Props) {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "aiAssistantPage" });

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
                <Brain className="h-3.5 w-3.5" />
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

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-300">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">{t("controlTitle")}</h2>
                  <p className="mt-1 text-sm text-white/50">
                    {t("controlSubtitle")}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <p className="text-sm font-medium text-amber-200">{t("riskTitle")}</p>
                  <p className="mt-1 text-sm leading-6 text-amber-100/75">
                    {t("riskText")}
                  </p>
                </div>

                <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-4">
                  <p className="text-sm font-medium text-sky-200">{t("recommendationTitle")}</p>
                  <p className="mt-1 text-sm leading-6 text-sky-100/75">
                    {t("recommendationText")}
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <p className="text-sm font-medium text-emerald-200">{t("whyTitle")}</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-100/75">
                    {t("whyText")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
              <div>
                <h2 className="text-lg font-semibold text-white">{t("nextTargetsTitle")}</h2>
                <p className="mt-1 text-sm text-white/50">
                  {t("nextTargetsSubtitle")}
                </p>
              </div>

              <div className="mt-6 space-y-3 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {t("targetPeak")}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {t("targetNoShow")}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {t("targetSeating")}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {t("targetStaff")}
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  {t("returnToDashboard")}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}