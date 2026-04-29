import Link from "next/link";
import {
  Brain,
  CalendarDays,
  ChevronRight,
  LayoutGrid,
  Sparkles,
  Users,
  UtensilsCrossed
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import DashboardDataClient from "@/components/DashboardDataClient";

type Props = {
  params: Promise<{ locale: string }>;
};

function ActionCard({
  title,
  description,
  icon,
  href
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex gap-3">
        <div className="rounded-2xl bg-white/10 p-2.5 text-white">
          {icon}
        </div>

        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-white/50">{description}</p>
        </div>
      </div>

      <ChevronRight className="mt-1 h-4 w-4 text-white/30 transition group-hover:text-white/70" />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group flex w-full items-start justify-between rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="group flex w-full items-start justify-between rounded-3xl border border-white/10 bg-white/5 p-4 text-left opacity-70">
      {content}
    </div>
  );
}

function SidebarLink({
  href,
  label,
  active
}: {
  href?: string;
  label: string;
  active?: boolean;
}) {
  if (active) {
    return (
      <div className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black">
        {label}
      </div>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl px-4 py-3 text-sm text-white/65 transition hover:bg-white/10 hover:text-white"
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl px-4 py-3 text-sm text-white/35">
      {label}
    </div>
  );
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations({ locale });

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_14px_45px_rgba(0,0,0,0.26)] backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-black">
                ROS
              </div>

              <div>
                <p className="text-sm font-semibold text-white">Restaurant Antica</p>
                <p className="text-xs text-white/45">{t("sidebar.managerWeb")}</p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <SidebarLink
                href={`/${locale}/dashboard`}
                label={t("sidebar.dashboard")}
                active
              />
              <SidebarLink
                href={`/${locale}/reservations`}
                label={t("sidebar.reservations")}
              />
              <SidebarLink
                href="/floor-plan/editor"
                label={t("sidebar.floor")}
              />
              <SidebarLink
                href={`/${locale}/guests`}
                label={t("sidebar.guests")}
              />
              <SidebarLink
                href={`/${locale}/ai-assistant`}
                label={t("sidebar.aiAssistant")}
              />
              <SidebarLink
                href={`/${locale}/settings`}
                label={t("sidebar.settings")}
              />
            </div>

            <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-medium text-emerald-200">{t("ai.controlLayerTitle")}</p>
              </div>

              <p className="mt-2 text-sm leading-6 text-emerald-100/75">
                {t("ai.controlLayerText")}
              </p>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(85,75,255,0.35),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_14px_45px_rgba(0,0,0,0.26)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("dashboard.branchBadge")}
                  </div>

                  <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-5xl">
                    {t("dashboard.title")}
                  </h1>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 lg:text-base">
                    {t("dashboard.subtitle")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={process.env.NEXT_PUBLIC_BOOKING_WIDGET_URL || "/"}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90"
                  >
                    {t("actions.newReservation")}
                  </a>

                  <Link
                    href="/floor-plan/live"
                    className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    {t("actions.openFloor")}
                  </Link>
                </div>
              </div>
            </div>

            <DashboardDataClient locale={locale} />

            <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{t("overview.title")}</h2>
                    <p className="mt-1 text-sm text-white/50">
                      {t("overview.subtitle")}
                    </p>
                  </div>

                  <LayoutGrid className="h-5 w-5 text-white/35" />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <ActionCard
                    href={`/${locale}/reservations`}
                    title={t("overview.reservationsTitle")}
                    description={t("overview.reservationsText")}
                    icon={<CalendarDays className="h-4 w-4" />}
                  />

                  <ActionCard
                    href="/floor-plan/live"
                    title={t("overview.floorTitle")}
                    description={t("overview.floorText")}
                    icon={<UtensilsCrossed className="h-4 w-4" />}
                  />

                  <ActionCard
                    href={`/${locale}/guests`}
                    title={t("overview.guestsTitle")}
                    description={t("overview.guestsText")}
                    icon={<Users className="h-4 w-4" />}
                  />

                  <ActionCard
                    href={`/${locale}/ai-assistant`}
                    title={t("overview.assistantTitle")}
                    description={t("overview.assistantText")}
                    icon={<Brain className="h-4 w-4" />}
                  />
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{t("ai.panelTitle")}</h2>
                    <p className="mt-1 text-sm text-white/50">{t("ai.panelSubtitle")}</p>
                  </div>

                  <Brain className="h-5 w-5 text-emerald-300" />
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
                    <p className="text-sm font-medium text-amber-200">{t("ai.riskTitle")}</p>
                    <p className="mt-1 text-sm leading-6 text-amber-100/75">
                      {t("ai.riskText")}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-4">
                    <p className="text-sm font-medium text-sky-200">{t("ai.recommendationTitle")}</p>
                    <p className="mt-1 text-sm leading-6 text-sky-100/75">
                      {t("ai.recommendationText")}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <p className="text-sm font-medium text-emerald-200">{t("ai.whyTitle")}</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-100/75">
                      {t("ai.whyText")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}