"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { getCurrentContext } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "";


type BranchSettingsResponse = {
  id: string;
  name?: string;
  code?: string;
  settings?: {
    maxPartySize?: number;
    totalSeatingCapacity?: number;
    maxOnlineGuestsPerDay?: number | null;
    allowIndoorOnline?: boolean;
    allowTerraceOnline?: boolean;
    allowOnlineBooking?: boolean;
    allowWalkIns?: boolean;
    allowPhoneReservations?: boolean;
  } | null;
  businessHours?: Array<{
    id: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    serviceType: string;
    isClosed: boolean;
  }>;
};

type ShiftItem = {
  enabled: boolean;
  openTime: string;
  closeTime: string;
  serviceType: "LUNCH" | "DINNER";
};

type DayItem = {
  dayOfWeek: number;
  label: string;
  isClosed: boolean;
  shift1: ShiftItem;
  shift2: ShiftItem;
};

const dayLabels = [
  { dayOfWeek: 1, label: "Monday" },
  { dayOfWeek: 2, label: "Tuesday" },
  { dayOfWeek: 3, label: "Wednesday" },
  { dayOfWeek: 4, label: "Thursday" },
  { dayOfWeek: 5, label: "Friday" },
  { dayOfWeek: 6, label: "Saturday" },
  { dayOfWeek: 7, label: "Sunday" }
];

function makeDefaultShift(serviceType: "LUNCH" | "DINNER", openTime: string, closeTime: string): ShiftItem {
  return {
    enabled: false,
    openTime,
    closeTime,
    serviceType
  };
}

function makeDefaultDays(): DayItem[] {
  return dayLabels.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    label: day.label,
    isClosed: false,
    shift1: makeDefaultShift("LUNCH", "11:00", "15:00"),
    shift2: makeDefaultShift("DINNER", "18:00", "23:00")
  }));
}

function mapHoursToDays(hours: BranchSettingsResponse["businessHours"]): DayItem[] {
  const base = makeDefaultDays();

  for (const day of base) {
    const slots = (hours || [])
      .filter((item) => item.dayOfWeek === day.dayOfWeek && item.isClosed !== true)
      .sort((a, b) => a.openTime.localeCompare(b.openTime));

    if (slots.length === 0) {
      day.isClosed = true;
      continue;
    }

    day.isClosed = false;

    const lunchSlot = slots.find((item) => item.serviceType === "LUNCH");
    const dinnerSlot = slots.find((item) => item.serviceType === "DINNER");

    if (lunchSlot) {
      day.shift1 = {
        enabled: true,
        openTime: lunchSlot.openTime,
        closeTime: lunchSlot.closeTime,
        serviceType: "LUNCH"
      };
    }

    if (dinnerSlot) {
      day.shift2 = {
        enabled: true,
        openTime: dinnerSlot.openTime,
        closeTime: dinnerSlot.closeTime,
        serviceType: "DINNER"
      };
    }

    const unknownSlots = slots.filter(
      (item) => item.serviceType !== "LUNCH" && item.serviceType !== "DINNER"
    );

    if (!lunchSlot && unknownSlots[0]) {
      day.shift1 = {
        enabled: true,
        openTime: unknownSlots[0].openTime,
        closeTime: unknownSlots[0].closeTime,
        serviceType: "LUNCH"
      };
    }

    if (!dinnerSlot && unknownSlots[1]) {
      day.shift2 = {
        enabled: true,
        openTime: unknownSlots[1].openTime,
        closeTime: unknownSlots[1].closeTime,
        serviceType: "DINNER"
      };
    }
  }

  return base;
}

export default function SettingsPage() {
  const params = useParams<{ locale?: string }>();
  const locale = String(params?.locale || "en");
  const t = useTranslations("settingsPage");

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [branchName, setBranchName] = useState("");
  const [branchId, setBranchId] = useState("");

  const [form, setForm] = useState({
    maxPartySize: 8,
    totalSeatingCapacity: 60,
    maxOnlineGuestsPerDay: 10,
    allowIndoorOnline: true,
    allowTerraceOnline: false,
    allowOnlineBooking: true,
    allowWalkIns: true,
    allowPhoneReservations: true,
    defaultReservationDurationMin: 90,
    tableTurnoverBufferMin: 15,
    reservationLeadTimeMin: 0,
    reservationCutoffMin: 0
  });

  const [days, setDays] = useState<DayItem[]>(makeDefaultDays());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMessage("");
        setSaveMessage("");

        const ctx = getCurrentContext();
        const activeBranchId = String(ctx?.branchId || "").trim();

        if (!activeBranchId) {
          throw new Error(t("branchMissing"));
        }

        setBranchId(activeBranchId);

        const response = await fetch(`${API_BASE_URL}/branches/${activeBranchId}`, {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = (await response.json()) as BranchSettingsResponse;

        if (cancelled) {
          return;
        }

        setBranchName(data?.name || t("mainBranch"));

        const settings = data?.settings || {};

        setForm({
          maxPartySize: Number(settings.maxPartySize ?? 8),
          totalSeatingCapacity: Number(settings.totalSeatingCapacity ?? 60),
          maxOnlineGuestsPerDay: Number(settings.maxOnlineGuestsPerDay ?? 10),
          allowIndoorOnline: settings.allowIndoorOnline ?? true,
          allowTerraceOnline: settings.allowTerraceOnline ?? false,
          allowOnlineBooking: settings.allowOnlineBooking ?? true,
          allowWalkIns: settings.allowWalkIns ?? true,
          allowPhoneReservations: settings.allowPhoneReservations ?? true,
          defaultReservationDurationMin: Number((settings as any).defaultReservationDurationMin ?? 90),
          tableTurnoverBufferMin: Number((settings as any).tableTurnoverBufferMin ?? 15),
          reservationLeadTimeMin: Number((settings as any).reservationLeadTimeMin ?? 0),
          reservationCutoffMin: Number((settings as any).reservationCutoffMin ?? 0)
        });

        setDays(mapHoursToDays(data?.businessHours || []));
      } catch (error: any) {
        if (!cancelled) {
          setErrorMessage(error?.message || t("loadError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const openDays = days.filter((day) => !day.isClosed).length;
    const enabledShiftCount = days.reduce((sum, day) => {
      if (day.isClosed) return sum;
      return sum + (day.shift1.enabled ? 1 : 0) + (day.shift2.enabled ? 1 : 0);
    }, 0);

    return { openDays, enabledShiftCount };
  }, [days]);

  function updateDay(dayOfWeek: number, updater: (current: DayItem) => DayItem) {
    setDays((prev) =>
      prev.map((day) => (day.dayOfWeek === dayOfWeek ? updater(day) : day))
    );
  }

  function getDayLabel(dayOfWeek: number) {
    switch (dayOfWeek) {
      case 1:
        return t("days.monday");
      case 2:
        return t("days.tuesday");
      case 3:
        return t("days.wednesday");
      case 4:
        return t("days.thursday");
      case 5:
        return t("days.friday");
      case 6:
        return t("days.saturday");
      case 7:
        return t("days.sunday");
      default:
        return String(dayOfWeek);
    }
  }

  function getActiveShiftLabel(day: DayItem) {
    if (day.isClosed) {
      return t("closed");
    }

    const count = (day.shift1.enabled ? 1 : 0) + (day.shift2.enabled ? 1 : 0);
    return t("activeShifts", { count });
  }

  function getServiceTypeLabel(serviceType: "LUNCH" | "DINNER") {
    return serviceType === "DINNER" ? t("serviceTypes.dinner") : t("serviceTypes.lunch");
  }
  async function saveSettings() {
    try {
      setSavingSettings(true);
      setErrorMessage("");
      setSaveMessage("");

      const payload = {
        maxPartySize: Number(form.maxPartySize),
        totalSeatingCapacity: Number(form.totalSeatingCapacity),
        maxOnlineGuestsPerDay:
          Number(form.maxOnlineGuestsPerDay) > 0 ? Number(form.maxOnlineGuestsPerDay) : null,
        allowIndoorOnline: Boolean(form.allowIndoorOnline),
        allowTerraceOnline: Boolean(form.allowTerraceOnline),
        allowOnlineBooking: Boolean(form.allowOnlineBooking),
        allowWalkIns: Boolean(form.allowWalkIns),
        allowPhoneReservations: Boolean(form.allowPhoneReservations),
        defaultReservationDurationMin: Number(form.defaultReservationDurationMin),
        tableTurnoverBufferMin: Number(form.tableTurnoverBufferMin),
        reservationLeadTimeMin: Number(form.reservationLeadTimeMin),
        reservationCutoffMin: Number(form.reservationCutoffMin)
      };

      const activeBranchId = String(branchId || getCurrentContext()?.branchId || "").trim();

      if (!activeBranchId) {
        throw new Error(t("branchMissing"));
      }

      const response = await fetch(`${API_BASE_URL}/branches/${activeBranchId}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setSaveMessage(t("bookingSaved"));
    } catch (error: any) {
      setErrorMessage(error?.message || t("bookingSaveFailed"));
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveBusinessHours() {
    try {
      setSavingHours(true);
      setErrorMessage("");
      setSaveMessage("");

      const payload = {
        days: days.map((day) => {
          const slots = day.isClosed
            ? []
            : [
                ...(day.shift1.enabled
                  ? [
                      {
                        openTime: day.shift1.openTime,
                        closeTime: day.shift1.closeTime,
                        serviceType: day.shift1.serviceType
                      }
                    ]
                  : []),
                ...(day.shift2.enabled
                  ? [
                      {
                        openTime: day.shift2.openTime,
                        closeTime: day.shift2.closeTime,
                        serviceType: day.shift2.serviceType
                      }
                    ]
                  : [])
              ];

          return {
            dayOfWeek: day.dayOfWeek,
            slots
          };
        })
      };

      const activeBranchId = String(branchId || getCurrentContext()?.branchId || "").trim();

      if (!activeBranchId) {
        throw new Error(t("branchMissing"));
      }

      const response = await fetch(`${API_BASE_URL}/branches/${activeBranchId}/business-hours`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setSaveMessage(t("hoursSaved"));
    } catch (error: any) {
      setErrorMessage(error?.message || t("hoursSaveFailed"));
    } finally {
      setSavingHours(false);
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>
          <div style={loadingCardStyle}>{t("loading")}</div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <div style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>{t("eyebrow")}</div>
            <h1 style={titleStyle}>{t("title")}</h1>
            <p style={subtitleStyle}>
              {t("subtitle", { branchName: branchName || t("mainBranch") })}
            </p>
          </div>

          <Link href={`/${locale}/dashboard`} style={backButtonStyle}>
            {t("backToDashboard")}
          </Link>
        </div>

        {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}
        {saveMessage ? <div style={successStyle}>{saveMessage}</div> : null}

        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>{t("stats.maxGuests")}</div>
            <div style={statValueStyle}>{form.maxPartySize}</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>{t("stats.dailyCap")}</div>
            <div style={statValueStyle}>{form.maxOnlineGuestsPerDay}</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>{t("stats.openDays")}</div>
            <div style={statValueStyle}>{summary.openDays}</div>
          </div>

          <div style={statCardStyle}>
            <div style={statLabelStyle}>{t("stats.enabledShifts")}</div>
            <div style={statValueStyle}>{summary.enabledShiftCount}</div>
          </div>
        </div>

        <div style={gridStyle}>
          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={sectionTitleStyle}>{t("bookingPolicy.title")}</div>
                <div style={sectionSubtitleStyle}>
                  {t("bookingPolicy.subtitle")}
                </div>
              </div>
            </div>

            <div style={formGridStyle}>
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>{t("fields.maxPersons")}</label>
                <input
                  type="number"
                  value={form.maxPartySize}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      maxPartySize: Number(e.target.value)
                    }))
                  }
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>{t("fields.totalCapacity")}</label>
                <input
                  type="number"
                  value={form.totalSeatingCapacity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      totalSeatingCapacity: Number(e.target.value)
                    }))
                  }
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>{t("fields.maxOnlineGuests")}</label>
                <input
                  type="number"
                  value={form.maxOnlineGuestsPerDay}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      maxOnlineGuestsPerDay: Number(e.target.value)
                    }))
                  }
                  style={inputStyle}
                />
              </div>
                          <div style={fieldGroupStyle}>
                <label style={labelStyle}>{t("fields.duration")}</label>
                <input
                  type="number"
                  value={form.defaultReservationDurationMin}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      defaultReservationDurationMin: Number(e.target.value)
                    }))
                  }
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>{t("fields.turnover")}</label>
                <input
                  type="number"
                  value={form.tableTurnoverBufferMin}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      tableTurnoverBufferMin: Number(e.target.value)
                    }))
                  }
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>{t("fields.leadTime")}</label>
                <input
                  type="number"
                  value={form.reservationLeadTimeMin}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      reservationLeadTimeMin: Number(e.target.value)
                    }))
                  }
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>{t("fields.cutoff")}</label>
                <input
                  type="number"
                  value={form.reservationCutoffMin}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      reservationCutoffMin: Number(e.target.value)
                    }))
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={toggleStackStyle}>
              <div style={toggleRowStyle}>
                <div>
                  <div style={toggleTitleStyle}>{t("toggles.onlineTitle")}</div>
                  <div style={toggleHintStyle}>{t("toggles.onlineHint")}</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.allowOnlineBooking}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      allowOnlineBooking: e.target.checked
                    }))
                  }
                />
              </div>

              <div style={toggleRowStyle}>
                <div>
                  <div style={toggleTitleStyle}>{t("toggles.walkInsTitle")}</div>
                  <div style={toggleHintStyle}>{t("toggles.walkInsHint")}</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.allowWalkIns}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      allowWalkIns: e.target.checked
                    }))
                  }
                />
              </div>

              <div style={toggleRowStyle}>
                <div>
                  <div style={toggleTitleStyle}>{t("toggles.phoneTitle")}</div>
                  <div style={toggleHintStyle}>{t("toggles.phoneHint")}</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.allowPhoneReservations}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      allowPhoneReservations: e.target.checked
                    }))
                  }
                />
              </div>

              <div style={toggleRowStyle}>
                <div>
                  <div style={toggleTitleStyle}>{t("toggles.indoorTitle")}</div>
                  <div style={toggleHintStyle}>{t("toggles.indoorHint")}</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.allowIndoorOnline}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      allowIndoorOnline: e.target.checked
                    }))
                  }
                />
              </div>

              <div style={toggleRowStyle}>
                <div>
                  <div style={toggleTitleStyle}>{t("toggles.terraceTitle")}</div>
                  <div style={toggleHintStyle}>{t("toggles.terraceHint")}</div>
                </div>
                <input
                  type="checkbox"
                  checked={form.allowTerraceOnline}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      allowTerraceOnline: e.target.checked
                    }))
                  }
                />
              </div>
            </div>

            <div style={actionsRowStyle}>
              <button
                type="button"
                onClick={saveSettings}
                disabled={savingSettings}
                style={primaryButtonStyle}
              >
                {savingSettings ? t("savingBooking") : t("saveBooking")}
              </button>
            </div>
          </section>

          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={sectionTitleStyle}>{t("weeklyHours.title")}</div>
                <div style={sectionSubtitleStyle}>
                  {t("weeklyHours.subtitle")}
                </div>
              </div>
            </div>

            <div style={daysStackStyle}>
              {days.map((day) => (
                <div key={day.dayOfWeek} style={dayCardStyle}>
                  <div style={dayHeaderStyle}>
                    <div>
                      <div style={dayTitleStyle}>{getDayLabel(day.dayOfWeek)}</div>
                      <div style={dayMetaStyle}>
                        {getActiveShiftLabel(day)}
                      </div>
                    </div>

                    <label style={toggleInlineStyle}>
                      <input
                        type="checkbox"
                        checked={!day.isClosed}
                        onChange={(e) =>
                          updateDay(day.dayOfWeek, (current) => ({
                            ...current,
                            isClosed: !e.target.checked
                          }))
                        }
                      />
                      <span>{t("open")}</span>
                    </label>
                  </div>

                  {!day.isClosed ? (
                    <div style={shiftGridStyle}>
                      <div style={shiftCardStyle}>
                        <div style={shiftHeaderStyle}>
                          <div style={shiftTitleStyle}>{t("shift1")}</div>
                          <label style={toggleInlineStyle}>
                            <input
                              type="checkbox"
                              checked={day.shift1.enabled}
                              onChange={(e) =>
                                updateDay(day.dayOfWeek, (current) => ({
                                  ...current,
                                  shift1: {
                                    ...current.shift1,
                                    enabled: e.target.checked
                                  }
                                }))
                              }
                            />
                            <span>{t("enabled")}</span>
                          </label>
                        </div>

                        <div style={shiftFieldsStyle}>
                          <select
                            value={day.shift1.serviceType}
                            onChange={(e) =>
                              updateDay(day.dayOfWeek, (current) => ({
                                ...current,
                                shift1: {
                                  ...current.shift1,
                                  serviceType: e.target.value as "LUNCH" | "DINNER"
                                }
                              }))
                            }
                            style={inputStyle}
                          >
                            <option value="LUNCH">{getServiceTypeLabel("LUNCH")}</option>
                            <option value="DINNER">{getServiceTypeLabel("DINNER")}</option>
                          </select>

                          <input
                            type="time"
                            value={day.shift1.openTime}
                            onChange={(e) =>
                              updateDay(day.dayOfWeek, (current) => ({
                                ...current,
                                shift1: {
                                  ...current.shift1,
                                  openTime: e.target.value
                                }
                              }))
                            }
                            style={inputStyle}
                          />

                          <input
                            type="time"
                            value={day.shift1.closeTime}
                            onChange={(e) =>
                              updateDay(day.dayOfWeek, (current) => ({
                                ...current,
                                shift1: {
                                  ...current.shift1,
                                  closeTime: e.target.value
                                }
                              }))
                            }
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div style={shiftCardStyle}>
                        <div style={shiftHeaderStyle}>
                          <div style={shiftTitleStyle}>{t("shift2")}</div>
                          <label style={toggleInlineStyle}>
                            <input
                              type="checkbox"
                              checked={day.shift2.enabled}
                              onChange={(e) =>
                                updateDay(day.dayOfWeek, (current) => ({
                                  ...current,
                                  shift2: {
                                    ...current.shift2,
                                    enabled: e.target.checked
                                  }
                                }))
                              }
                            />
                            <span>{t("enabled")}</span>
                          </label>
                        </div>

                        <div style={shiftFieldsStyle}>
                          <select
                            value={day.shift2.serviceType}
                            onChange={(e) =>
                              updateDay(day.dayOfWeek, (current) => ({
                                ...current,
                                shift2: {
                                  ...current.shift2,
                                  serviceType: e.target.value as "LUNCH" | "DINNER"
                                }
                              }))
                            }
                            style={inputStyle}
                          >
                            <option value="LUNCH">{getServiceTypeLabel("LUNCH")}</option>
                            <option value="DINNER">{getServiceTypeLabel("DINNER")}</option>
                          </select>

                          <input
                            type="time"
                            value={day.shift2.openTime}
                            onChange={(e) =>
                              updateDay(day.dayOfWeek, (current) => ({
                                ...current,
                                shift2: {
                                  ...current.shift2,
                                  openTime: e.target.value
                                }
                              }))
                            }
                            style={inputStyle}
                          />

                          <input
                            type="time"
                            value={day.shift2.closeTime}
                            onChange={(e) =>
                              updateDay(day.dayOfWeek, (current) => ({
                                ...current,
                                shift2: {
                                  ...current.shift2,
                                  closeTime: e.target.value
                                }
                              }))
                            }
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div style={actionsRowStyle}>
              <button
                type="button"
                onClick={saveBusinessHours}
                disabled={savingHours}
                style={primaryButtonStyle}
              >
                {savingHours ? t("savingHours") : t("saveHours")}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#020817 0%, #04112a 100%)",
  color: "#ffffff",
  padding: "32px 20px 48px"
};

const shellStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  display: "grid",
  gap: "20px"
};

const heroStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap",
  padding: "8px 2px"
};

const eyebrowStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  marginBottom: "14px"
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "40px",
  lineHeight: 1.05
};

const subtitleStyle: React.CSSProperties = {
  marginTop: "14px",
  marginBottom: 0,
  maxWidth: "760px",
  color: "rgba(255,255,255,0.68)",
  lineHeight: 1.7,
  fontSize: "15px"
};

const backButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "46px",
  padding: "0 18px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 600
};

const loadingCardStyle: React.CSSProperties = {
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: "28px"
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px"
};

const statCardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
  padding: "18px 20px"
};

const statLabelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.65)",
  fontSize: "13px",
  marginBottom: "8px"
};

const statValueStyle: React.CSSProperties = {
  fontSize: "30px",
  fontWeight: 700,
  lineHeight: 1
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
  gap: "20px",
  alignItems: "start"
};

const cardStyle: React.CSSProperties = {
  borderRadius: "28px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
  padding: "24px",
  boxShadow: "0 18px 50px rgba(0,0,0,0.24)"
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
  marginBottom: "18px"
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  marginBottom: "6px"
};

const sectionSubtitleStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "14px",
  lineHeight: 1.6
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  marginBottom: "20px"
};

const fieldGroupStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px"
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.72)"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "46px",
  padding: "0 14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  outline: "none",
  boxSizing: "border-box"
};

const toggleStackStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
  marginBottom: "20px"
};

const toggleRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  padding: "14px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)"
};

const toggleTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: "4px"
};

const toggleHintStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.58)",
  fontSize: "13px"
};

const actionsRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-start"
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: "48px",
  padding: "0 18px",
  borderRadius: "14px",
  background: "#2563eb",
  border: "none",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer"
};

const daysStackStyle: React.CSSProperties = {
  display: "grid",
  gap: "14px"
};

const dayCardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.03)",
  padding: "18px"
};

const dayHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  marginBottom: "14px",
  flexWrap: "wrap"
};

const dayTitleStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700
};

const dayMetaStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "rgba(255,255,255,0.58)",
  marginTop: "4px"
};

const shiftGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "14px"
};

const shiftCardStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.03)",
  padding: "14px"
};

const shiftHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "12px",
  flexWrap: "wrap"
};

const shiftTitleStyle: React.CSSProperties = {
  fontWeight: 700
};

const shiftFieldsStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px"
};

const toggleInlineStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  color: "rgba(255,255,255,0.84)",
  fontSize: "13px"
};

const errorStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(255,120,120,0.20)",
  background: "rgba(255,80,80,0.10)",
  color: "#ffd6d6",
  padding: "14px 16px"
};

const successStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(120,255,180,0.20)",
  background: "rgba(60,200,120,0.10)",
  color: "#dfffea",
  padding: "14px 16px"
};