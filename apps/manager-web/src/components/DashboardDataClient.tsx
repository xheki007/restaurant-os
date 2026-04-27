"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
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

function labelsFor(locale: string) {
  const isDe = locale === "de";
  const isSq = locale === "sq";
  const isIt = locale === "it";

  if (isSq) {
    return {
      todayReservations: "Rezervimet sot",
      occupiedTables: "Tavolina te zena",
      expectedGuests: "Mysafire te pritur",
      aiAlerts: "Njoftime AI",
      warning: "Te dhenat e dashboard-it nuk u ngarkuan.",
      pendingSubtitle: "ne pritje ne intervalin aktual",
      confirmedSubtitle: "rezervime te konfirmuara",
      seatedSubtitle: "rezervime te ulura",
      cancelledSubtitle: "anulime ne intervalin aktual",
      previewTitle: "Parashikimi i rezervimeve",
      previewSubtitle: "Te dhena live per tenant-in aktual.",
      noReservations: "Nuk ka rezervime per sot.",
      guest: "Mysafiri",
      time: "Koha",
      party: "Persona",
      table: "Tavolina",
      status: "Statusi",
      confirmed: "Konfirmuar",
      pending: "Ne pritje",
      guestsLabel: "mysafire",
      viewAll: "Shiko te gjitha"
    };
  }

  if (isIt) {
    return {
      todayReservations: "Prenotazioni oggi",
      occupiedTables: "Tavoli occupati",
      expectedGuests: "Ospiti attesi",
      aiAlerts: "Avvisi AI",
      warning: "I dati della dashboard non sono stati caricati.",
      pendingSubtitle: "in attesa nell'intervallo attuale",
      confirmedSubtitle: "prenotazioni confermate",
      seatedSubtitle: "prenotazioni sedute",
      cancelledSubtitle: "cancellazioni nell'intervallo attuale",
      previewTitle: "Anteprima prenotazioni",
      previewSubtitle: "Dati live per il tenant attuale.",
      noReservations: "Nessuna prenotazione per oggi.",
      guest: "Ospite",
      time: "Ora",
      party: "Persone",
      table: "Tavolo",
      status: "Stato",
      confirmed: "Confermata",
      pending: "In attesa",
      guestsLabel: "ospiti",
      viewAll: "Vedi tutto"
    };
  }

  return {
    todayReservations: isDe ? "Reservierungen heute" : "Reservations today",
    occupiedTables: isDe ? "Belegte Tische" : "Occupied tables",
    expectedGuests: isDe ? "Erwartete G\u00e4ste" : "Expected guests",
    aiAlerts: isDe ? "KI-Hinweise" : "AI alerts",
    warning: isDe ? "Dashboard-Daten konnten nicht geladen werden." : "Dashboard data could not be loaded.",
    pendingSubtitle: isDe ? "ausstehend im aktuellen Zeitraum" : "pending in current range",
    confirmedSubtitle: isDe ? "best\u00e4tigte Reservierungen" : "confirmed reservations",
    seatedSubtitle: isDe ? "platzierte Reservierungen" : "seated reservations",
    cancelledSubtitle: isDe ? "Stornierungen im aktuellen Zeitraum" : "cancellations in current range",
    previewTitle: isDe ? "Reservierungsvorschau" : "Reservations preview",
    previewSubtitle: isDe ? "Live-Daten f\u00fcr den aktuellen Tenant." : "Live data for the current tenant.",
    noReservations: isDe ? "Keine Reservierungen f\u00fcr heute." : "No reservations for today.",
    guest: isDe ? "Gast" : "Guest",
    time: isDe ? "Zeit" : "Time",
    party: isDe ? "Personen" : "Party",
    table: isDe ? "Tisch" : "Table",
    status: isDe ? "Status" : "Status",
    confirmed: isDe ? "Best\u00e4tigt" : "Confirmed",
    pending: isDe ? "Ausstehend" : "Pending",
    guestsLabel: isDe ? "G\u00e4ste" : "guests",
    viewAll: isDe ? "Alle anzeigen" : "View all"
  };
}

export default function DashboardDataClient({ locale }: Props) {
  const labels = useMemo(() => labelsFor(locale), [locale]);
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
        setError(e?.message || labels.warning);
      }
    }

    load();
  }, [labels.warning]);

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
      const guests = String(item.partySize) + " " + labels.guestsLabel;
      const table =
        item.assignedTable?.code ||
        item.assignedTable?.name ||
        item.assignedCombination?.name ||
        "-";

      const status =
        item.status === "CONFIRMED"
          ? labels.confirmed
          : item.status === "PENDING"
            ? labels.pending
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
  }, [items, labels.confirmed, labels.guestsLabel, labels.pending, locale]);

  return (
    <>
      {error ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100/80">
          {labels.warning}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={labels.todayReservations}
          value={String(summary.total)}
          subtitle={String(summary.pending) + " " + labels.pendingSubtitle}
        />
        <StatCard
          title={labels.occupiedTables}
          value={String(summary.confirmed)}
          subtitle={String(summary.confirmed) + " " + labels.confirmedSubtitle}
        />
        <StatCard
          title={labels.expectedGuests}
          value={String(summary.seated)}
          subtitle={String(summary.seated) + " " + labels.seatedSubtitle}
        />
        <StatCard
          title={labels.aiAlerts}
          value={String(summary.cancelled)}
          subtitle={String(summary.cancelled) + " " + labels.cancelledSubtitle}
        />
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {labels.previewTitle}
            </h2>
            <p className="mt-1 text-sm text-white/50">
              {labels.previewSubtitle}
            </p>
          </div>

          <Link
            href={`/${locale}/reservations`}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            {labels.viewAll}
          </Link>
        </div>

        <div className="mt-5 hidden grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_0.8fr] gap-3 px-4 text-xs uppercase tracking-[0.18em] text-white/35 md:grid">
          <div>{labels.guest}</div>
          <div>{labels.time}</div>
          <div>{labels.party}</div>
          <div>{labels.table}</div>
          <div>{labels.status}</div>
        </div>

        {previewRows.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
            {labels.noReservations}
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