"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  apiPatch,
  apiPost,
  getCurrentContext,
  getTableCombinations,
  getTables
} from "@/lib/api";
type WaiterLocale = "de" | "en" | "it" | "sq";

function getWaiterLabels(locale: WaiterLocale) {
  if (locale === "sq") {
    return {
      table: "Tavolina",
      noReservation: "Pa rezervim",
      change: "Ndrysho tavolinen / kombinimin",
      neededSeats: "Ulese te nevojshme",
      singleTables: "Tavolina te vetme",
      allCombinations: "Te gjitha kombinimet e mundshme",
      seats: "ulese",
      noCombination: "Nuk u gjet kombinim valid per kete numer personash.",
      savedCombinations: "Kombinime te ruajtura",
      numberOfGuests: "Numri i mysafireve",
      walkInHelp: "Sistemi do te startoje walk-in ne tavolinen e zgjedhur.",
      seatGuest: "Ule mysafirin",
      cancelReservation: "Anulo rezervimin",
      freeTable: "Liro tavolinen",
      startWalkIn: "Starto walk-in",
      closeButton: "Mbyll"
    };
  }

  if (locale === "it") {
    return {
      table: "Tavolo",
      noReservation: "Nessuna prenotazione",
      change: "Cambia tavolo / combinazione",
      neededSeats: "Posti necessari",
      singleTables: "Tavoli singoli",
      allCombinations: "Tutte le combinazioni possibili",
      seats: "posti",
      noCombination: "Nessuna combinazione valida per questo numero di persone.",
      savedCombinations: "Combinazioni salvate",
      numberOfGuests: "Numero di ospiti",
      walkInHelp: "Il sistema avviera un walk-in sul tavolo selezionato.",
      seatGuest: "Fai sedere ospite",
      cancelReservation: "Annulla prenotazione",
      freeTable: "Libera tavolo",
      startWalkIn: "Avvia walk-in",
      closeButton: "Chiudi"
    };
  }

  if (locale === "en") {
    return {
      table: "Table",
      noReservation: "No reservation",
      change: "Change table / combination",
      neededSeats: "Needed seats",
      singleTables: "Single tables",
      allCombinations: "All possible table combinations",
      seats: "seats",
      noCombination: "No valid adjacent table combination found for this party size.",
      savedCombinations: "Saved combinations",
      numberOfGuests: "Number of guests",
      walkInHelp: "System will start a walk-in on the selected table.",
      seatGuest: "Seat guest",
      cancelReservation: "Cancel reservation",
      freeTable: "Free table",
      startWalkIn: "Start walk-in",
      closeButton: "Close"
    };
  }

  return {
    table: "Tisch",
    noReservation: "Keine Reservierung",
    change: "Tisch / Kombination wechseln",
    neededSeats: "Benoetigte Plaetze",
    singleTables: "Einzeltische",
    allCombinations: "Alle moeglichen Tischkombinationen",
    seats: "Plaetze",
    noCombination: "Keine gueltige Kombination fuer diese Gruppengroesse gefunden.",
    savedCombinations: "Gespeicherte Kombinationen",
    numberOfGuests: "Anzahl Gaeste",
    walkInHelp: "Das System startet einen Walk-in auf dem ausgewaehlten Tisch.",
    seatGuest: "Gast platzieren",
    cancelReservation: "Reservierung stornieren",
    freeTable: "Tisch freigeben",
    startWalkIn: "Walk-in starten",
    closeButton: "Schliessen"
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  reservationId?: string;
  tableName?: string;
  guestName?: string;
  time?: string;
  status?: string;
  branchId?: string;
  selectedTableId?: string;
  partySize?: number;
  locale?: WaiterLocale;
};

type GeneratedCombination = {
  key: string;
  name: string;
  tableIds: string[];
  capacity: number;
  overflow: number;
  tableCount: number;
};

export default function WaiterActionSheet({
  open,
  onClose,
  reservationId,
  tableName,
  guestName,
  time,
  status,
  branchId,
  selectedTableId,
  partySize,
  locale = "de"
}: Props) {
  const [loading, setLoading] = useState(false);
  const [walkInPartySize, setWalkInPartySize] = useState<number>(2);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [availableCombinations, setAvailableCombinations] = useState<any[]>([]);
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);
  const labels = useMemo(() => getWaiterLabels(locale), [locale]);

  useEffect(() => {
    if (!open) return;

    const normalized = Number(partySize || 0);
    setWalkInPartySize(normalized > 0 ? normalized : 2);
    setInlineMessage(null);
  }, [open, partySize]);

  useEffect(() => {
    if (!open || !reservationId) return;

    async function loadOptions() {
      const ctx = getCurrentContext();
      const tenantId = ctx.tenantId;
      const branchIdFromContext = ctx.branchId || branchId || "";

      if (!tenantId || !branchIdFromContext) return;

      const [tables, combinations] = await Promise.all([
        getTables({ tenantId, branchId: branchIdFromContext, isActive: "true" }),
        getTableCombinations({ tenantId, branchId: branchIdFromContext, isActive: "true" })
      ]);

      setAvailableTables(Array.isArray(tables) ? tables : []);
      setAvailableCombinations(Array.isArray(combinations) ? combinations : []);
      setInlineMessage(null);
    }

    loadOptions().catch((error) => {
      console.error(error);
      setInlineMessage("Could not load table move options.");
    });
  }, [open, reservationId, branchId]);

  const hasReservation = !!reservationId;
  const normalizedStatus = String(status || "").toUpperCase();
  const neededSeats = Math.max(1, Number(partySize || 0));

  const generatedCombinations = useMemo(() => {
    return buildAllPossibleCombinations(availableTables, neededSeats);
  }, [availableTables, neededSeats]);

  if (!open) return null;

  async function markSeated() {
    if (!reservationId) return;

    try {
      setLoading(true);
      setInlineMessage(null);
      await apiPatch("/reservations/" + reservationId + "/seat", {});
      onClose();
      window.location.reload();
    } catch (error: any) {
      setInlineMessage(error?.message || "Mark seated failed.");
    } finally {
      setLoading(false);
    }
  }

  async function markFree() {
    if (!reservationId) return;

    try {
      setLoading(true);
      setInlineMessage(null);
      await apiPatch("/reservations/" + reservationId + "/complete", {});
      onClose();
      window.location.reload();
    } catch (error: any) {
      setInlineMessage(error?.message || "Mark free failed.");
    } finally {
      setLoading(false);
    }
  }

  async function cancelReservation() {
    if (!reservationId) return;

    try {
      setLoading(true);
      setInlineMessage(null);
      await apiPatch("/reservations/" + reservationId + "/cancel", {});
      onClose();
      window.location.reload();
    } catch (error: any) {
      setInlineMessage(error?.message || "Cancel failed.");
    } finally {
      setLoading(false);
    }
  }

  async function assignTable(tableId: string) {
    if (!reservationId) return;

    try {
      setLoading(true);
      setInlineMessage(null);

      await apiPatch("/reservations/" + reservationId + "/assign", {
        assignedTableId: tableId,
        assignedCombinationId: null,
        reason: "Manual single-table move from live floor"
      });

      onClose();
      window.location.reload();
    } catch (error: any) {
      setInlineMessage(error?.message || "Assign table failed.");
    } finally {
      setLoading(false);
    }
  }

  async function assignExistingCombination(combinationId: string) {
    if (!reservationId) return;

    try {
      setLoading(true);
      setInlineMessage(null);

      await apiPatch("/reservations/" + reservationId + "/assign", {
        assignedTableId: null,
        assignedCombinationId: combinationId,
        reason: "Manual existing-combination move from live floor"
      });

      onClose();
      window.location.reload();
    } catch (error: any) {
      setInlineMessage(error?.message || "Assign combination failed.");
    } finally {
      setLoading(false);
    }
  }

  async function assignGeneratedCombination(option: GeneratedCombination) {
    if (!reservationId) return;

    const ctx = getCurrentContext();
    const tenantId = ctx.tenantId;
    const branchIdFromContext = ctx.branchId || branchId || "";

    if (!tenantId || !branchIdFromContext) {
      setInlineMessage("Tenant or branch context is missing.");
      return;
    }

    try {
      setLoading(true);
      setInlineMessage(null);

      const combination = await apiPost("/table-combinations", {
        tenantId,
        branchId: branchIdFromContext,
        name: "MANUAL:" + option.name,
        tableIds: option.tableIds,
        isActive: true
      });

      const combinationId = combination?.id;

      if (!combinationId) {
        throw new Error("Combination was not created.");
      }

      await apiPatch("/reservations/" + reservationId + "/assign", {
        assignedTableId: null,
        assignedCombinationId: combinationId,
        reason: "Manual generated-combination move from live floor"
      });

      onClose();
      window.location.reload();
    } catch (error: any) {
      setInlineMessage(error?.message || "Generated combination move failed.");
    } finally {
      setLoading(false);
    }
  }

  async function startWalkIn() {
    if (loading) return;

    try {
      const cleanBranchId = String(branchId || "").trim();
      const cleanTableId = String(selectedTableId || "").trim();
      const normalizedPartySize = Math.max(1, Number(walkInPartySize || 0));

      if (!cleanBranchId) {
        throw new Error("branchId missing on selected table");
      }

      if (!cleanTableId) {
        throw new Error("tableId missing on selected table");
      }

      setLoading(true);
      setInlineMessage(null);

      await apiPost("/reservations/walk-in", {
        branchId: cleanBranchId,
        tableId: cleanTableId,
        partySize: normalizedPartySize
      });

      onClose();
      window.location.reload();
    } catch (error: any) {
      setInlineMessage(error?.message || "Walk-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(event) => event.stopPropagation()} style={sheetStyle}>
        <div style={{ fontSize: "18px", fontWeight: 800 }}>
          {tableName || labels.table}
        </div>

        <div style={{ marginTop: "6px", opacity: 0.82 }}>
          {guestName || labels.noReservation}
        </div>

        <div style={{ marginTop: "6px", fontSize: "13px", opacity: 0.72 }}>
          {(time || "-") + " | " + (status || "-")}
        </div>

        {inlineMessage ? (
          <div style={messageBoxStyle}>
            {inlineMessage}
          </div>
        ) : null}

        {hasReservation ? (
          <div style={reassignBoxStyle}>
            <div style={{ fontWeight: 800, marginBottom: "8px" }}>
              {labels.change}
            </div>

            <div style={{ fontSize: "12px", opacity: 0.72 }}>
              {labels.neededSeats}: {neededSeats}
            </div>

            <div style={sectionTitleStyle}>{labels.singleTables}</div>
            <div style={optionGridStyle}>
              {availableTables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  disabled={loading}
                  onClick={() => assignTable(table.id)}
                  style={smallButtonStyle}
                  title="Move reservation to this single table"
                >
                  {(table.code || table.name) + " (" + getTableCapacity(table) + ")"}
                </button>
              ))}
            </div>

            <div style={sectionTitleStyle}>
              {labels.allCombinations}
            </div>

            {generatedCombinations.length > 0 ? (
              <div style={optionGridStyle}>
                {generatedCombinations.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    disabled={loading}
                    onClick={() => assignGeneratedCombination(option)}
                    style={combinationButtonStyle}
                    title={"Capacity " + option.capacity + " / Needed " + neededSeats}
                  >
                    <span style={{ display: "block", fontWeight: 900 }}>
                      {option.name}
                    </span>
                    <span style={{ display: "block", fontSize: "11px", opacity: 0.75 }}>
                      {option.capacity + " " + labels.seats}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={emptyStateStyle}>
                {labels.noCombination}
              </div>
            )}

            {availableCombinations.length > 0 ? (
              <>
                <div style={sectionTitleStyle}>
                  {labels.savedCombinations}
                </div>

                <div style={optionGridStyle}>
                  {availableCombinations.map((combination) => (
                    <button
                      key={combination.id}
                      type="button"
                      disabled={loading}
                      onClick={() => assignExistingCombination(combination.id)}
                      style={smallButtonStyle}
                    >
                      {combination.name}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <div style={reassignBoxStyle}>
            <label htmlFor="walkin-party-size" style={{ fontSize: "13px", opacity: 0.78 }}>
              {labels.numberOfGuests}
            </label>

            <input
              id="walkin-party-size"
              type="number"
              min={1}
              max={20}
              step={1}
              value={walkInPartySize}
              onChange={(event) => setWalkInPartySize(Number(event.target.value || 1))}
              style={inputStyle}
            />

            <div style={{ fontSize: "12px", opacity: 0.6 }}>
              {labels.walkInHelp}
            </div>
          </div>
        )}

        <div style={actionsStyle}>
          {hasReservation ? (
            <>
              {(normalizedStatus === "PENDING" || normalizedStatus === "CONFIRMED") && (
                <>
                  <button type="button" style={primaryButtonStyle} disabled={loading} onClick={markSeated}>
                    {labels.seatGuest}
                  </button>

                  <button type="button" style={dangerButtonStyle} disabled={loading} onClick={cancelReservation}>
                    {labels.cancelReservation}
                  </button>
                </>
              )}

              {normalizedStatus === "SEATED" && (
                <button type="button" style={primaryButtonStyle} disabled={loading} onClick={markFree}>
                  {labels.freeTable}
                </button>
              )}
            </>
          ) : (
            <button type="button" style={primaryButtonStyle} disabled={loading} onClick={startWalkIn}>
              {labels.startWalkIn}
            </button>
          )}

          <button type="button" style={secondaryButtonStyle} disabled={loading} onClick={onClose}>
            {labels.closeButton}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildAllPossibleCombinations(tables: any[], neededSeats: number): GeneratedCombination[] {
  const positionedTables = tables
    .filter((table) => table?.id && table?.isActive !== false)
    .map((table) => toPositionedTable(table))
    .filter((table) => table.safeCapacityMax > 0);

  const rows: Array<{
    zoneId: string | null;
    centerY: number;
    tables: any[];
  }> = [];

  for (const table of positionedTables) {
    const rowTolerance = Math.max(32, table.safeHeight * 0.65);

    const existingRow = rows.find(
      (row) =>
        row.zoneId === table.zoneId &&
        Math.abs(row.centerY - table.centerY) <= rowTolerance
    );

    if (existingRow) {
      existingRow.tables.push(table);
      existingRow.centerY =
        existingRow.tables.reduce((sum, item) => sum + item.centerY, 0) /
        existingRow.tables.length;
    } else {
      rows.push({
        zoneId: table.zoneId,
        centerY: table.centerY,
        tables: [table]
      });
    }
  }

  const combinations: GeneratedCombination[] = [];

  for (const row of rows) {
    const rowTables = [...row.tables].sort((a, b) => {
      const xCompare = a.left - b.left;

      if (xCompare !== 0) {
        return xCompare;
      }

      return String(a.name || a.code || a.id).localeCompare(String(b.name || b.code || b.id));
    });

    for (let startIndex = 0; startIndex < rowTables.length; startIndex += 1) {
      const current: any[] = [];
      let capacity = 0;

      for (let index = startIndex; index < rowTables.length; index += 1) {
        const nextTable = rowTables[index];
        const previousTable = current[current.length - 1];

        if (previousTable && !isDirectHorizontalNeighbor(previousTable, nextTable)) {
          break;
        }

        current.push(nextTable);
        capacity += nextTable.safeCapacityMax;

        if (current.length >= 2 && capacity >= neededSeats) {
          const name = current.map((table) => table.code || table.name || "Table").join("+");
          const tableIds = current.map((table) => table.id);

          combinations.push({
            key: tableIds.join("|"),
            name,
            tableIds,
            capacity,
            overflow: capacity - neededSeats,
            tableCount: current.length
          });
        }
      }
    }
  }

  const unique = new Map<string, GeneratedCombination>();

  for (const combination of combinations) {
    if (!unique.has(combination.key)) {
      unique.set(combination.key, combination);
    }
  }

  return Array.from(unique.values()).sort((a, b) => {
    if (a.overflow !== b.overflow) {
      return a.overflow - b.overflow;
    }

    if (a.tableCount !== b.tableCount) {
      return a.tableCount - b.tableCount;
    }

    return a.name.localeCompare(b.name);
  });
}

function getTableCapacity(table: any) {
  return Math.max(0, Number(table?.capacityMax || table?.safeCapacityMax || 0));
}

function toPositionedTable(table: any) {
  const safeWidth = Math.max(1, Number(table?.width ?? 80) || 80);
  const safeHeight = Math.max(1, Number(table?.height ?? 80) || 80);
  const left = Number(table?.posX ?? 0) || 0;
  const top = Number(table?.posY ?? 0) || 0;

  return {
    ...table,
    id: String(table?.id || ""),
    name: String(table?.name || ""),
    code: String(table?.code || ""),
    zoneId: table?.zoneId ?? null,
    left,
    top,
    right: left + safeWidth,
    bottom: top + safeHeight,
    centerX: left + safeWidth / 2,
    centerY: top + safeHeight / 2,
    safeWidth,
    safeHeight,
    safeCapacityMax: Math.max(0, Number(table?.capacityMax ?? 0) || 0)
  };
}

function isDirectHorizontalNeighbor(leftTable: any, rightTable: any) {
  if ((leftTable?.zoneId ?? null) !== (rightTable?.zoneId ?? null)) {
    return false;
  }

  const verticalTolerance = Math.max(
    32,
    Math.min(leftTable.safeHeight, rightTable.safeHeight) * 0.65
  );

  if (Math.abs(leftTable.centerY - rightTable.centerY) > verticalTolerance) {
    return false;
  }

  const horizontalGap = rightTable.left - leftTable.right;

  const maxAllowedGap = Math.max(
    64,
    Math.min(leftTable.safeWidth, rightTable.safeWidth) * 1.25
  );

  const maxAllowedOverlap =
    Math.min(leftTable.safeWidth, rightTable.safeWidth) * 0.25;

  return horizontalGap >= -maxAllowedOverlap && horizontalGap <= maxAllowedGap;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  zIndex: 9999
};

const sheetStyle: React.CSSProperties = {
  position: "absolute",
  left: "12px",
  right: "12px",
  bottom: "12px",
  width: "calc(100% - 24px)",
  maxWidth: "760px",
  margin: "0 auto",
  maxHeight: "78vh",
  overflowY: "auto",
  background: "#0b1220",
  color: "#ffffff",
  borderRadius: "22px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 -12px 40px rgba(0,0,0,0.38)",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain"
};

const reassignBoxStyle: React.CSSProperties = {
  marginTop: "16px",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  display: "grid",
  gap: "10px"
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: "8px",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.72)"
};

const optionGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: "8px"
};

const inputStyle: React.CSSProperties = {
  height: "46px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  padding: "0 12px",
  outline: "none"
};

const actionsStyle: React.CSSProperties = {
  marginTop: "16px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px"
};

const primaryButtonStyle: React.CSSProperties = {
  height: "48px",
  borderRadius: "14px",
  border: "none",
  background: "#2563EB",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer"
};

const dangerButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: "#dc2626"
};

const secondaryButtonStyle: React.CSSProperties = {
  height: "48px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer"
};

const smallButtonStyle: React.CSSProperties = {
  minHeight: "40px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
  padding: "8px 10px"
};

const combinationButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  minHeight: "52px",
  background: "rgba(37,99,235,0.18)",
  border: "1px solid rgba(96,165,250,0.35)"
};

const messageBoxStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(251,191,36,0.35)",
  background: "rgba(251,191,36,0.10)",
  color: "#fde68a",
  fontSize: "13px",
  lineHeight: 1.35
};

const emptyStateStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.72)",
  fontSize: "13px"
};