"use client";

type ReservationItem = {
  id?: string;
  status?: string;
  assignedTableId?: string | null;
  assignedTable?: {
    id?: string;
  } | null;
};

type TableItem = {
  id: string;
  name: string;
  code?: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  shape?: string;
  zone?: {
    color?: string;
    name?: string;
  };
};

type Props = {
  tables: TableItem[];
  reservations?: ReservationItem[] | { items?: ReservationItem[] } | null;
};

function getReservationRows(input: Props["reservations"]): ReservationItem[] {
  if (Array.isArray(input)) {
    return input;
  }

  if (Array.isArray(input?.items)) {
    return input.items;
  }

  return [];
}

function getStatusMap(rows: ReservationItem[]) {
  const map = new Map<string, string>();

  rows.forEach((reservation) => {
    const status = String(reservation?.status || "").toUpperCase();

    if (!["PENDING", "CONFIRMED", "SEATED"].includes(status)) {
      return;
    }

    const tableId =
      reservation?.assignedTableId ||
      reservation?.assignedTable?.id ||
      "";

    if (!tableId) {
      return;
    }

    map.set(tableId, status);
  });

  return map;
}

function getVisual(status: string, zoneColor?: string) {
  if (status === "SEATED") {
    return {
      background: "#dc2626",
      border: "2px solid rgba(255,255,255,0.35)",
      label: "Seated"
    };
  }

  if (status === "CONFIRMED") {
    return {
      background: "#b45309",
      border: "2px solid rgba(255,255,255,0.35)",
      label: "Reserved"
    };
  }

  if (status === "PENDING") {
    return {
      background: "#d97706",
      border: "2px solid rgba(255,255,255,0.35)",
      label: "Pending"
    };
  }

  return {
    background: zoneColor || "#2563EB",
    border: "2px solid rgba(255,255,255,0.25)",
    label: "Free"
  };
}

export default function FloorPlan({ tables, reservations }: Props) {
  const reservationRows = getReservationRows(reservations);
  const statusMap = getStatusMap(reservationRows);

  return (
    <div
      style={{
        position: "relative",
        width: 1200,
        height: 700,
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "24px",
        background: "#0f172a",
        overflow: "auto",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03)"
      }}
    >
      <div
        style={{
          position: "relative",
          width: 1200,
          height: 700,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      >
        {tables.map((t) => {
          const status = statusMap.get(t.id) || "FREE";
          const visual = getVisual(status, t.zone?.color);
          const title = t.code || t.name;

          return (
            <div
              key={t.id}
              title={title + " - " + visual.label}
              style={{
                position: "absolute",
                left: t.posX,
                top: t.posY,
                width: t.width,
                height: t.height,
                background: visual.background,
                color: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                borderRadius: t.shape === "ROUND" ? "50%" : "14px",
                cursor: "pointer",
                border: visual.border,
                boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
                textAlign: "center",
                padding: "6px",
                boxSizing: "border-box"
              }}
            >
              <div style={{ fontSize: 10, opacity: 0.9, marginBottom: 4 }}>
                {visual.label}
              </div>
              <div>{title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}