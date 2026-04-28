"use client";

import {useEffect, useMemo, useState} from "react";
import WaiterActionSheet from "@/components/WaiterActionSheet";
import {getReservations, getTableCombinations, getTables, getZones, getCurrentContext} from "@/lib/api";

type ZoneItem = {
  id: string;
  tenantId?: string;
  branchId?: string;
  floorPlanId?: string;
  name?: string;
  code?: string;
  type?: string;
  color?: string;
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
  sortOrder?: number;
  isActive?: boolean;
};

type TableItem = {
  id: string;
  tenantId?: string;
  branchId?: string;
  zoneId?: string;
  floorPlanId?: string;
  name?: string;
  code?: string;
  capacityMin?: number;
  capacityMax?: number;
  shape?: string;
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
  rotation?: number;
  isActive?: boolean;
  zone?: {
    id?: string;
    name?: string;
    color?: string;
    type?: string;
  };
  floorPlan?: {
    id?: string;
    name?: string;
    canvasWidth?: number;
    canvasHeight?: number;
  };
};

type SelectedTableSheet = {
  reservationId?: string;
  tableId?: string;
  tableName?: string;
  guestName?: string;
  time?: string;
  status?: string;
  branchId?: string;
  partySize?: number;
} | null;
type LiveFloorLocale = "de" | "en" | "it" | "sq";

type LiveFloorLabels = {
  title: string;
  active: string;
  date: string;
  seated: string;
  reserved: string;
  pending: string;
  free: string;
  reservedGuest: string;
  noReservation: string;
  zone: string;
};

function getBrowserLocale(): LiveFloorLocale {
  if (typeof window === "undefined") {
    return "de";
  }

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("locale");
  const fromStorage = window.localStorage.getItem("managerLocale");
  const value = fromQuery || fromStorage || "de";

  if (value === "en" || value === "it" || value === "sq" || value === "de") {
    return value;
  }

  return "de";
}

function getLiveFloorLabels(locale: LiveFloorLocale): LiveFloorLabels {
  if (locale === "sq") {
    return {
      title: "Salla live",
      active: "Aktive",
      date: "Data",
      seated: "I ulur",
      reserved: "Rezervuar",
      pending: "Ne pritje",
      free: "E lire",
      reservedGuest: "Mysafir i rezervuar",
      noReservation: "Pa rezervim",
      zone: "Zona"
    };
  }

  if (locale === "it") {
    return {
      title: "Sala live",
      active: "Attivi",
      date: "Data",
      seated: "Seduto",
      reserved: "Riservato",
      pending: "In attesa",
      free: "Libero",
      reservedGuest: "Ospite prenotato",
      noReservation: "Nessuna prenotazione",
      zone: "Zona"
    };
  }

  if (locale === "en") {
    return {
      title: "Live Floor",
      active: "Active",
      date: "Date",
      seated: "Seated",
      reserved: "Reserved",
      pending: "Pending",
      free: "Free",
      reservedGuest: "Reserved guest",
      noReservation: "No reservation",
      zone: "Zone"
    };
  }

  return {
    title: "Live-Saal",
    active: "Aktiv",
    date: "Datum",
    seated: "Platziert",
    reserved: "Reserviert",
    pending: "Ausstehend",
    free: "Frei",
    reservedGuest: "Reservierter Gast",
    noReservation: "Keine Reservierung",
    zone: "Zone"
  };
}

function getTodayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeZoneColor(value?: string) {
  const lower = String(value || "").toLowerCase();

  if (lower === "#16a34a") {
    return {
      main: "#22C55E",
      soft: "rgba(34,197,94,0.10)",
      border: "rgba(34,197,94,0.18)"
    };
  }

  if (lower === "#d97706") {
    return {
      main: "#F59E0B",
      soft: "rgba(245,158,11,0.10)",
      border: "rgba(245,158,11,0.18)"
    };
  }

  if (lower === "#9333ea") {
    return {
      main: "#A855F7",
      soft: "rgba(168,85,247,0.10)",
      border: "rgba(168,85,247,0.18)"
    };
  }

  if (lower === "#e11d48") {
    return {
      main: "#F43F5E",
      soft: "rgba(244,63,94,0.10)",
      border: "rgba(244,63,94,0.18)"
    };
  }

  return {
    main: "#60A5FA",
    soft: "rgba(96,165,250,0.10)",
    border: "rgba(96,165,250,0.18)"
  };
}

function getActiveStatus(value: any) {
  const status = String(value?.status || "");

  if (status === "PENDING" || status === "CONFIRMED" || status === "SEATED") {
    return status;
  }

  return null;
}

function getStatusLabel(value: string | undefined, labels: LiveFloorLabels) {
  if (value === "SEATED") return labels.seated;
  if (value === "CONFIRMED") return labels.reserved;
  if (value === "PENDING") return labels.pending;
  return labels.free;
}

function getStatusVisual(value?: string) {
  if (value === "SEATED") {
    return {
      background: "linear-gradient(180deg,#5b1018,#2a0a10)",
      border: "2px solid rgba(255,120,120,0.70)",
      glow: "0 0 24px rgba(185,28,28,0.42)"
    };
  }

  if (value === "CONFIRMED") {
    return {
      background: "linear-gradient(180deg,#7f1d1d,#450a0a)",
      border: "2px solid rgba(254,202,202,0.50)",
      glow: "0 0 20px rgba(239,68,68,0.32)"
    };
  }

  if (value === "PENDING") {
    return {
      background: "linear-gradient(180deg,#6b4a0d,#3d2a08)",
      border: "2px solid rgba(253,230,138,0.50)",
      glow: "0 0 20px rgba(245,158,11,0.28)"
    };
  }

  return {
    background: "linear-gradient(180deg,#1d2940,#111827)",
    border: "2px solid rgba(148,163,184,0.25)",
    glow: "0 10px 25px rgba(0,0,0,0.40)"
  };
}

function safeNumber(value: any, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function getShortGuestName(reservation: any, fallbackLabel: string) {
  const raw =
    reservation?.guest?.firstName ||
    reservation?.guestName ||
    reservation?.customerName ||
    reservation?.guest?.fullName ||
    "";

  return String(raw || "").trim() || fallbackLabel;
}

type FloorPlanLiveViewProps = {
  initialLocale?: LiveFloorLocale;
  initialDate?: string;
};

function getTimeLabel(reservation: any) {
  const raw = reservation?.startAt || reservation?.reservationDate;
  if (!raw) {
    return "-";
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildTableLabel(table: TableItem, reservation: any, combinationEntry: any, allTables: TableItem[]) {
  const assignedCombinationItems = reservation?.assignedCombination?.items;

  if (Array.isArray(assignedCombinationItems) && assignedCombinationItems.length > 0) {
    const names = assignedCombinationItems
      .map((item: any) => item?.table?.code || item?.table?.name || "")
      .filter(Boolean);

    if (names.length > 0) {
      return names.join(" + ");
    }
  }

  if (Array.isArray(combinationEntry?.tableIds) && combinationEntry.tableIds.length > 0) {
    const names = combinationEntry.tableIds
      .map((id: string) => {
        const matched = allTables.find((x) => x.id === id);
        return matched?.code || matched?.name || "";
      })
      .filter(Boolean);

    if (names.length > 0) {
      return names.join(" + ");
    }
  }

  return table.code || table.name || "-";
}

export default function FloorPlanLiveView({ initialLocale = "de", initialDate }: FloorPlanLiveViewProps) {
  const locale = initialLocale;
  const labels = useMemo(() => getLiveFloorLabels(locale), [locale]);

const [zones, setZones] = useState<ZoneItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [combinations, setCombinations] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<SelectedTableSheet>(null);
  const [selectedDate, setSelectedDate] = useState(initialDate || getTodayDateString());

  async function loadData() {
    const ctx = getCurrentContext();
    const tenantId = ctx?.tenantId || "";
    const branchId = ctx?.branchId || "";
    if (!tenantId || !branchId) {
      setZones([]);
      setTables([]);
      setCombinations([]);
      setReservations([]);
      setSelectedTable(null);
      return;
    }

    const [z, t, c, r] = await Promise.all([
      getZones({ tenantId, branchId, isActive: "true" }),
      getTables({ tenantId, branchId, isActive: "true" }),
      getTableCombinations({ tenantId, branchId, isActive: "true" }),
      getReservations({
  tenantId,
  branchId,
  dateFrom: selectedDate + "T00:00:00.000Z",
  dateTo: selectedDate + "T23:59:59.999Z"
})
    ]);

    const safeZones = Array.isArray(z) ? z : [];
    const safeTables = Array.isArray(t) ? t : [];
    const safeCombinations = Array.isArray(c) ? c : [];
    const safeReservations =
      Array.isArray(r) ? r :
      Array.isArray(r?.items) ? r.items :
      [];

    setZones(safeZones);
    setTables(safeTables);
    setCombinations(safeCombinations);
    setReservations(safeReservations);
    setSelectedTable(null);
  }

  useEffect(() => {
  loadData();
}, [selectedDate]);

  const directReservationMap = useMemo(() => {
    const map = new Map<string, any>();

    reservations.forEach((reservation: any) => {
      const status = getActiveStatus(reservation);

      if (!status) {
        return;
      }

      if (reservation?.assignedTableId) {
        map.set(reservation.assignedTableId, reservation);
      }

      if (reservation?.assignedTable?.id) {
        map.set(reservation.assignedTable.id, reservation);
      }
    });

    return map;
  }, [reservations]);

  const combinationMap = useMemo(() => {
    const map = new Map<string, any>();

    reservations.forEach((reservation: any) => {
      const status = getActiveStatus(reservation);

      if (!status) {
        return;
      }

      const combinationId = reservation?.assignedCombinationId || reservation?.assignedCombination?.id;

      if (!combinationId) {
        return;
      }

      const matchedCombination = combinations.find((item: any) => item?.id === combinationId);

      const tableIds = Array.isArray(matchedCombination?.tableIds)
        ? matchedCombination.tableIds
        : Array.isArray(matchedCombination?.items)
          ? matchedCombination.items.map((item: any) => item?.tableId).filter(Boolean)
          : Array.isArray(reservation?.assignedCombination?.items)
            ? reservation.assignedCombination.items.map((item: any) => item?.tableId || item?.table?.id).filter(Boolean)
            : [];

      tableIds.forEach((id: string, index: number) => {
        map.set(id, {
          isLeader: index === 0,
          tableIds,
          reservation
        });
      });
    });

    return map;
  }, [combinations, reservations]);

  const reservationMap = useMemo(() => {
    const map = new Map<string, any>();

    directReservationMap.forEach((value, key) => {
      map.set(key, value);
    });

    combinationMap.forEach((value, key) => {
      if (!map.has(key)) {
        map.set(key, value.reservation);
      }
    });

    return map;
  }, [combinationMap, directReservationMap]);

  const activeCount = reservationMap.size;

  const fallbackBranchId = useMemo(() => {
    const fromTable = tables.find((item) => !!item?.branchId)?.branchId;
    if (fromTable) {
      return fromTable;
    }

    const fromZone = zones.find((item) => !!item?.branchId)?.branchId;
    if (fromZone) {
      return fromZone;
    }

    return "";
  }, [tables, zones]);

  const canvasWidth = useMemo(() => {
    const fromFloorPlan = tables.find(
      (table) =>
        typeof table?.floorPlan?.canvasWidth === "number" &&
        table.floorPlan.canvasWidth > 0
    );

    return safeNumber(fromFloorPlan?.floorPlan?.canvasWidth, 1500);
  }, [tables]);

  const canvasHeight = useMemo(() => {
    const fromFloorPlan = tables.find(
      (table) =>
        typeof table?.floorPlan?.canvasHeight === "number" &&
        table.floorPlan.canvasHeight > 0
    );

    return safeNumber(fromFloorPlan?.floorPlan?.canvasHeight, 920);
  }, [tables]);

  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) => safeNumber(a.sortOrder, 0) - safeNumber(b.sortOrder, 0));
  }, [zones]);
  const combinationGroups = useMemo(() => {
    const groups = new Map<string, { reservation: any; tableIds: string[] }>();

    reservations.forEach((reservation: any) => {
      const status = getActiveStatus(reservation);

      if (!status) {
        return;
      }

      const combinationId =
        reservation?.assignedCombinationId ||
        reservation?.assignedCombination?.id;

      if (!combinationId) {
        return;
      }

      const matchedCombination = combinations.find((item: any) => item?.id === combinationId);

      const tableIds = Array.isArray(matchedCombination?.tableIds)
        ? matchedCombination.tableIds
        : Array.isArray(matchedCombination?.items)
          ? matchedCombination.items.map((item: any) => item?.tableId).filter(Boolean)
          : Array.isArray(reservation?.assignedCombination?.items)
            ? reservation.assignedCombination.items.map((item: any) => item?.tableId || item?.table?.id).filter(Boolean)
            : [];

      if (tableIds.length > 1) {
        groups.set(combinationId, {
          reservation,
          tableIds,
        });
      }
    });

    return Array.from(groups.values()).map((group) => {
      const groupTables = group.tableIds
        .map((id) => tables.find((table) => table.id === id))
        .filter(Boolean) as TableItem[];

      if (groupTables.length < 2) {
        return null;
      }

      const left = Math.min(...groupTables.map((table) => safeNumber(table.posX, 0)));
      const top = Math.min(...groupTables.map((table) => safeNumber(table.posY, 0)));
      const right = Math.max(...groupTables.map((table) => safeNumber(table.posX, 0) + safeNumber(table.width, 72)));
      const bottom = Math.max(...groupTables.map((table) => safeNumber(table.posY, 0) + safeNumber(table.height, 72)));

      return {
        reservation: group.reservation,
        tableIds: group.tableIds,
        left: left - 10,
        top: top - 10,
        width: (right - left) + 20,
        height: (bottom - top) + 20,
      };
    }).filter(Boolean);
  }, [combinations, reservations, tables]);


  return (
    <main className="min-h-screen bg-[#020817] p-3 text-white sm:p-4 lg:p-6">
      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap"
        }}
      >
        <div>
          <h1 className="mb-2 text-2xl font-bold">{labels.title}</h1>
          <div className="text-sm text-white/80">{labels.active}: {activeCount}</div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "6px"
          }}
        >          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "6px",
              marginBottom: "4px"
            }}
          >
            <a
              href={"/" + locale + "/dashboard"}
              style={{
                height: "30px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.88)",
                fontSize: "12px",
                fontWeight: 800,
                padding: "0 12px",
                textDecoration: "none"
              }}
            >
              Dashboard
            </a>

            {(["de", "en", "it", "sq"] as LiveFloorLocale[]).map((item) => (
              <a
                key={item}
                href={"/floor-plan/live?locale=" + item + "&date=" + encodeURIComponent(selectedDate)}
                onClick={() => {
                  window.localStorage.setItem("managerLocale", item);
                }}
                style={{
                  minWidth: "38px",
                  height: "30px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: item === locale ? "#ffffff" : "rgba(255,255,255,0.06)",
                  color: item === locale ? "#020617" : "rgba(255,255,255,0.78)",
                  fontSize: "12px",
                  fontWeight: 800,
                  textDecoration: "none"
                }}
              >
                {item.toUpperCase()}
              </a>
            ))}
          </div>

          <label style={{fontSize: "12px", color: "rgba(255,255,255,0.72)"}}>
            {labels.date}
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              height: "42px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              color: "#ffffff",
              padding: "0 12px",
              outline: "none"
            }}
          />
        </div>
      </div>

      <div
        className="relative rounded-2xl bg-[#0b1220] p-2 sm:p-3"
        style={{
          height: "calc(100vh - 150px)",
          minHeight: "560px",
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
          overscrollBehavior: "contain"
        }}
      >
        <div
          style={{
            position: "relative",
            width: canvasWidth,
            height: canvasHeight,
            borderRadius: "18px",
            background:
              "radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 28%), linear-gradient(180deg,#031022,#08162c)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)"
          }}
        >
          {sortedZones.map((zone) => {
            const palette = normalizeZoneColor(zone.color);
            const x = safeNumber(zone.posX, 0);
            const y = safeNumber(zone.posY, 0);
            const w = safeNumber(zone.width, 600);
            const h = safeNumber(zone.height, 400);

            return (
              <div
                key={zone.id}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: w,
                  height: h,
                  borderRadius: "24px",
                  border: "1px solid " + palette.border,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)), " +
                    palette.soft,
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
                  zIndex: 1
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 10px",
                    borderRadius: "999px",
                    background: "rgba(3,7,18,0.46)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#E2E8F0",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase"
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "999px",
                      background: palette.main
                    }}
                  />
                  {zone.name || zone.code || labels.zone}
                </div>
              </div>
            );
          })}

          {combinationGroups.map((group: any, index: number) => {
            const groupStatus = getActiveStatus(group?.reservation);
            const groupVisual = getStatusVisual(groupStatus || undefined);

            return (
              <div
                key={"combo-group-" + index}
                style={{
                  position: "absolute",
                  left: group.left,
                  top: group.top,
                  width: group.width,
                  height: group.height,
                  borderRadius: "20px",
                  background: groupVisual.background,
                  border: groupVisual.border,
                  boxShadow: groupVisual.glow,
                  opacity: 0.18,
                  zIndex: 4,
                  pointerEvents: "none"
                }}
              />
            );
          })}

          {tables.map((table) => {
            const reservation = reservationMap.get(table.id);
            const combinationEntry = combinationMap.get(table.id);
            const status = getActiveStatus(reservation);
            const visual = getStatusVisual(status || undefined);

const isInCombination = !!combinationEntry;

let finalVisual = visual;

if (isInCombination) {
  finalVisual = {
    ...visual
  };
}
            const statusLabel = getStatusLabel(status || undefined, labels);

            return (
              <div
                key={table.id}
                onClick={() =>
                  setSelectedTable({
                    reservationId: reservation?.id,
                    tableId: table.id,
                    tableName: buildTableLabel(table, reservation, combinationEntry, tables),
                    guestName: reservation ? getShortGuestName(reservation, labels.reservedGuest) : labels.noReservation,
                    time: reservation ? getTimeLabel(reservation) : "-",
                    status: status || "FREE",
                    branchId: table.branchId || fallbackBranchId || "",
                    partySize: Number(reservation?.partySize || 0) || undefined
                  })
                }
                style={{
                  position: "absolute",
                  left: safeNumber(table.posX, 0),
                  top: safeNumber(table.posY, 0),
                  width: safeNumber(table.width, 72),
                  height: safeNumber(table.height, 72),
                  borderRadius: String(table.shape || "").toUpperCase() === "ROUND" ? "999px" : "16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#ffffff",
                  fontWeight: 700,
                  padding: "6px",
                  background: finalVisual.background,
                  border: finalVisual.border,
                  boxShadow: finalVisual.glow,
                  zIndex: 5
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    lineHeight: 1.15
                  }}
                >
                  <div style={{fontSize: "14px", fontWeight: 800}}>
                    {table.code || table.name}
                  </div>

                  {reservation ? (
                    <div style={{fontSize: "10px", opacity: 0.9, marginTop: "4px"}}>
                      {getTimeLabel(reservation)}   -   {reservation.partySize}p
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <WaiterActionSheet
        open={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        reservationId={selectedTable?.reservationId}
        tableName={selectedTable?.tableName}
        guestName={selectedTable?.guestName}
        time={selectedTable?.time}
        status={selectedTable?.status}
        branchId={selectedTable?.branchId}
        selectedTableId={selectedTable?.tableId}
        partySize={selectedTable?.partySize}
      locale={locale}
      />
    </main>
  );
}
