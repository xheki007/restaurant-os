import FloorPlanEditor from "@/components/FloorPlanEditor";

type EditorLocale = "de" | "en" | "it" | "sq";

type FloorPlanEditorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeLocale(value: string | string[] | undefined): EditorLocale {
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === "de" || raw === "en" || raw === "it" || raw === "sq") {
    return raw;
  }

  return "de";
}

export default async function FloorPlanEditorPage({ searchParams }: FloorPlanEditorPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialLocale = normalizeLocale(resolvedSearchParams.locale);

  return <FloorPlanEditor initialLocale={initialLocale} />;
}