"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { getCurrentContext, getReservations, type ReservationListItem } from "@/lib/api";

type Props = {
  locale: string;
};

function StatCard({
  title,
  value,
  subtitle
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.22)] backdrop-blur">
      <p className="text-sm text-white/55">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm text-white/45">{subtitle}</p>
    </div>
  );
}

function ReservationRow({
  name,
  time,
  guests,
  table,
  status
}: {
  name: string;
  time: string;
  guests: string;
  table: string;
  status: string;
}) {
  return (
    <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_0.8fr] items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm">
      <div className="font-medium text-white">{name}</div>
      <div className="flex items-center gap-2 text-white/65">
        <Clock3 className="h-4 w-4" />
        <span>{time}</span>
      </div>
      <div className="text-white/65">{guests}</div>
      <div className="text-white/65">{table}</div>
      <div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
          {status}
        </span>
      </div>
    </div>
  );
}

function formatTime(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function DashboardDataClient({ locale }: Props) {
  const t = useTranslations("dashboardLive");

  const [items, setItems] = useState<ReservationListItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const ctx = getCurrentContext();
        const tenantId = ctx?.tenantId || "";
        const branchId = ctx?.branchId || "";

        if (!tenantId || !branchId) {
          setItems([]);
          setError("");
          return;
        }

        const today = new Date().toISOString().slice(0, 10);

        const response = await getReservations({
          tenantId,
          branchId,
          dateFrom: today + "T00:00:00.000Z",
          dateTo: today + "T23:59:59.999Z"
        });

        const rows = Array.isArray((response as any)?.items)
          ? (response as any).items
          : Array.isArray(response as any)
            ? (response as any)
            : [];

        setItems(rows);
        setError("");
      } catch (e: any) {
        setItems([]);
        setError(e?.message || t("warning"));
      }
    }

    load();
  }, [t]);

  const summary = useMemo(() => {
    return {
      total: items.length,
      confirmed: items.filter((item) => item.status === "CONFIRMED").length,
      seated: items.filter((item) => item.status === "SEATED").length,
      cancelled: items.filter((item) => item.status === "CANCELLED").length,
      pending: items.filter((item) => item.status === "PENDING").length
    };
  }, [items]);

  const previewRows = useMemo(() => {
    return items.slice(0, 4).map((item) => {
      const name =
        item.guest?.fullName?.trim() ||
        item.guest?.email ||
        item.confirmationCode;

      const time = formatTime(item.startAt || item.reservationDate || "", locale);
      const guests = String(item.partySize) + " " + t("guestsLabel");
      const table =
        item.assignedTable?.code ||
        item.assignedTable?.name ||
        item.assignedCombination?.name ||
        "-";

      const status =
        item.status === "CONFIRMED"
          ? t("confirmed")
          : item.status === "PENDING"
            ? t("pending")
            : item.status === "SEATED"
              ? t("seated")
              : item.status === "CANCELLED"
                ? t("cancelled")
                : item.status;

      return {
        id: item.id,
        name,
        time,
        guests,
        table,
        status
      };
    });
  }, [items, locale, t]);

  return (
    <>
      {error ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100/80">
          {t("warning")}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("todayReservations")}
          value={String(summary.total)}
          subtitle={String(summary.pending) + " " + t("pendingSubtitle")}
        />
        <StatCard
          title={t("occupiedTables")}
          value={String(summary.confirmed)}
          subtitle={String(summary.confirmed) + " " + t("confirmedSubtitle")}
        />
        <StatCard
          title={t("expectedGuests")}
          value={String(summary.seated)}
          subtitle={String(summary.seated) + " " + t("seatedSubtitle")}
        />
        <StatCard
          title={t("aiAlerts")}
          value={String(summary.cancelled)}
          subtitle={String(summary.cancelled) + " " + t("cancelledSubtitle")}
        />
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t("previewTitle")}
            </h2>
            <p className="mt-1 text-sm text-white/50">
              {t("previewSubtitle")}
            </p>
          </div>

          <Link
            href={`/${locale}/reservations`}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            {t("viewAll")}
          </Link>
        </div>

        <div className="mt-5 hidden grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_0.8fr] gap-3 px-4 text-xs uppercase tracking-[0.18em] text-white/35 md:grid">
          <div>{t("guest")}</div>
          <div>{t("time")}</div>
          <div>{t("party")}</div>
          <div>{t("table")}</div>
          <div>{t("status")}</div>
        </div>

        {previewRows.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
            {t("noReservations")}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {previewRows.map((row) => (
              <ReservationRow
                key={row.id}
                name={row.name || "-"}
                time={row.time || "-"}
                guests={row.guests || "-"}
                table={row.table || "-"}
                status={row.status || "-"}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}