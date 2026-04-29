"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Brain, CheckCircle2, RefreshCw, Sparkles, Table2 } from "lucide-react";
import { apiGet, getCurrentContext } from "@/lib/api";

type Props = {
  locale: string;
};

type InsightResponse = {
  mode?: string;
  model?: string | null;
  generatedAt?: string;
  data?: {
    metrics?: {
      reservationsTotal?: number;
      activeTables?: number;
      activeCombinations?: number;
      totalSingleTableSeats?: number;
      largestSingleTable?: number;
      largestCombination?: number;
      statusCounts?: Record<string, number>;
    };
  };
  insight?: {
    riskTitle?: string;
    riskText?: string;
    recommendationTitle?: string;
    recommendationText?: string;
    whyTitle?: string;
    whyText?: string;
  };
};

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function labels(locale: string) {
  if (locale === "de") {
    return {
      loading: "AI analysiert Live-Daten...",
      refresh: "AI Analyse aktualisieren",
      failed: "AI Analyse konnte nicht geladen werden.",
      liveSignals: "Live-Signale",
      generated: "Generiert",
      mode: "Modus",
      model: "Modell",
      reservations: "Reservierungen",
      tables: "Aktive Tische",
      combinations: "Kombinationen",
      seats: "Einzelsitz-Kapazität",
    };
  }

  if (locale === "en") {
    return {
      loading: "AI is analyzing live data...",
      refresh: "Refresh AI analysis",
      failed: "AI analysis could not be loaded.",
      liveSignals: "Live signals",
      generated: "Generated",
      mode: "Mode",
      model: "Model",
      reservations: "Reservations",
      tables: "Active tables",
      combinations: "Combinations",
      seats: "Single-table seats",
    };
  }

  if (locale === "it") {
    return {
      loading: "AI sta analizzando i dati live...",
      refresh: "Aggiorna analisi AI",
      failed: "Analisi AI non caricata.",
      liveSignals: "Segnali live",
      generated: "Generato",
      mode: "Modalità",
      model: "Modello",
      reservations: "Prenotazioni",
      tables: "Tavoli attivi",
      combinations: "Combinazioni",
      seats: "Capacità tavoli singoli",
    };
  }

  return {
    loading: "AI po analizon të dhënat live...",
    refresh: "Rifresko analizën AI",
    failed: "Analiza AI nuk u ngarkua.",
    liveSignals: "Sinjale live",
    generated: "Gjeneruar",
    mode: "Modusi",
    model: "Modeli",
    reservations: "Rezervime",
    tables: "Tavolina aktive",
    combinations: "Kombinime",
    seats: "Kapacitet tavolinash",
  };
}

export default function AiAssistantClient({ locale }: Props) {
  const t = labels(locale);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InsightResponse | null>(null);

  async function loadInsight() {
    try {
      setLoading(true);
      setError("");

      const ctx = getCurrentContext();
      const tenantId = String(ctx?.tenantId || "").trim();
      const branchId = String(ctx?.branchId || "").trim();

      if (!tenantId || !branchId) {
        throw new Error("tenantId or branchId missing");
      }

      const search = new URLSearchParams({
        tenantId,
        branchId,
        locale,
        date: todayIsoDate(),
      });

      const response = await apiGet("/ai/insights?" + search.toString());
      setResult(response as InsightResponse);
    } catch (err: any) {
      setError(err?.message || t.failed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const metrics = result?.data?.metrics || {};
  const insight = result?.insight;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-emerald-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">OpenAI Control Layer</h2>
              <p className="mt-1 text-sm text-white/50">
                {t.mode}: {result?.mode || "-"} · {t.model}: {result?.model || "-"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadInsight}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            {t.refresh}
          </button>
        </div>

        {loading ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
            {t.loading}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <InsightCard
              icon={<AlertTriangle className="h-4 w-4" />}
              tone="amber"
              title={insight?.riskTitle || "Risk"}
              text={insight?.riskText || "-"}
            />
            <InsightCard
              icon={<Brain className="h-4 w-4" />}
              tone="sky"
              title={insight?.recommendationTitle || "Recommendation"}
              text={insight?.recommendationText || "-"}
            />
            <InsightCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              tone="emerald"
              title={insight?.whyTitle || "Why"}
              text={insight?.whyText || "-"}
            />

            <div className="text-xs text-white/40">
              {t.generated}: {result?.generatedAt || "-"}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]">
        <div>
          <h2 className="text-lg font-semibold text-white">{t.liveSignals}</h2>
          <p className="mt-1 text-sm text-white/50">{todayIsoDate()}</p>
        </div>

        <div className="mt-6 grid gap-3">
          <Metric icon={<Sparkles className="h-4 w-4" />} label={t.reservations} value={metrics.reservationsTotal || 0} />
          <Metric icon={<Table2 className="h-4 w-4" />} label={t.tables} value={metrics.activeTables || 0} />
          <Metric icon={<Table2 className="h-4 w-4" />} label={t.combinations} value={metrics.activeCombinations || 0} />
          <Metric icon={<CheckCircle2 className="h-4 w-4" />} label={t.seats} value={metrics.totalSingleTableSeats || 0} />
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  icon,
  tone,
  title,
  text,
}: {
  icon: React.ReactNode;
  tone: "amber" | "sky" | "emerald";
  title: string;
  text: string;
}) {
  const className =
    tone === "amber"
      ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
      : tone === "sky"
        ? "border-sky-400/20 bg-sky-400/10 text-sky-100"
        : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";

  return (
    <div className={"rounded-3xl border p-4 " + className}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 opacity-85">{text}</p>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-3 text-sm text-white/70">
        <span className="text-white/45">{icon}</span>
        {label}
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
