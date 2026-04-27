import Link from "next/link";
import {ArrowLeft, Brain, ChevronRight, Sparkles} from "lucide-react";
import {getTranslations, setRequestLocale} from "next-intl/server";

type Props = {
  params: Promise<{locale: string}>;
};

export default async function AiAssistantPage({params}: Props) {
  const {locale} = await params;

  setRequestLocale(locale);

  const t = await getTranslations({locale});

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
                <Brain className="h-3.5 w-3.5" />
                {t("sidebar.aiAssistant")}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-5xl">
                {t("sidebar.aiAssistant")}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60 lg:text-base">
                AI suggestions, risk warnings, capacity insights and operational recommendations will live here.
              </p>
            </div>

            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-300">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white">AI control layer</h2>
                  <p className="mt-1 text-sm text-white/50">
                    Suggestions only. Final decision stays with staff.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
                  <p className="text-sm font-medium text-amber-200">Risk warning</p>
                  <p className="mt-1 text-sm leading-6 text-amber-100/75">
                    Detect reservation pressure, no-show risk, and service bottlenecks before they affect operations.
                  </p>
                </div>

                <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-4">
                  <p className="text-sm font-medium text-sky-200">Smart recommendation</p>
                  <p className="mt-1 text-sm leading-6 text-sky-100/75">
                    Recommend seating moves, guest prioritization and flow adjustments based on live activity.
                  </p>
                </div>

                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <p className="text-sm font-medium text-emerald-200">Why this matters</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-100/75">
                    This page is now connected and ready for the next phase when real AI outputs get wired to backend signals.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
              <div>
                <h2 className="text-lg font-semibold text-white">Next build targets</h2>
                <p className="mt-1 text-sm text-white/50">
                  Clean roadmap for this module.
                </p>
              </div>

              <div className="mt-6 space-y-3 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Peak-hour prediction
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  No-show scoring
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Seating optimization suggestions
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  Staff allocation hints
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/${locale}/dashboard`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  Return to dashboard
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