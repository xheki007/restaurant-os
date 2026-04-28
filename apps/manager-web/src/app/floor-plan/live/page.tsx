import FloorPlanLiveView from "@/components/FloorPlanLiveView";

type LiveFloorLocale = "de" | "en" | "it" | "sq";

type FloorPlanLivePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeLocale(value: string | string[] | undefined): LiveFloorLocale {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === "de" || raw === "en" || raw === "it" || raw === "sq") {
    return raw;
  }

  return "de";
}

function normalizeDate(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  return undefined;
}

export default async function FloorPlanLivePage({ searchParams }: FloorPlanLivePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialLocale = normalizeLocale(resolvedSearchParams.locale);
  const initialDate = normalizeDate(resolvedSearchParams.date);

  return <FloorPlanLiveView initialLocale={initialLocale} initialDate={initialDate} />;
}