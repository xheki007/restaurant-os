"use client";

import { DEFAULT_LANG, t } from "@/lib/lang";

import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "";
const BRANCH_ID = process.env.NEXT_PUBLIC_BRANCH_ID || "";

type Zone = {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  type: string;
  isActive?: boolean;
};

type AvailabilitySlot = {
  time: string;
  availableTablesCount: number;
  availableTables?: Array<{
    id: string;
    code: string;
    name: string;
    zoneName: string | null;
    capacityMin: number;
    capacityMax: number;
  }>;
};

type AvailabilityResponse = {
  branchId: string;
  date: string;
  partySize: number;
  zoneId: string | null;
  reservationDurationMin: number;
  tableTurnoverBufferMin: number;
  summary: {
    businessHoursBlocks: number;
    candidateTables: number;
    reservedTables: number;
    availableTables: number;
    reservationsCount: number;
    generatedSlots: number;
  };
  availableTables?: Array<{
    id: string;
    code: string;
    name: string;
    zoneName: string | null;
    capacityMin: number;
    capacityMax: number;
  }>;
  reservations: unknown[];
  slots: AvailabilitySlot[];
  reason?: string | null;
};

type BookingResponse = {
  reservation?: {
    id: string;
    confirmationCode?: string;
    startAt?: string;
    partySize?: number;
  };
  notification?: {
    ok?: boolean;
    skipped?: boolean;
    reason?: string;
  };
};

const fieldStyle: React.CSSProperties = {
  height: "48px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  padding: "0 14px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box"
};

const textAreaStyle: React.CSSProperties = {
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  padding: "14px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
  minHeight: "110px",
  resize: "vertical"
};

const selectStyle: React.CSSProperties = {
  ...fieldStyle,
  WebkitAppearance: "none",
  appearance: "none",
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.7) 50%), linear-gradient(135deg, rgba(255,255,255,0.7) 50%, transparent 50%)",
  backgroundPosition: "calc(100% - 18px) calc(50% - 3px), calc(100% - 12px) calc(50% - 3px)",
  backgroundSize: "6px 6px, 6px 6px",
  backgroundRepeat: "no-repeat",
  paddingRight: "36px"
};

const optionStyle: React.CSSProperties = {
  color: "#111111",
  backgroundColor: "#ffffff"
};

function getTodayDateString() {
  const date = new Date();

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ReservePage() {
  const lang = DEFAULT_LANG;
  const tr = t(lang);
  const [date, setDate] = useState(getTodayDateString());
  const [partySize, setPartySize] = useState("2");
  const [maxPartySize, setMaxPartySize] = useState(6);
  const [seatingPreference, setSeatingPreference] = useState("any");
  const [zones, setZones] = useState<Zone[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestNote, setGuestNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<BookingResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadZones() {
      try {
        const zoneSearch = new URLSearchParams({
          tenantId: TENANT_ID,
          branchId: BRANCH_ID,
          isActive: "true"
        });

        const response = await fetch(`${API_BASE_URL}/zones?${zoneSearch.toString()}`, {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const json = (await response.json()) as unknown;
        const rawZones = Array.isArray(json)
          ? json
          : typeof json === "object" && json !== null && Array.isArray((json as { value?: unknown[] }).value)
            ? (json as { value: unknown[] }).value
            : [];

        console.log('RAW ZONES:', rawZones); const filteredZones = rawZones
          .filter((item): item is Zone => {
            if (!item || typeof item !== "object") {
              return false;
            }

            const zone = item as Partial<Zone>;

            return (
              typeof zone.id === "string" &&
              typeof zone.tenantId === "string" &&
              typeof zone.branchId === "string" &&
              typeof zone.name === "string" &&
              typeof zone.type === "string"
            );
          })
          
          .filter((zone) => zone.isActive !== false);

        if (!cancelled) {
          setZones(filteredZones);
        }
      } catch {
        if (!cancelled) {
          setZones([]);
        }
      }
    }

    loadZones();

    return () => {
      cancelled = true;
    };
  }, []);

  const zoneId = useMemo(() => {
    if (seatingPreference.startsWith("zone:")) {
      return seatingPreference.replace("zone:", "");
    }

    return "";
  }, [seatingPreference]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const res = await fetch(`${API_BASE_URL}/branches/${BRANCH_ID}`, {
          method: "GET",
          cache: "no-store"
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const json = await res.json();
        const max = json?.settings?.maxPartySize;

        if (!cancelled && typeof max === "number" && max > 0) {
          setMaxPartySize(max);

          setPartySize((prev) => {
            return Number(prev) > max ? String(max) : prev;
          });
        }
      } catch (e) {
        console.error("Settings load failed", e);
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        if (!TENANT_ID || !BRANCH_ID) {
          throw new Error("Booking widget tenant/branch context is missing.");
        }

        setLoadingAvailability(true);
        setAvailabilityError("");
        setSelectedTime("");
        setBookingSuccess(null);
        setSubmitError("");

        const search = new URLSearchParams({
          branchId: BRANCH_ID,
          date,
          partySize
        });

        if (zoneId) {
          search.set("zoneId", zoneId);
        }

        const response = await fetch(
          `${API_BASE_URL}/public/reservations/availability?${search.toString()}`,
          {
            method: "GET",
            cache: "no-store"
          }
        );

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const json = (await response.json()) as AvailabilityResponse;

        if (!cancelled) {
          setAvailability(json);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          if (error instanceof Error) {
            setAvailabilityError(error.message);
          } else {
            setAvailabilityError("Failed to load availability.");
          }
          setAvailability(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingAvailability(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [date, partySize, zoneId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTime) {
      setSubmitError("Please choose an available time first.");
      return;
    }

    if (!guestName.trim()) {
      setSubmitError("Please enter your name.");
      return;
    }

    if (!guestPhone.trim()) {
      setSubmitError("Please enter your phone number.");
      return;
    }

    try {
      if (!TENANT_ID || !BRANCH_ID) {
        throw new Error("Booking widget tenant/branch context is missing.");
      }

      setSubmitting(true);
      setSubmitError("");
      setBookingSuccess(null);

      const response = await fetch(`${API_BASE_URL}/public/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tenantId: TENANT_ID,
          branchId: BRANCH_ID,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim(),
          partySize: Number(partySize),
          date,
          time: selectedTime,
          preferredLanguage: "de",
          guestNote: guestNote.trim(),
          requestedZoneId: zoneId || undefined
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const json = (await response.json()) as BookingResponse;
      setBookingSuccess(json);
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setGuestNote("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Reservation could not be completed.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const lunchSlots = availability?.slots?.filter((s) => s.time < "17:00") || [];
  const dinnerSlots = availability?.slots?.filter((s) => s.time >= "17:00") || [];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1020",
        color: "#ffffff",
        padding: "24px",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
            flexWrap: "wrap"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "18px"
            }}
          >
            R
          </div>

          <div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>
              Restaurant
            </div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>
              Your Restaurant Name
            </div>
          </div>
        </div>

        <section
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            borderRadius: "28px",
            padding: "24px",
            boxShadow: "0 14px 45px rgba(0,0,0,0.26)"
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              fontSize: "12px",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "16px"
            }}
          >
            Online booking
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "40px",
              lineHeight: 1.1
            }}
          >
            Reserve your table
          </h1>

          <p
            style={{
              marginTop: "16px",
              marginBottom: 0,
              maxWidth: "640px",
              fontSize: "16px",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.7)"
            }}
          >
            Choose your date, time and party size. Available time slots are loaded
            from the live reservation engine.
          </p>
        </section>

        <section
          style={{
            marginTop: "24px",
            display: "grid",
            gap: "24px",
            gridTemplateColumns: "1fr"
          }}
        >
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "28px",
              padding: "24px",
              boxShadow: "0 10px 35px rgba(0,0,0,0.22)"
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "22px" }}>
              Booking details
            </h2>

            <div style={{ display: "grid", gap: "16px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span>{tr.date}</span>
                <input
                  min={getTodayDateString()}
                  type="date"
                  style={fieldStyle}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>

              <label style={{ display: "grid", gap: "8px" }}>
                <span>{tr.guests}</span>
                <select key={maxPartySize}
                  style={selectStyle}
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                >
                  {Array.from({ length: maxPartySize }, (_, i) => i + 1).map((n) => (
  <option key={n} style={optionStyle} value={String(n)}>
    {n} {n === 1 ? "guest" : "guests"}
  </option>
))}
                </select>
              </label>

              <label style={{ display: "grid", gap: "8px" }}>
                <span>{tr.seating}</span>
                <select key={maxPartySize}
                  style={selectStyle}
                  value={seatingPreference}
                  onChange={(e) => setSeatingPreference(e.target.value)}
                >
                  <option style={optionStyle} value="any">{tr.any}</option>
                  {zones.map((zone) => (
                    <option
                      key={zone.id}
                      style={optionStyle}
                      value={`zone:${zone.id}`}
                    >
                      {zone.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "28px",
              padding: "24px",
              boxShadow: "0 10px 35px rgba(0,0,0,0.22)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "flex-start",
                flexWrap: "wrap"
              }}
            >
              <div>
                <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "22px" }}>
                  Available times
                </h2>
                <p
                  style={{
                    marginTop: 0,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.7
                  }}
                >
                  {tr.availableTimesHint}
                </p>
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.55)"
                }}
              >
                Branch ID: {BRANCH_ID}
              </div>
            </div>

            {loadingAvailability ? (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px 16px",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.75)"
                }}
              >
                Loading live availability...
              </div>
            ) : null}

            {availabilityError ? (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px 16px",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,120,120,0.25)",
                  background: "rgba(255,80,80,0.08)",
                  color: "#ffd6d6"
                }}
              >
                {availabilityError}
              </div>
            ) : null}

            {!loadingAvailability && !availabilityError && availability ? (
              <div
                style={{
                  marginTop: "16px",
                  display: "grid",
                  gap: "12px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.62)"
                  }}
                >
                  <span>{tr.slots}: {availability.slots?.length ?? 0}</span>
                  <span>{tr.candidateTables}: {availability.summary?.candidateTables ?? 0}</span>
                  <span>{tr.reservedTables}: {availability.reservations?.length ?? 0}</span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                    gap: "12px"
                  }}
                >
                  {availability.slots.length > 0 ? (
                    <>
  {lunchSlots.length > 0 && (
    <>
      <div style={{gridColumn:"1/-1", opacity:0.6, marginBottom:"4px"}}>Lunch</div>
      {lunchSlots.map((slot) => {
        const isSelected = selectedTime === slot.time;

        return (
          <button
            key={slot.time}
            type="button"
            onClick={() => setSelectedTime(slot.time)}
            style={{
              height: "52px",
              borderRadius: "16px",
              border: isSelected
                ? "1px solid rgba(255,255,255,0.45)"
                : "1px solid rgba(255,255,255,0.10)",
              background: isSelected
                ? "rgba(255,255,255,0.16)"
                : "rgba(255,255,255,0.06)",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            {slot.time}
          </button>
        );
      })}
    </>
  )}

  {dinnerSlots.length > 0 && (
    <>
      <div style={{gridColumn:"1/-1", marginTop:"10px", opacity:0.6}}>Dinner</div>
      {dinnerSlots.map((slot) => {
        const isSelected = selectedTime === slot.time;

        return (
          <button
            key={slot.time}
            type="button"
            onClick={() => setSelectedTime(slot.time)}
            style={{
              height: "52px",
              borderRadius: "16px",
              border: isSelected
                ? "1px solid rgba(255,255,255,0.45)"
                : "1px solid rgba(255,255,255,0.10)",
              background: isSelected
                ? "rgba(255,255,255,0.16)"
                : "rgba(255,255,255,0.06)",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            {slot.time}
          </button>
        );
      })}
    </>
  )}
</>
                  ) : (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        padding: "16px",
                        borderRadius: "16px",
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.72)"
                      }}
                    >
                      {availability.reason === "NO_AVAILABILITY" && tr.noAvailability}
{availability.reason === "NO_TABLE_COMBINATION" && tr.noAvailability}
{availability.reason === "DAILY_LIMIT_REACHED" && tr.dailyLimitReached}
{availability.reason === "OUTSIDE_BUSINESS_HOURS" && tr.noAvailability}
{availability.reason === "ONLINE_BOOKING_DISABLED" && tr.noAvailability}
{availability.reason === "PARTY_SIZE_EXCEEDS_MAX" && tr.noAvailability}
{!availability.reason && tr.noSlots}
                    </div>
                  )}
                </div>

                {selectedTime ? (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "14px 16px",
                      borderRadius: "16px",
                      border: "1px solid rgba(120,255,180,0.22)",
                      background: "rgba(60,200,120,0.10)",
                      color: "#dfffea"
                    }}
                  >
                    {tr.selectedTime}: <strong>{selectedTime}</strong>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "28px",
              padding: "24px",
              boxShadow: "0 10px 35px rgba(0,0,0,0.22)",
              display: "grid",
              gap: "16px"
            }}
          >
            <div>
              <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "22px" }}>
                {tr.yourDetails}
              </h2>
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 0,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.7
                }}
              >
                {tr.yourDetailsHint}
              </p>
            </div>

            <label style={{ display: "grid", gap: "8px" }}>
              <span>{tr.fullName}</span>
              <input
                  min={getTodayDateString()}
                type="text"
                style={fieldStyle}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder={tr.fullNamePlaceholder}
              />
            </label>

            <label style={{ display: "grid", gap: "8px" }}>
              <span>{tr.phone}</span>
              <input
                  min={getTodayDateString()}
                type="tel"
                style={fieldStyle}
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder={tr.phonePlaceholder}
              />
            </label>

            <label style={{ display: "grid", gap: "8px" }}>
              <span>{tr.email}</span>
              <input
                  min={getTodayDateString()}
                type="email"
                style={fieldStyle}
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder={tr.emailPlaceholder}
              />
            </label>

            <label style={{ display: "grid", gap: "8px" }}>
              <span>{tr.note}</span>
              <textarea
                style={textAreaStyle}
                value={guestNote}
                onChange={(e) => setGuestNote(e.target.value)}
                placeholder={tr.notePlaceholder}
              />
            </label>

            {submitError ? (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,120,120,0.25)",
                  background: "rgba(255,80,80,0.08)",
                  color: "#ffd6d6"
                }}
              >
                {submitError}
              </div>
            ) : null}

            {bookingSuccess?.reservation ? (
              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  border: "1px solid rgba(120,255,180,0.22)",
                  background: "rgba(60,200,120,0.10)",
                  color: "#dfffea"
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "8px" }}>
                  {tr.success}
                </div>
                <div>{tr.confirmation}: {bookingSuccess.reservation.confirmationCode}</div>
                <div style={{ marginTop: "6px" }}>
                  Time: {selectedTime} | Guests: {partySize}
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              style={{
                height: "52px",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: submitting ? "rgba(255,255,255,0.12)" : "#ffffff",
                color: submitting ? "#ffffff" : "#111111",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer"
              }}
            >
              {submitting ? tr.submitting : tr.complete}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}



