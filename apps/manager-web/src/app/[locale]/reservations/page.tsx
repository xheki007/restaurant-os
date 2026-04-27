"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, ChevronRight } from "lucide-react";
import {
  getCurrentContext,
  getReservations
} from "@/lib/api";

type ReservationListItem = {
  id: string;
  status: string;
  partySize?: number;
  startAt?: string;
  reservationDate?: string;
  confirmationCode?: string;
  guest?: {
    fullName?: string | null;
    email?: string | null;
  } | null;
  assignedTable?: {
    code?: string | null;
    name?: string | null;
  } | null;
};

function getTodayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTime(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function mapGuestName(item: ReservationListItem) {
  return item.guest?.fullName?.trim() || item.guest?.email || item.confirmationCode || "-";
}

function mapTableName(item: ReservationListItem) {
  return item.assignedTable?.code || item.assignedTable?.name || "-";
}

function mapStatusTone(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "PENDING":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    case "SEATED":
      return "border-sky-400/20 bg-sky-400/10 text-sky-200";
    case "CANCELLED":
      return "border-red-400/20 bg-red-400/10 text-red-200";
    default:
      return "border-white/10 bg-white/5 text-white/75";
  }
}

export default function ReservationsPage() {
  const params = useParams<{ locale?: string }>();
  const searchParams = useSearchParams();

  const locale = String(params?.locale || "en");
  const initialDate = searchParams.get("date") || getTodayDateString();

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [items, setItems] = useState<ReservationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const labels = useMemo(() => {
    const isDe = locale === "de";

    return {
      reservations: isDe ? "Reservierungen" : "Reservations",
      back: isDe ? "Zurueck zum Dashboard" : "Back to dashboard",
      title: isDe ? "Reservierungen" : "Reservations",
      subtitle: isDe
        ? "Live-Liste fuer den aktuell ausgewaehlten Tenant und Branch."
        : "Live list for the currently selected tenant and branch.",
      listTitle: isDe ? "Reservierungsliste" : "Reservation list",
      date: isDe ? "Datum" : "Date",
      apply: isDe ? "Anwenden" : "Apply",
      totalLoaded: isDe ? "Geladen" : "Total loaded",
      guest: isDe ? "Gast" : "Guest",
      time: isDe ? "Zeit" : "Time",
      party: isDe ? "Personen" : "Party",
      table: isDe ? "Tisch" : "Table",
      status: isDe ? "Status" : "Status",
      noItems: isDe ? "Keine Reservierungen gefunden." : "No reservations found.",
      missingContext: isDe
        ? "Tenant oder Branch Context fehlt. Bitte erneut einloggen oder Context setzen."
        : "Tenant or branch context missing. Login again or set tenant context."
    };
  }, [locale]);

  async function loadReservations(dateValue: string) {
    try {
      setLoading(true);
      setErrorMessage("");

      const ctx = getCurrentContext();
      const tenantId = String(ctx?.tenantId || "").trim();
      const branchId = String(ctx?.branchId || "").trim();

      if (!tenantId || !branchId) {
        setItems([]);
        setErrorMessage(labels.missingContext);
        return;
      }

      const response = await getReservations({
        tenantId,
        branchId,
        date: dateValue
      });

      setItems(Array.isArray((response as any)?.items) ? (response as any).items : []);
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to load reservations.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservations(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
                <CalendarDays className="h-3.5 w-3.5" />
                {labels.reservations}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                {labels.title}
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-white/55">
                {labels.subtitle}
              </p>
            </div>

            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              {labels.back}
            </Link>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{labels.listTitle}</h2>
                <p className="mt-1 text-sm text-white/50">
                  {labels.date}: {selectedDate} / {labels.totalLoaded}: {items.length}
                </p>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  loadReservations(selectedDate);
                }}
                className="flex flex-wrap items-end gap-3"
              >
                <div className="grid gap-1">
                  <label className="text-xs text-white/60">{labels.date}</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex h-11 items-center rounded-xl border border-white/10 bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  {labels.apply}
                </button>
              </form>
            </div>

            {errorMessage ? (
              <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            {loading ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                Loading reservations...
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-white/40">
                    <tr>
                      <th className="px-4 py-3">{labels.guest}</th>
                      <th className="px-4 py-3">{labels.time}</th>
                      <th className="px-4 py-3">{labels.party}</th>
                      <th className="px-4 py-3">{labels.table}</th>
                      <th className="px-4 py-3">{labels.status}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-white/50">
                          {labels.noItems}
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="text-white/75">
                          <td className="px-4 py-4 font-medium text-white">
                            {mapGuestName(item)}
                          </td>
                          <td className="px-4 py-4">
                            {formatDateTime(item.startAt || item.reservationDate || "", locale)}
                          </td>
                          <td className="px-4 py-4">{item.partySize}</td>
                          <td className="px-4 py-4">{mapTableName(item)}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${mapStatusTone(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Link
            href={`/${locale}/dashboard`}
            className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
          >
            {labels.back}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}