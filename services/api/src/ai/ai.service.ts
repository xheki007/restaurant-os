import { BadRequestException, Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { PrismaService } from "../prisma/prisma.service";

type InsightInput = {
  tenantId?: string;
  branchId?: string;
  date?: string;
  locale?: string;
};

function normalizeDate(input?: string) {
  if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  return new Date().toISOString().slice(0, 10);
}

function dayWindow(date: string) {
  return {
    start: new Date(`${date}T00:00:00.000Z`),
    end: new Date(`${date}T23:59:59.999Z`),
  };
}

function safeLocale(locale?: string) {
  if (locale === "de" || locale === "en" || locale === "it" || locale === "sq") {
    return locale;
  }

  return "sq";
}

function fallbackText(locale: string) {
  if (locale === "de") {
    return {
      riskTitle: "Operatives Risiko",
      riskText: "Die Daten wurden geladen, aber die OpenAI-Analyse ist aktuell nicht verfügbar.",
      recommendationTitle: "Empfehlung",
      recommendationText: "Prüfe Reservierungen, Tischkapazitäten und Kombinationsmöglichkeiten manuell.",
      whyTitle: "Begründung",
      whyText: "Fallback-Modus aktiv, damit der Betrieb auch ohne AI-Antwort weiterläuft.",
    };
  }

  if (locale === "en") {
    return {
      riskTitle: "Operational risk",
      riskText: "Live data loaded, but OpenAI analysis is currently unavailable.",
      recommendationTitle: "Recommendation",
      recommendationText: "Review reservations, table capacity and combinations manually.",
      whyTitle: "Reasoning",
      whyText: "Fallback mode is active so operations can continue without an AI response.",
    };
  }

  if (locale === "it") {
    return {
      riskTitle: "Rischio operativo",
      riskText: "Dati live caricati, ma l'analisi OpenAI non è disponibile.",
      recommendationTitle: "Raccomandazione",
      recommendationText: "Controlla manualmente prenotazioni, capacità tavoli e combinazioni.",
      whyTitle: "Motivo",
      whyText: "Modalità fallback attiva per continuare l'operazione anche senza risposta AI.",
    };
  }

  return {
    riskTitle: "Rreziku operacional",
    riskText: "Të dhënat live u ngarkuan, por analiza OpenAI nuk është aktualisht e disponueshme.",
    recommendationTitle: "Rekomandim",
    recommendationText: "Kontrollo manualisht rezervimet, kapacitetet e tavolinave dhe kombinimet.",
    whyTitle: "Arsyetim",
    whyText: "Fallback mode është aktiv që operacioni të vazhdojë edhe pa përgjigje nga AI.",
  };
}

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async buildInsights(input: InsightInput) {
    const tenantId = String(input.tenantId || "").trim();
    const branchId = String(input.branchId || "").trim();

    if (!tenantId || !branchId) {
      throw new BadRequestException("tenantId and branchId are required");
    }

    const locale = safeLocale(input.locale);
    const date = normalizeDate(input.date);
    const window = dayWindow(date);

    const prismaAny = this.prisma as any;

    const [branch, reservations, tables, combinations] = await Promise.all([
      prismaAny.branch.findUnique({
        where: { id: branchId },
        select: {
          id: true,
          name: true,
          city: true,
          timezone: true,
          restaurant: {
            select: {
              name: true,
            },
          },
        },
      }),
      prismaAny.reservation.findMany({
        where: {
          tenantId,
          branchId,
          startAt: {
            gte: window.start,
            lte: window.end,
          },
        },
        orderBy: { startAt: "asc" },
        select: {
          id: true,
          status: true,
          source: true,
          guest: {
            select: {
              fullName: true,
              email: true,
            },
          },
          partySize: true,
          startAt: true,
          endAt: true,
          assignedTableId: true,
          assignedCombinationId: true,
        },
      }),
      prismaAny.restaurantTable.findMany({
        where: {
          tenantId,
          branchId,
          isActive: true,
        },
        orderBy: [
          { capacityMax: "asc" },
          { code: "asc" },
        ],
        select: {
          id: true,
          name: true,
          code: true,
          capacityMin: true,
          capacityMax: true,
          zone: {
            select: {
              name: true,
              code: true,
              type: true,
            },
          },
        },
      }),
      prismaAny.tableCombination.findMany({
        where: {
          tenantId,
          branchId,
          isActive: true,
        },
        orderBy: [
          { capacityMax: "asc" },
          { name: "asc" },
        ],
        select: {
          id: true,
          name: true,
          capacityMin: true,
          capacityMax: true,
        },
      }),
    ]);

    const statusCounts = reservations.reduce((acc: Record<string, number>, item: any) => {
      const key = String(item.status || "UNKNOWN");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const context = {
      date,
      locale,
      branch,
      metrics: {
        reservationsTotal: reservations.length,
        statusCounts,
        activeTables: tables.length,
        activeCombinations: combinations.length,
        totalSingleTableSeats: tables.reduce((sum: number, table: any) => sum + Number(table.capacityMax || 0), 0),
        largestSingleTable: tables.reduce((max: number, table: any) => Math.max(max, Number(table.capacityMax || 0)), 0),
        largestCombination: combinations.reduce((max: number, combination: any) => Math.max(max, Number(combination.capacityMax || 0)), 0),
      },
      reservations: reservations.map((item: any) => ({
        status: item.status,
        source: item.source,
        guestName: item.guest?.fullName || item.guest?.email || null,
        partySize: item.partySize,
        startAt: item.startAt,
        assignedTableId: item.assignedTableId,
        assignedCombinationId: item.assignedCombinationId,
      })),
      tables: tables.map((item: any) => ({
        code: item.code,
        name: item.name,
        capacityMin: item.capacityMin,
        capacityMax: item.capacityMax,
        zone: item.zone?.name || item.zone?.code || null,
      })),
      combinations: combinations.map((item: any) => ({
        name: item.name,
        capacityMin: item.capacityMin,
        capacityMax: item.capacityMax,
      })),
    };

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    if (!apiKey) {
      return {
        mode: "fallback",
        model: null,
        generatedAt: new Date().toISOString(),
        data: context,
        insight: fallbackText(locale),
      };
    }

    try {
      const client = new OpenAI({ apiKey });

      const response = await client.responses.create({
        model,
        instructions:
          "You are an enterprise restaurant operations AI. Analyze restaurant reservations, tables and combinations. Return ONLY valid JSON. No markdown. The JSON must contain: riskTitle, riskText, recommendationTitle, recommendationText, whyTitle, whyText. Keep it practical, concise and operational. The final decision always remains with staff.",
        input:
          "Language/locale: " +
          locale +
          "\nRestaurant live data JSON:\n" +
          JSON.stringify(context),
      });

      const rawText = String(response.output_text || "").trim();
      let parsed: any;

      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = {
          riskTitle: fallbackText(locale).riskTitle,
          riskText: rawText || fallbackText(locale).riskText,
          recommendationTitle: fallbackText(locale).recommendationTitle,
          recommendationText: fallbackText(locale).recommendationText,
          whyTitle: fallbackText(locale).whyTitle,
          whyText: fallbackText(locale).whyText,
        };
      }

      return {
        mode: "openai",
        model,
        generatedAt: new Date().toISOString(),
        data: context,
        insight: {
          riskTitle: String(parsed.riskTitle || fallbackText(locale).riskTitle),
          riskText: String(parsed.riskText || fallbackText(locale).riskText),
          recommendationTitle: String(parsed.recommendationTitle || fallbackText(locale).recommendationTitle),
          recommendationText: String(parsed.recommendationText || fallbackText(locale).recommendationText),
          whyTitle: String(parsed.whyTitle || fallbackText(locale).whyTitle),
          whyText: String(parsed.whyText || fallbackText(locale).whyText),
        },
      };
    } catch (error: any) {
      return {
        mode: "fallback",
        model,
        generatedAt: new Date().toISOString(),
        data: context,
        insight: {
          ...fallbackText(locale),
          riskText: (fallbackText(locale).riskText + " " + String(error?.message || "")).trim(),
        },
      };
    }
  }
}
