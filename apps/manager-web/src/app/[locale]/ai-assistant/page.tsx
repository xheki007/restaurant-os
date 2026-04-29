import Link from "next/link";
import { ArrowLeft, Brain } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AiAssistantClient from "@/components/AiAssistantClient";

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

          <AiAssistantClient locale={locale} />
        </div>
      </div>
    </main>
  );
}
