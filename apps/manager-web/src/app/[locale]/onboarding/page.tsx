"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "";

export default function OnboardingPage() {
  const t = useTranslations("onboardingPage");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [createdResult, setCreatedResult] = useState<null | {
    tenant?: { id?: string; name?: string; slug?: string };
    restaurant?: { id?: string; name?: string };
    branch?: { id?: string; name?: string; code?: string };
    adminUser?: { id?: string; email?: string };
    adminRole?: { id?: string; code?: string; name?: string };
  }>(null);

  const [form, setForm] = useState({
    tenantName: "",
    tenantSlug: "",
    timezone: "Europe/Belgrade",
    defaultLanguage: "de",
    currency: "EUR",

    restaurantName: "",
    legalName: "",
    phone: "",
    email: "",
    website: "",
    description: "",

    branchName: "Main Branch",
    branchCode: "MAIN",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "",
    branchPhone: "",
    branchEmail: "",

    defaultReservationDurationMin: 90,
    maxPartySize: 10,
    allowOnlineBooking: true,
    allowWalkIns: true,
    allowPhoneReservations: true,
    requireGuestPhone: true,
    requireGuestEmail: false,
    reservationLeadTimeMin: 30,
    reservationCutoffMin: 30,

    adminFullName: "",
    adminEmail: "",
    adminPassword: ""
  });

  function setField(name: string, value: string | number | boolean) {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function autoSlug(value: string) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    setCreatedResult(null);

    try {
      const response = await fetch(API_BASE_URL + "/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(json?.message)
            ? json.message.join(", ")
            : json?.message || t("failed")
        );
      }

      setCreatedResult(json);
      setSuccess(t("success"));

      setTimeout(() => {
        if (json?.tenant?.slug) {
          window.location.href = "/login?tenant=" + encodeURIComponent(json.tenant.slug);
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <div style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>{t("eyebrow")}</div>
            <h1 style={titleStyle}>{t("title")}</h1>
            <p style={subtitleStyle}>
              {t("subtitle")}
            </p>
          </div>
        </div>

        {success ? (
          <div style={successStyle}>
            <div style={{ fontWeight: 700, marginBottom: "8px" }}>{success}</div>

            {createdResult ? (
              <div style={successDetailsStyle}>
                <div><strong>{t("result.tenant")}:</strong> {createdResult.tenant?.name || "-"}</div>
                <div><strong>{t("result.tenantSlug")}:</strong> {createdResult.tenant?.slug || "-"}</div>
                <div><strong>{t("result.branch")}:</strong> {createdResult.branch?.name || "-"}</div>
                <div><strong>{t("result.branchCode")}:</strong> {createdResult.branch?.code || "-"}</div>
                <div><strong>{t("result.branchId")}:</strong> {createdResult.branch?.id || "-"}</div>
                <div><strong>{t("result.adminEmail")}:</strong> {createdResult.adminUser?.email || "-"}</div>
                <div><strong>{t("result.adminRole")}:</strong> {createdResult.adminRole?.name || "-"}</div>
              </div>
            ) : null}

            <div style={successNextStyle}>
              {t("nextSteps")}
            </div>
          </div>
        ) : null}

        {error ? <div style={errorStyle}>{error}</div> : null}

        <form onSubmit={handleSubmit} style={formWrapStyle}>
          <section style={cardStyle}>
            <div style={sectionTitleStyle}>{t("sections.tenant")}</div>
            <div style={grid2Style}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.tenantName")}</label>
                <input
                  value={form.tenantName}
                  onChange={(e) => {
                    setField("tenantName", e.target.value);
                    if (!form.tenantSlug) {
                      setField("tenantSlug", autoSlug(e.target.value));
                    }
                  }}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.tenantSlug")}</label>
                <input
                  value={form.tenantSlug}
                  onChange={(e) => setField("tenantSlug", autoSlug(e.target.value))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.timezone")}</label>
                <input
                  value={form.timezone}
                  onChange={(e) => setField("timezone", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.defaultLanguage")}</label>
                <select
                  value={form.defaultLanguage}
                  onChange={(e) => setField("defaultLanguage", e.target.value)}
                  style={inputStyle}
                >
                  <option value="de">{t("languageOptions.de")}</option>
                  <option value="en">{t("languageOptions.en")}</option>
                  <option value="sq">{t("languageOptions.sq")}</option>
                  <option value="it">{t("languageOptions.it")}</option>
                </select>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <div style={sectionTitleStyle}>{t("sections.restaurant")}</div>
            <div style={grid2Style}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.restaurantName")}</label>
                <input
                  value={form.restaurantName}
                  onChange={(e) => setField("restaurantName", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.legalName")}</label>
                <input
                  value={form.legalName}
                  onChange={(e) => setField("legalName", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.restaurantEmail")}</label>
                <input
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.restaurantPhone")}</label>
                <input
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.website")}</label>
                <input
                  value={form.website}
                  onChange={(e) => setField("website", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>{t("fields.description")}</label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                style={textAreaStyle}
              />
            </div>
          </section>

          <section style={cardStyle}>
            <div style={sectionTitleStyle}>{t("sections.mainBranch")}</div>
            <div style={grid2Style}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.branchName")}</label>
                <input
                  value={form.branchName}
                  onChange={(e) => setField("branchName", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.branchCode")}</label>
                <input
                  value={form.branchCode}
                  onChange={(e) => setField("branchCode", e.target.value.toUpperCase())}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.addressLine1")}</label>
                <input
                  value={form.addressLine1}
                  onChange={(e) => setField("addressLine1", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.addressLine2")}</label>
                <input
                  value={form.addressLine2}
                  onChange={(e) => setField("addressLine2", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.city")}</label>
                <input
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.postalCode")}</label>
                <input
                  value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.country")}</label>
                <input
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.currency")}</label>
                <input
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.branchPhone")}</label>
                <input
                  value={form.branchPhone}
                  onChange={(e) => setField("branchPhone", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.branchEmail")}</label>
                <input
                  value={form.branchEmail}
                  onChange={(e) => setField("branchEmail", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <div style={sectionTitleStyle}>{t("sections.bookingDefaults")}</div>
            <div style={grid2Style}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.reservationDuration")}</label>
                <input
                  type="number"
                  value={form.defaultReservationDurationMin}
                  onChange={(e) => setField("defaultReservationDurationMin", Number(e.target.value))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.maxPartySize")}</label>
                <input
                  type="number"
                  value={form.maxPartySize}
                  onChange={(e) => setField("maxPartySize", Number(e.target.value))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.leadTime")}</label>
                <input
                  type="number"
                  value={form.reservationLeadTimeMin}
                  onChange={(e) => setField("reservationLeadTimeMin", Number(e.target.value))}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.cutoff")}</label>
                <input
                  type="number"
                  value={form.reservationCutoffMin}
                  onChange={(e) => setField("reservationCutoffMin", Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={toggleGridStyle}>
              <label style={toggleStyle}>
                <input
                  type="checkbox"
                  checked={form.allowOnlineBooking}
                  onChange={(e) => setField("allowOnlineBooking", e.target.checked)}
                />
                <span>{t("toggles.allowOnlineBooking")}</span>
              </label>

              <label style={toggleStyle}>
                <input
                  type="checkbox"
                  checked={form.allowWalkIns}
                  onChange={(e) => setField("allowWalkIns", e.target.checked)}
                />
                <span>{t("toggles.allowWalkIns")}</span>
              </label>

              <label style={toggleStyle}>
                <input
                  type="checkbox"
                  checked={form.allowPhoneReservations}
                  onChange={(e) => setField("allowPhoneReservations", e.target.checked)}
                />
                <span>{t("toggles.allowPhoneReservations")}</span>
              </label>

              <label style={toggleStyle}>
                <input
                  type="checkbox"
                  checked={form.requireGuestPhone}
                  onChange={(e) => setField("requireGuestPhone", e.target.checked)}
                />
                <span>{t("toggles.requireGuestPhone")}</span>
              </label>

              <label style={toggleStyle}>
                <input
                  type="checkbox"
                  checked={form.requireGuestEmail}
                  onChange={(e) => setField("requireGuestEmail", e.target.checked)}
                />
                <span>{t("toggles.requireGuestEmail")}</span>
              </label>
            </div>

            <div style={noteStyle}>
              {t("note")}
            </div>
          </section>

          <section style={cardStyle}>
            <div style={sectionTitleStyle}>{t("sections.firstAdmin")}</div>
            <div style={grid2Style}>
              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.adminFullName")}</label>
                <input
                  value={form.adminFullName}
                  onChange={(e) => setField("adminFullName", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{t("fields.adminEmail")}</label>
                <input
                  value={form.adminEmail}
                  onChange={(e) => setField("adminEmail", e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>{t("fields.adminPassword")}</label>
                <input
                  type="password"
                  value={form.adminPassword}
                  onChange={(e) => setField("adminPassword", e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </section>

          <div style={actionsStyle}>
            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? t("creating") : t("createTenant")}
            </button>
          </div>
        </form>
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
  maxWidth: "1200px",
  margin: "0 auto",
  display: "grid",
  gap: "20px"
};

const heroStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap"
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
  maxWidth: "820px",
  color: "rgba(255,255,255,0.68)",
  lineHeight: 1.7,
  fontSize: "15px"
};

const formWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: "18px"
};

const cardStyle: React.CSSProperties = {
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
  padding: "22px"
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  marginBottom: "16px"
};

const grid2Style: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px"
};

const fieldStyle: React.CSSProperties = {
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

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "100px",
  paddingTop: "12px",
  paddingBottom: "12px"
};

const toggleGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
  marginTop: "16px"
};

const toggleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minHeight: "46px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  padding: "0 14px"
};

const noteStyle: React.CSSProperties = {
  marginTop: "16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: "12px 14px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "13px",
  lineHeight: 1.7
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-start"
};

const buttonStyle: React.CSSProperties = {
  minHeight: "48px",
  padding: "0 18px",
  borderRadius: "14px",
  background: "#2563eb",
  border: "none",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer"
};

const successStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(120,255,180,0.20)",
  background: "rgba(60,200,120,0.10)",
  color: "#dfffea",
  padding: "14px 16px"
};

const errorStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(255,120,120,0.20)",
  background: "rgba(255,80,80,0.10)",
  color: "#ffd6d6",
  padding: "14px 16px"
};

const successDetailsStyle: React.CSSProperties = {
  marginTop: "10px",
  paddingTop: "10px",
  borderTop: "1px solid rgba(255,255,255,0.10)",
  display: "grid",
  gap: "6px",
  fontSize: "14px",
  lineHeight: 1.6
};

const successNextStyle: React.CSSProperties = {
  marginTop: "12px",
  paddingTop: "10px",
  borderTop: "1px solid rgba(255,255,255,0.10)",
  color: "#dfffea",
  fontSize: "13px",
  lineHeight: 1.7
};