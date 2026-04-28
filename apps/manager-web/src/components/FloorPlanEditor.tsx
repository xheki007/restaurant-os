"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FloorPlanEditorSection from "@/components/FloorPlanEditorSection";
import {
  createLayoutLabel,
  createTable,
  createZone,
  deleteLayoutLabel,
  deleteTable,
  deleteZone,
  getLayoutLabels,
  getTables,
  getZones,
  getTableCombinations,
  getCurrentContext,
  getFloorPlans,
  updateLayoutLabel,
  updateTable,
  updateZone
} from "@/lib/api";

type ZoneItem = {
  id: string;
  tenantId: string;
  branchId: string;
  floorPlanId: string;
  name: string;
  code: string;
  type: string;
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
  tenantId: string;
  branchId: string;
  zoneId: string;
  floorPlanId: string;
  name: string;
  code: string;
  capacityMin: number;
  capacityMax: number;
  shape: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  rotation?: number;
  isActive?: boolean;
  zone?: {
    id: string;
    name?: string;
    color?: string;
    type?: string;
  };
  floorPlan?: {
    id: string;
    name?: string;
    canvasWidth?: number;
    canvasHeight?: number;
  };
};

type LayoutLabelItem = {
  id: string;
  tenantId: string;
  branchId: string;
  floorPlanId: string;
  text: string;
  posX: number;
  posY: number;
  color?: string;
  fontSize?: number;
};

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  tableId: string | null;
};

type TableDragState = {
  kind: "table";
  id: string;
  startX: number;
  startY: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
} | null;

type LabelDragState = {
  kind: "label";
  id: string;
  startX: number;
  startY: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  canvasWidth: number;
  canvasHeight: number;
} | null;

type ZoneDragState = {
  kind: "zone";
  id: string;
  startX: number;
  startY: number;
  pointerOffsetX: number;
  pointerOffsetY: number;
  width: number;
  height: number;
  canvasWidth: number;
  canvasHeight: number;
} | null;

type ZoneResizeState = {
  kind: "zone_resize";
  id: string;
  startWidth: number;
  startHeight: number;
  startPointerX: number;
  startPointerY: number;
  minWidth: number;
  minHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  currentX: number;
  currentY: number;
} | null;

const COLOR_OPTIONS = [
  { name: "Blue", value: "#2563EB", soft: "rgba(37,99,235,0.12)" },
  { name: "Green", value: "#16A34A", soft: "rgba(22,163,74,0.12)" },
  { name: "Amber", value: "#D97706", soft: "rgba(217,119,6,0.12)" },
  { name: "Purple", value: "#9333EA", soft: "rgba(147,51,234,0.12)" },
  { name: "Rose", value: "#E11D48", soft: "rgba(225,29,72,0.12)" }
];

function normalizeColor(value?: string) {
  const match = COLOR_OPTIONS.find(
    (option) => option.value.toLowerCase() === String(value || "").toLowerCase()
  );

  return match || COLOR_OPTIONS[0];
}


type EditorLocale = "de" | "en" | "it" | "sq";

type FloorPlanEditorProps = {
  initialLocale?: EditorLocale;
};

function getEditorLabels(locale: EditorLocale) {
  if (locale === "sq") {
    return {
      description: "Krijo zona, shto tavolina, etiketa dhe nderto planin e restorantit direkt nga dashboard-i.",
      addZone: "Shto zone",
      selectedZone: "Zona e zgjedhur",
      addLabel: "Shto etikete",
      selectedLabel: "Etiketa e zgjedhur",
      addTable: "Shto tavoline",
      selectedTable: "Tavolina e zgjedhur",
      zoneName: "Emri i zones",
      zoneCode: "Kodi i zones",
      zoneType: "Tipi i zones",
      color: "Ngjyra",
      name: "Emri",
      code: "Kodi",
      type: "Tipi",
      text: "Teksti",
      textColor: "Ngjyra e tekstit",
      fontSize: "Madhesia e fontit",
      zone: "Zona",
      tableName: "Emri i tavolines",
      tableCode: "Kodi i tavolines",
      shape: "Forma",
      round: "Rrumbullake",
      square: "Katrore",
      rectangle: "Drejtkendeshe",
      min: "Min",
      max: "Max",
      minCapacity: "Kapaciteti min",
      maxCapacity: "Kapaciteti max",
      width: "Gjeresia",
      height: "Lartesia",
      saving: "Duke ruajtur...",
      createZone: "Krijo zone",
      updateZone: "Perditeso zonen",
      deleteZone: "Fshij zonen e zgjedhur",
      createLabel: "Krijo etikete",
      updateLabel: "Perditeso etiketen",
      deleteLabel: "Fshij etiketen e zgjedhur",
      createTable: "Krijo tavoline",
      updateTable: "Perditeso detajet e tavolines",
      deleteTable: "Fshij tavolinen e zgjedhur",
      indoor: "Brenda",
      terrace: "Terrase",
      privateRoom: "Dhome private",
      noZone: "Pa zone"
    };
  }

  if (locale === "it") {
    return {
      description: "Crea zone, aggiungi tavoli, etichette e costruisci la sala del ristorante direttamente dalla dashboard.",
      addZone: "Aggiungi zona",
      selectedZone: "Zona selezionata",
      addLabel: "Aggiungi etichetta",
      selectedLabel: "Etichetta selezionata",
      addTable: "Aggiungi tavolo",
      selectedTable: "Tavolo selezionato",
      zoneName: "Nome zona",
      zoneCode: "Codice zona",
      zoneType: "Tipo zona",
      color: "Colore",
      name: "Nome",
      code: "Codice",
      type: "Tipo",
      text: "Testo",
      textColor: "Colore testo",
      fontSize: "Dimensione font",
      zone: "Zona",
      tableName: "Nome tavolo",
      tableCode: "Codice tavolo",
      shape: "Forma",
      round: "Rotondo",
      square: "Quadrato",
      rectangle: "Rettangolo",
      min: "Min",
      max: "Max",
      minCapacity: "Capacita min",
      maxCapacity: "Capacita max",
      width: "Larghezza",
      height: "Altezza",
      saving: "Salvataggio...",
      createZone: "Crea zona",
      updateZone: "Aggiorna zona",
      deleteZone: "Elimina zona selezionata",
      createLabel: "Crea etichetta",
      updateLabel: "Aggiorna etichetta",
      deleteLabel: "Elimina etichetta selezionata",
      createTable: "Crea tavolo",
      updateTable: "Aggiorna dettagli tavolo",
      deleteTable: "Elimina tavolo selezionato",
      indoor: "Interno",
      terrace: "Terrazza",
      privateRoom: "Sala privata",
      noZone: "Nessuna zona"
    };
  }

  if (locale === "en") {
    return {
      description: "Create zones, add tables, labels, and build the restaurant layout directly from the dashboard.",
      addZone: "Add zone",
      selectedZone: "Selected zone",
      addLabel: "Add label",
      selectedLabel: "Selected label",
      addTable: "Add table",
      selectedTable: "Selected table",
      zoneName: "Zone name",
      zoneCode: "Zone code",
      zoneType: "Zone type",
      color: "Color",
      name: "Name",
      code: "Code",
      type: "Type",
      text: "Text",
      textColor: "Text color",
      fontSize: "Font size",
      zone: "Zone",
      tableName: "Table name",
      tableCode: "Table code",
      shape: "Shape",
      round: "Round",
      square: "Square",
      rectangle: "Rectangle",
      min: "Min",
      max: "Max",
      minCapacity: "Min capacity",
      maxCapacity: "Max capacity",
      width: "Width",
      height: "Height",
      saving: "Saving...",
      createZone: "Create zone",
      updateZone: "Update zone",
      deleteZone: "Delete selected zone",
      createLabel: "Create label",
      updateLabel: "Update label",
      deleteLabel: "Delete selected label",
      createTable: "Create table",
      updateTable: "Update table details",
      deleteTable: "Delete selected table",
      indoor: "Indoor",
      terrace: "Terrace",
      privateRoom: "Private room",
      noZone: "No zone"
    };
  }

  return {
    description: "Zonen erstellen, Tische und Beschriftungen hinzufuegen und den Restaurantplan direkt im Dashboard bauen.",
    addZone: "Zone hinzufuegen",
    selectedZone: "Ausgewaehlte Zone",
    addLabel: "Beschriftung hinzufuegen",
    selectedLabel: "Ausgewaehlte Beschriftung",
    addTable: "Tisch hinzufuegen",
    selectedTable: "Ausgewaehlter Tisch",
    zoneName: "Zonenname",
    zoneCode: "Zonencode",
    zoneType: "Zonentyp",
    color: "Farbe",
    name: "Name",
    code: "Code",
    type: "Typ",
    text: "Text",
    textColor: "Textfarbe",
    fontSize: "Schriftgroesse",
    zone: "Zone",
    tableName: "Tischname",
    tableCode: "Tischcode",
    shape: "Form",
    round: "Rund",
    square: "Quadratisch",
    rectangle: "Rechteckig",
    min: "Min",
    max: "Max",
    minCapacity: "Min. Kapazitaet",
    maxCapacity: "Max. Kapazitaet",
    width: "Breite",
    height: "Hoehe",
    saving: "Speichern...",
    createZone: "Zone erstellen",
    updateZone: "Zone aktualisieren",
    deleteZone: "Ausgewaehlte Zone loeschen",
    createLabel: "Beschriftung erstellen",
    updateLabel: "Beschriftung aktualisieren",
    deleteLabel: "Ausgewaehlte Beschriftung loeschen",
    createTable: "Tisch erstellen",
    updateTable: "Tischdetails aktualisieren",
    deleteTable: "Ausgewaehlten Tisch loeschen",
    indoor: "Innenbereich",
    terrace: "Terrasse",
    privateRoom: "Privatraum",
    noZone: "Keine Zone"
  };
}


function getEditorChromeLabels(locale: EditorLocale) {
  if (locale === "sq") {
    return {
      badge: "Editor i planit",
      title: "Ndertuesi i planit te tavolinave",
      backToDashboard: "Kthehu ne Dashboard",
      canvasTitle: "Plani vizual",
      tablesLoaded: "tavolina te ngarkuara",
      guestLabel: "mysafire"
    };
  }

  if (locale === "it") {
    return {
      badge: "Editor sala",
      title: "Costruttore layout tavoli",
      backToDashboard: "Torna alla Dashboard",
      canvasTitle: "Canvas layout",
      tablesLoaded: "tavoli caricati",
      guestLabel: "ospiti"
    };
  }

  if (locale === "en") {
    return {
      badge: "{chromeLabels.badge}",
      title: "{chromeLabels.title}",
      backToDashboard: "{chromeLabels.backToDashboard}",
      canvasTitle: "Layout canvas",
      tablesLoaded: "table(s) loaded",
      guestLabel: "guests"
    };
  }

  return {
    badge: "Saalplan-Editor",
    title: "Tischplan-Builder",
    backToDashboard: "Zurueck zum Dashboard",
    canvasTitle: "Layout-Flaeche",
    tablesLoaded: "Tische geladen",
    guestLabel: "Gaeste"
  };
}

function isEditorVisibleCombination(combination: any) {
  const name = String(combination?.name || "").trim().toUpperCase();
  return !name.startsWith("AUTO:");
}

export default function FloorPlanEditor({ initialLocale = "de" }: FloorPlanEditorProps) {
  const editorLabels = useMemo(() => getEditorLabels(initialLocale), [initialLocale]);
  const chromeLabels = useMemo(() => getEditorChromeLabels(initialLocale), [initialLocale]);
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [combinations, setCombinations] = useState<any[]>([]);
  const [labels, setLabels] = useState<LayoutLabelItem[]>([]);
  const [activeFloorPlan, setActiveFloorPlan] = useState<any>(null);
  const [currentContext, setCurrentContext] = useState({ tenantId: "", branchId: "" });
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [selectedLabelId, setSelectedLabelId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [openSection, setOpenSection] = useState("zone");
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    tableId: null
  });

  const [name, setName] = useState("Table 2");
  const [code, setCode] = useState("T2");
  const [shape, setShape] = useState("ROUND");
  const [capacityMin, setCapacityMin] = useState("2");
  const [capacityMax, setCapacityMax] = useState("4");
  const [width, setWidth] = useState("120");
  const [height, setHeight] = useState("120");

  const [zoneName, setZoneName] = useState("Terrace");
  const [zoneCode, setZoneCode] = useState("TERRACE");
  const [zoneType, setZoneType] = useState("TERRACE");
  const [zoneColorName, setZoneColorName] = useState("Green");

  const [labelText, setLabelText] = useState("TERRACE");
  const [labelColorName, setLabelColorName] = useState("Blue");
  const [labelFontSize, setLabelFontSize] = useState("28");

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const tableDragStateRef = useRef<TableDragState>(null);
  const labelDragStateRef = useRef<LabelDragState>(null);
  const zoneDragStateRef = useRef<ZoneDragState>(null);
  const zoneResizeStateRef = useRef<ZoneResizeState>(null);
  const tableElementsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const labelElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const zoneElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const rafRef = useRef<number | null>(null);

  async function loadData(
    preserveSelectedTableId?: string,
    preserveSelectedZoneId?: string,
    preserveSelectedLabelId?: string
  ) {
    setLoading(true);
    setMessage("");

    try {
      const ctx = getCurrentContext();
      const tenantId = String(ctx?.tenantId || "").trim();
      const branchId = String(ctx?.branchId || "").trim();

      setCurrentContext({ tenantId, branchId });

      if (!tenantId || !branchId) {
        setActiveFloorPlan(null);
        setZones([]);
        setTables([]);
        setCombinations([]);
        setLabels([]);
        setSelectedZoneId("");
        setSelectedTableId("");
        setSelectedLabelId("");
        setMessage("Tenant or branch context missing. Login again or select tenant context.");
        return;
      }

      const floorPlanRows = await getFloorPlans({
        tenantId,
        branchId,
        isActive: "true"
      });

      const floorPlan = Array.isArray(floorPlanRows) ? floorPlanRows[0] : null;
      setActiveFloorPlan(floorPlan || null);

      if (!floorPlan?.id) {
        setZones([]);
        setTables([]);
        setCombinations([]);
        setLabels([]);
        setSelectedZoneId("");
        setSelectedTableId("");
        setSelectedLabelId("");
        setMessage("No active floor plan found for this tenant/branch.");
        return;
      }

      const zoneRows = await getZones({
        tenantId,
        branchId,
        floorPlanId: floorPlan.id,
        isActive: "true"
      });

      const tableRows = await getTables({
        tenantId,
        branchId,
        floorPlanId: floorPlan.id,
        isActive: "true"
      });

      const combinationRows = await getTableCombinations({
        tenantId,
        branchId,
        isActive: "true"
      });

      const labelRows = await getLayoutLabels({
        tenantId,
        branchId,
        floorPlanId: floorPlan.id,
        isActive: "true"
      });

      setZones(zoneRows);
      setTables(tableRows);
      setCombinations([]);
      setLabels(labelRows);

      if (preserveSelectedZoneId) {
        setSelectedZoneId(preserveSelectedZoneId);
      } else if (zoneRows.length > 0 && !selectedZoneId) {
        setSelectedZoneId(zoneRows[0].id);
      } else if (zoneRows.length === 0) {
        setSelectedZoneId("");
      }

      if (preserveSelectedTableId) {
        setSelectedTableId(preserveSelectedTableId);
      } else if (tableRows.length > 0 && !selectedTableId) {
        setSelectedTableId(tableRows[0].id);
      } else if (tableRows.length === 0) {
        setSelectedTableId("");
      }

      if (preserveSelectedLabelId) {
        setSelectedLabelId(preserveSelectedLabelId);
      } else if (labelRows.length === 0) {
        setSelectedLabelId("");
      }
    } catch (error: any) {
      setMessage(error?.message || "Failed to load editor data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeZone = useMemo(() => {
    return zones.find((zone) => zone.id === selectedZoneId) || zones[0] || null;
  }, [zones, selectedZoneId]);

  const selectedTable = useMemo(() => {
    return tables.find((table) => table.id === selectedTableId) || null;
  }, [tables, selectedTableId]);

  const selectedLabel = useMemo(() => {
    return labels.find((label) => label.id === selectedLabelId) || null;
  }, [labels, selectedLabelId]);

  const selectedZone = useMemo(() => {
    return zones.find((zone) => zone.id === selectedZoneId) || null;
  }, [zones, selectedZoneId]);

  function getCombinationTableIds(combination: any): string[] {
    if (Array.isArray(combination?.tableIds)) {
      return combination.tableIds.filter(Boolean);
    }

    if (Array.isArray(combination?.items)) {
      return combination.items
        .map((item: any) => item?.tableId)
        .filter(Boolean);
    }

    return [];
  }

  const combinationMap = useMemo(() => {
    const map = new Map<string, any>();

    combinations.forEach((combination: any) => {
      const tableIds = getCombinationTableIds(combination);

      if (!tableIds.length) {
        return;
      }

      tableIds.forEach((id: string, index: number) => {
        map.set(id, {
          isLeader: index === 0,
          leaderId: tableIds[0],
          group: combination,
          tableIds
        });
      });
    });

    return map;
  }, [combinations]);

  const tooltipData = useMemo(() => {
    if (!tooltip.tableId) {
      return null;
    }

    const hoveredTable = tables.find((item) => item.id === tooltip.tableId) || null;
    const hoveredCombinationEntry = combinationMap.get(tooltip.tableId);
    const tableIds = hoveredCombinationEntry?.tableIds || [tooltip.tableId];
    const hoveredTables = tableIds
      .map((tableId: string) => tables.find((item) => item.id === tableId))
      .filter(Boolean) as TableItem[];

    const title =
      hoveredCombinationEntry?.group?.name ||
      hoveredTable?.code ||
      hoveredTable?.name ||
      "Table";

    const subtitle =
      hoveredTable?.zone?.name ||
      hoveredTables[0]?.zone?.name ||
      editorLabels.noZone;

    return {
      title,
      subtitle
    };
  }, [tooltip, tables, combinationMap]);

  useEffect(() => {
    if (selectedLabel) {
      setLabelText(selectedLabel.text ?? "");
      setLabelFontSize(String(selectedLabel.fontSize ?? 28));
      setLabelColorName(normalizeColor(selectedLabel.color).name);
      setOpenSection("label-selected");
    }
  }, [selectedLabelId, selectedLabel]);

  useEffect(() => {
    if (selectedZone) {
      setZoneName(selectedZone.name ?? "");
      setZoneCode(selectedZone.code ?? "");
      setZoneType(selectedZone.type ?? "INDOOR");
      setZoneColorName(normalizeColor(selectedZone.color).name);
      setOpenSection("zone-selected");
    }
  }, [selectedZoneId, selectedZone]);

  useEffect(() => {
    if (selectedTable) {
      setName(selectedTable.name ?? "");
      setCode(selectedTable.code ?? "");
      setShape(selectedTable.shape ?? "ROUND");
      setCapacityMin(String(selectedTable.capacityMin ?? 2));
      setCapacityMax(String(selectedTable.capacityMax ?? 4));
      setWidth(String(selectedTable.width ?? 120));
      setHeight(String(selectedTable.height ?? 120));
      setOpenSection("table-selected");
    }
  }, [selectedTableId, selectedTable]);

  const firstFloorPlan = activeFloorPlan || tables[0]?.floorPlan || zones[0] || null;

  const canvasWidth =
    typeof (selectedTable?.floorPlan?.canvasWidth ?? (firstFloorPlan as any)?.canvasWidth) === "number" &&
    Number(selectedTable?.floorPlan?.canvasWidth ?? (firstFloorPlan as any)?.canvasWidth) > 0
      ? Number(selectedTable?.floorPlan?.canvasWidth ?? (firstFloorPlan as any)?.canvasWidth)
      : 1920;

  const canvasHeight =
    typeof (selectedTable?.floorPlan?.canvasHeight ?? (firstFloorPlan as any)?.canvasHeight) === "number" &&
    Number(selectedTable?.floorPlan?.canvasHeight ?? (firstFloorPlan as any)?.canvasHeight) > 0
      ? Number(selectedTable?.floorPlan?.canvasHeight ?? (firstFloorPlan as any)?.canvasHeight)
      : 1080;

  function handleTableHover(
    event: React.MouseEvent<HTMLButtonElement>,
    tableId: string
  ) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    setTooltip({
      visible: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      tableId
    });
  }

  function handleTableLeave() {
    setTooltip((prev) => ({
      ...prev,
      visible: false
    }));
  }

  useEffect(() => {
    function handleWindowPointerMove(event: PointerEvent) {
      const tableDrag = tableDragStateRef.current;
      const labelDrag = labelDragStateRef.current;
      const zoneDrag = zoneDragStateRef.current;
      const zoneResize = zoneResizeStateRef.current;
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      if (!tableDrag && !labelDrag && !zoneDrag && !zoneResize) {
        return;
      }

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;

        if (tableDrag) {
          const element = tableElementsRef.current[tableDrag.id];

          if (!element) {
            return;
          }

          const maxX = Math.max(0, tableDrag.canvasWidth - tableDrag.width);
          const maxY = Math.max(0, tableDrag.canvasHeight - tableDrag.height);

          const nextX = Math.min(
            maxX,
            Math.max(0, Math.round(pointerX - tableDrag.pointerOffsetX))
          );

          const nextY = Math.min(
            maxY,
            Math.max(0, Math.round(pointerY - tableDrag.pointerOffsetY))
          );

          element.style.transform = "translate3d(" + nextX + "px, " + nextY + "px, 0)";
          element.dataset.dragX = String(nextX);
          element.dataset.dragY = String(nextY);
          return;
        }

        if (labelDrag) {
          const element = labelElementsRef.current[labelDrag.id];

          if (!element) {
            return;
          }

          const nextX = Math.min(
            labelDrag.canvasWidth,
            Math.max(0, Math.round(pointerX - labelDrag.pointerOffsetX))
          );

          const nextY = Math.min(
            labelDrag.canvasHeight,
            Math.max(0, Math.round(pointerY - labelDrag.pointerOffsetY))
          );

          element.style.transform = "translate3d(" + nextX + "px, " + nextY + "px, 0)";
          element.dataset.dragX = String(nextX);
          element.dataset.dragY = String(nextY);
          return;
        }

        if (zoneDrag) {
          const element = zoneElementsRef.current[zoneDrag.id];

          if (!element) {
            return;
          }

          const maxX = Math.max(0, zoneDrag.canvasWidth - zoneDrag.width);
          const maxY = Math.max(0, zoneDrag.canvasHeight - zoneDrag.height);

          const nextX = Math.min(
            maxX,
            Math.max(0, Math.round(pointerX - zoneDrag.pointerOffsetX))
          );

          const nextY = Math.min(
            maxY,
            Math.max(0, Math.round(pointerY - zoneDrag.pointerOffsetY))
          );

          element.style.transform = "translate3d(" + nextX + "px, " + nextY + "px, 0)";
          element.dataset.dragX = String(nextX);
          element.dataset.dragY = String(nextY);
          return;
        }

        if (zoneResize) {
          const element = zoneElementsRef.current[zoneResize.id];

          if (!element) {
            return;
          }

          const deltaX = event.clientX - zoneResize.startPointerX;
          const deltaY = event.clientY - zoneResize.startPointerY;

          const nextWidth = Math.max(zoneResize.minWidth, Math.round(zoneResize.startWidth + deltaX));
          const nextHeight = Math.max(zoneResize.minHeight, Math.round(zoneResize.startHeight + deltaY));

          const maxWidth = Math.max(zoneResize.minWidth, zoneResize.canvasWidth - zoneResize.currentX);
          const maxHeight = Math.max(zoneResize.minHeight, zoneResize.canvasHeight - zoneResize.currentY);

          const boundedWidth = Math.min(maxWidth, nextWidth);
          const boundedHeight = Math.min(maxHeight, nextHeight);

          element.style.width = boundedWidth + "px";
          element.style.height = boundedHeight + "px";
          element.dataset.resizeWidth = String(boundedWidth);
          element.dataset.resizeHeight = String(boundedHeight);
        }
      });
    }

    async function handleWindowPointerUp() {
      const tableDrag = tableDragStateRef.current;
      const labelDrag = labelDragStateRef.current;
      const zoneDrag = zoneDragStateRef.current;
      const zoneResize = zoneResizeStateRef.current;

      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      if (tableDrag) {
        tableDragStateRef.current = null;

        const element = tableElementsRef.current[tableDrag.id];
        const nextX = Number(element?.dataset.dragX ?? tableDrag.startX);
        const nextY = Number(element?.dataset.dragY ?? tableDrag.startY);

        if (element) {
          delete element.dataset.dragX;
          delete element.dataset.dragY;
        }

        if (nextX !== tableDrag.startX || nextY !== tableDrag.startY) {
          setTables((prev) =>
            prev.map((table) =>
              table.id === tableDrag.id
                ? {
                    ...table,
                    posX: nextX,
                    posY: nextY
                  }
                : table
            )
          );

          setSaving(true);
          setMessage("");

          try {
            await updateTable(tableDrag.id, {
              posX: nextX,
              posY: nextY
            });

            setMessage("Table position updated.");
          } catch (error: any) {
            setTables((prev) =>
              prev.map((table) =>
                table.id === tableDrag.id
                  ? {
                      ...table,
                      posX: tableDrag.startX,
                      posY: tableDrag.startY
                    }
                  : table
              )
            );

            setMessage(error?.message || "Failed to save dragged position.");
          } finally {
            setSaving(false);
          }
        }
      }

      if (labelDrag) {
        labelDragStateRef.current = null;

        const element = labelElementsRef.current[labelDrag.id];
        const nextX = Number(element?.dataset.dragX ?? labelDrag.startX);
        const nextY = Number(element?.dataset.dragY ?? labelDrag.startY);

        if (element) {
          delete element.dataset.dragX;
          delete element.dataset.dragY;
        }

        if (nextX !== labelDrag.startX || nextY !== labelDrag.startY) {
          setLabels((prev) =>
            prev.map((label) =>
              label.id === labelDrag.id
                ? {
                    ...label,
                    posX: nextX,
                    posY: nextY
                  }
                : label
            )
          );

          setSaving(true);
          setMessage("");

          try {
            await updateLayoutLabel(labelDrag.id, {
              posX: nextX,
              posY: nextY
            });

            setMessage("Label position updated.");
          } catch (error: any) {
            setLabels((prev) =>
              prev.map((label) =>
                label.id === labelDrag.id
                  ? {
                      ...label,
                      posX: labelDrag.startX,
                      posY: labelDrag.startY
                    }
                  : label
              )
            );

            setMessage(error?.message || "Failed to save label position.");
          } finally {
            setSaving(false);
          }
        }
      }

      if (zoneDrag) {
        zoneDragStateRef.current = null;

        const element = zoneElementsRef.current[zoneDrag.id];
        const nextX = Number(element?.dataset.dragX ?? zoneDrag.startX);
        const nextY = Number(element?.dataset.dragY ?? zoneDrag.startY);

        if (element) {
          delete element.dataset.dragX;
          delete element.dataset.dragY;
        }

        if (nextX !== zoneDrag.startX || nextY !== zoneDrag.startY) {
          setZones((prev) =>
            prev.map((zone) =>
              zone.id === zoneDrag.id
                ? {
                    ...zone,
                    posX: nextX,
                    posY: nextY
                  }
                : zone
            )
          );

          setSaving(true);
          setMessage("");

          try {
            await updateZone(zoneDrag.id, {
              posX: nextX,
              posY: nextY
            });

            setMessage("Zone position updated.");
          } catch (error: any) {
            setZones((prev) =>
              prev.map((zone) =>
                zone.id === zoneDrag.id
                  ? {
                      ...zone,
                      posX: zoneDrag.startX,
                      posY: zoneDrag.startY
                    }
                  : zone
              )
            );

            setMessage(error?.message || "Failed to save zone position.");
          } finally {
            setSaving(false);
          }
        }
      }

      if (zoneResize) {
        zoneResizeStateRef.current = null;

        const element = zoneElementsRef.current[zoneResize.id];
        const nextWidth = Number(element?.dataset.resizeWidth ?? zoneResize.startWidth);
        const nextHeight = Number(element?.dataset.resizeHeight ?? zoneResize.startHeight);

        if (element) {
          delete element.dataset.resizeWidth;
          delete element.dataset.resizeHeight;
        }

        if (nextWidth !== zoneResize.startWidth || nextHeight !== zoneResize.startHeight) {
          setZones((prev) =>
            prev.map((zone) =>
              zone.id === zoneResize.id
                ? {
                    ...zone,
                    width: nextWidth,
                    height: nextHeight
                  }
                : zone
            )
          );

          setSaving(true);
          setMessage("");

          try {
            await updateZone(zoneResize.id, {
              width: nextWidth,
              height: nextHeight
            });

            setMessage("Zone size updated.");
          } catch (error: any) {
            setZones((prev) =>
              prev.map((zone) =>
                zone.id === zoneResize.id
                  ? {
                      ...zone,
                      width: zoneResize.startWidth,
                      height: zoneResize.startHeight
                    }
                  : zone
              )
            );

            setMessage(error?.message || "Failed to save zone size.");
          } finally {
            setSaving(false);
          }
        }
      }
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [canvasHeight, canvasWidth]);

  async function handleCreateZone() {
    const tenantId = currentContext.tenantId;
    const branchId = currentContext.branchId;
    const floorPlanId = activeFloorPlan?.id || "";

    if (!tenantId || !branchId || !floorPlanId) {
      setMessage("Tenant, branch, or floor plan context missing.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const existingCodes = zones
        .filter((zone) => zone.branchId === branchId && zone.floorPlanId === floorPlanId)
        .map((zone) => (zone.code || "").toUpperCase());

      let nextCode = zoneCode.trim().toUpperCase();

      if (!nextCode) {
        nextCode = "ZONE_" + String(zones.length + 1);
      }

      if (existingCodes.includes(nextCode)) {
        let counter = zones.length + 1;
        while (existingCodes.includes(("ZONE_" + String(counter)).toUpperCase())) {
          counter += 1;
        }
        nextCode = "ZONE_" + String(counter);
      }

      const zoneColorValue =
        COLOR_OPTIONS.find((option) => option.name === zoneColorName)?.value ||
        COLOR_OPTIONS[1].value;

      const created = await createZone({
        tenantId,
        branchId,
        floorPlanId,
        name: zoneName.trim() || "New Zone",
        code: nextCode,
        type: zoneType,
        color: zoneColorValue,
        posX: 40 + zones.length * 30,
        posY: 40 + zones.length * 30,
        width: 600,
        height: 400,
        sortOrder: zones.length + 1,
        isActive: true
      });

      setZones((prev) => [...prev, created]);
      setSelectedZoneId(created.id);
      setZoneCode(nextCode + "_2");
      setZoneName("New Zone");
      setOpenSection("zone-selected");
      setMessage("Zone created.");
    } catch (error: any) {
      setMessage(error?.message || "Failed to create zone.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSelectedZone() {
    if (!selectedZone) {
      setMessage("Select a zone first.");
      return;
    }

    const nextName = zoneName.trim() || "Zone";
    const nextCode = zoneCode.trim().toUpperCase() || selectedZone.code;
    const nextType = zoneType;
    const nextColor =
      COLOR_OPTIONS.find((option) => option.name === zoneColorName)?.value ||
      COLOR_OPTIONS[0].value;

    const previous = { ...selectedZone };

    setZones((prev) =>
      prev.map((zone) =>
        zone.id === selectedZone.id
          ? {
              ...zone,
              name: nextName,
              code: nextCode,
              type: nextType,
              color: nextColor
            }
          : zone
      )
    );

    setSaving(true);
    setMessage("");

    try {
      await updateZone(selectedZone.id, {
        name: nextName,
        code: nextCode,
        type: nextType,
        color: nextColor
      });

      setMessage("Zone updated.");
    } catch (error: any) {
      setZones((prev) =>
        prev.map((zone) =>
          zone.id === selectedZone.id ? previous : zone
        )
      );

      setMessage(error?.message || "Failed to update zone.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSelectedZone() {
    if (!selectedZone) {
      setMessage("Select a zone first.");
      return;
    }

    const confirmed = window.confirm(
      "Delete zone " + (selectedZone.name || "ZONE") + "?"
    );

    if (!confirmed) {
      return;
    }

    const removed = selectedZone;

    setZones((prev) => prev.filter((zone) => zone.id !== removed.id));
    setSelectedZoneId("");

    setSaving(true);
    setMessage("");

    try {
      await deleteZone(removed.id);
      setMessage("Zone deleted.");
    } catch (error: any) {
      setZones((prev) => [...prev, removed]);
      setMessage(error?.message || "Zone cannot be deleted while it still has tables.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateLabel() {
    const baseZone = zones[0];

    if (!baseZone) {
      setMessage("Create zone first.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const labelColorValue =
        COLOR_OPTIONS.find((option) => option.name === labelColorName)?.value ||
        COLOR_OPTIONS[0].value;

      const created = await createLayoutLabel({
        tenantId: baseZone.tenantId,
        branchId: baseZone.branchId,
        floorPlanId: baseZone.floorPlanId,
        text: labelText.trim() || "LABEL",
        posX: 300,
        posY: 120,
        width: 220,
        height: 60,
        color: labelColorValue,
        fontSize: Number(labelFontSize) || 28
      });

      setLabels((prev) => [...prev, created]);
      setSelectedLabelId(created.id);
      setOpenSection("label-selected");
      setMessage("Label created.");
    } catch (error: any) {
      setMessage(error?.message || "Failed to create label.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSelectedLabel() {
    if (!selectedLabel) {
      setMessage("Select a label first.");
      return;
    }

    const nextText = labelText.trim() || "LABEL";
    const nextFontSize = Number(labelFontSize) || 28;
    const nextColor =
      COLOR_OPTIONS.find((option) => option.name === labelColorName)?.value ||
      COLOR_OPTIONS[0].value;

    const previous = { ...selectedLabel };

    setLabels((prev) =>
      prev.map((label) =>
        label.id === selectedLabel.id
          ? {
              ...label,
              text: nextText,
              color: nextColor,
              fontSize: nextFontSize
            }
          : label
      )
    );

    setSaving(true);
    setMessage("");

    try {
      await updateLayoutLabel(selectedLabel.id, {
        text: nextText,
        color: nextColor,
        fontSize: nextFontSize
      });

      setMessage("Label updated.");
    } catch (error: any) {
      setLabels((prev) =>
        prev.map((label) =>
          label.id === selectedLabel.id ? previous : label
        )
      );

      setMessage(error?.message || "Failed to update label.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSelectedLabel() {
    if (!selectedLabel) {
      setMessage("Select a label first.");
      return;
    }

    const confirmed = window.confirm(
      "Delete label " + (selectedLabel.text || "LABEL") + "?"
    );

    if (!confirmed) {
      return;
    }

    const removed = selectedLabel;

    setLabels((prev) => prev.filter((label) => label.id !== removed.id));
    setSelectedLabelId("");

    setSaving(true);
    setMessage("");

    try {
      await deleteLayoutLabel(removed.id);
      setMessage("Label deleted.");
    } catch (error: any) {
      setLabels((prev) => [...prev, removed]);
      setMessage(error?.message || "Failed to delete label.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTable() {
    if (!activeZone) {
      setMessage("Create or load a zone first.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const existingCodes = tables
        .filter((table) => table.branchId === activeZone.branchId)
        .map((table) => (table.code || "").toUpperCase());

      let nextCode = code.trim();
      let nextName = name.trim();

      if (!nextCode) {
        nextCode = "T" + String(tables.length + 1);
      }

      if (existingCodes.includes(nextCode.toUpperCase())) {
        let counter = tables.length + 1;

        while (existingCodes.includes(("T" + String(counter)).toUpperCase())) {
          counter += 1;
        }

        nextCode = "T" + String(counter);
        nextName = "Table " + String(counter);
      }

      const created = await createTable({
        tenantId: activeZone.tenantId,
        branchId: activeZone.branchId,
        zoneId: activeZone.id,
        floorPlanId: activeZone.floorPlanId,
        name: nextName,
        code: nextCode,
        capacityMin: Number(capacityMin),
        capacityMax: Number(capacityMax),
        shape,
        posX: 120,
        posY: 120,
        width: Number(width),
        height: Number(height),
        rotation: 0,
        isActive: true
      });

      setTables((prev) => [...prev, created]);
      setSelectedTableId(created.id);
      setOpenSection("table-selected");

      const match = nextCode.match(/\d+$/);
      const nextNumber = match ? Number(match[0]) + 1 : tables.length + 2;

      setCode("T" + String(nextNumber));
      setName("Table " + String(nextNumber));
      setMessage("Table created.");
    } catch (error: any) {
      setMessage(error?.message || "Failed to create table.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSelectedTableDetails() {
    if (!selectedTable) {
      setMessage("Select a table first.");
      return;
    }

    const nextName = name.trim() || selectedTable.name || "Table";
    const nextCode = code.trim() || selectedTable.code || "T";
    const nextShape = shape;
    const nextCapacityMin = Math.max(1, Number(capacityMin) || 1);
    const nextCapacityMax = Math.max(nextCapacityMin, Number(capacityMax) || nextCapacityMin);
    const nextWidth = Math.max(60, Number(width) || 60);
    const nextHeight = Math.max(60, Number(height) || 60);

    const previous = { ...selectedTable };

    setTables((prev) =>
      prev.map((table) =>
        table.id === selectedTable.id
          ? {
              ...table,
              name: nextName,
              code: nextCode,
              shape: nextShape,
              capacityMin: nextCapacityMin,
              capacityMax: nextCapacityMax,
              width: nextWidth,
              height: nextHeight
            }
          : table
      )
    );

    setSaving(true);
    setMessage("");

    try {
      await updateTable(selectedTable.id, {
        name: nextName,
        code: nextCode,
        shape: nextShape,
        capacityMin: nextCapacityMin,
        capacityMax: nextCapacityMax,
        width: nextWidth,
        height: nextHeight
      });

      setMessage("Table updated.");
    } catch (error: any) {
      setTables((prev) =>
        prev.map((table) =>
          table.id === selectedTable.id ? previous : table
        )
      );

      setMessage(error?.message || "Failed to update table.");
    } finally {
      setSaving(false);
    }
  }

  async function nudgeSelectedTable(dx: number, dy: number) {
    if (!selectedTable) {
      setMessage("Select a table first.");
      return;
    }

    const nextX = selectedTable.posX + dx;
    const nextY = selectedTable.posY + dy;
    const previousX = selectedTable.posX;
    const previousY = selectedTable.posY;

    setTables((prev) =>
      prev.map((table) =>
        table.id === selectedTable.id
          ? {
              ...table,
              posX: nextX,
              posY: nextY
            }
          : table
      )
    );

    setSaving(true);
    setMessage("");

    try {
      await updateTable(selectedTable.id, {
        posX: nextX,
        posY: nextY
      });

      setMessage("Table position updated.");
    } catch (error: any) {
      setTables((prev) =>
        prev.map((table) =>
          table.id === selectedTable.id
            ? {
                ...table,
                posX: previousX,
                posY: previousY
              }
            : table
        )
      );

      setMessage(error?.message || "Failed to move table.");
    } finally {
      setSaving(false);
    }
  }

  async function resizeSelectedTable(delta: number) {
    if (!selectedTable) {
      setMessage("Select a table first.");
      return;
    }

    const previousWidth = selectedTable.width;
    const previousHeight = selectedTable.height;
    const newWidth = Math.max(60, previousWidth + delta);
    const newHeight = Math.max(60, previousHeight + delta);

    setTables((prev) =>
      prev.map((table) =>
        table.id === selectedTable.id
          ? {
              ...table,
              width: newWidth,
              height: newHeight
            }
          : table
      )
    );

    setWidth(String(newWidth));
    setHeight(String(newHeight));

    setSaving(true);
    setMessage("");

    try {
      await updateTable(selectedTable.id, {
        width: newWidth,
        height: newHeight
      });

      setMessage("Table size updated.");
    } catch (error: any) {
      setTables((prev) =>
        prev.map((table) =>
          table.id === selectedTable.id
            ? {
                ...table,
                width: previousWidth,
                height: previousHeight
              }
            : table
        )
      );

      setWidth(String(previousWidth));
      setHeight(String(previousHeight));
      setMessage(error?.message || "Failed to resize table.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSelected() {
    if (!selectedTable) {
      setMessage("Select a table first.");
      return;
    }

    const confirmed = window.confirm(
      "Delete table " + (selectedTable.code || selectedTable.name) + "?"
    );

    if (!confirmed) {
      return;
    }

    const removed = selectedTable;

    setTables((prev) => prev.filter((table) => table.id !== removed.id));
    setSelectedTableId("");

    setSaving(true);
    setMessage("");

    try {
      await deleteTable(removed.id);
      setMessage("Table deleted.");
    } catch (error: any) {
      setTables((prev) => [...prev, removed]);
      setMessage(error?.message || "Failed to delete table.");
    } finally {
      setSaving(false);
    }
  }

  function handleTablePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    table: TableItem
  ) {
    if (saving || loading) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    setSelectedTableId(table.id);

    tableDragStateRef.current = {
      kind: "table",
      id: table.id,
      startX: table.posX,
      startY: table.posY,
      pointerOffsetX: pointerX - table.posX,
      pointerOffsetY: pointerY - table.posY,
      width: table.width,
      height: table.height,
      canvasWidth,
      canvasHeight
    };

    labelDragStateRef.current = null;
    zoneDragStateRef.current = null;
    zoneResizeStateRef.current = null;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  }

  function handleLabelPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    label: LayoutLabelItem
  ) {
    if (saving || loading) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    setSelectedLabelId(label.id);

    labelDragStateRef.current = {
      kind: "label",
      id: label.id,
      startX: label.posX,
      startY: label.posY,
      pointerOffsetX: pointerX - label.posX,
      pointerOffsetY: pointerY - label.posY,
      canvasWidth,
      canvasHeight
    };

    tableDragStateRef.current = null;
    zoneDragStateRef.current = null;
    zoneResizeStateRef.current = null;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  }

  function handleZonePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    zone: ZoneItem
  ) {
    if (saving || loading) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.dataset.resizeHandle === "true" || target.dataset.deleteHandle === "true") {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;

    const zoneX = Number(zone.posX ?? 0);
    const zoneY = Number(zone.posY ?? 0);
    const zoneWidth = Number(zone.width ?? 600);
    const zoneHeight = Number(zone.height ?? 400);

    setSelectedZoneId(zone.id);

    zoneDragStateRef.current = {
      kind: "zone",
      id: zone.id,
      startX: zoneX,
      startY: zoneY,
      pointerOffsetX: pointerX - zoneX,
      pointerOffsetY: pointerY - zoneY,
      width: zoneWidth,
      height: zoneHeight,
      canvasWidth,
      canvasHeight
    };

    tableDragStateRef.current = null;
    labelDragStateRef.current = null;
    zoneResizeStateRef.current = null;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  }

  function handleZoneResizePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    zone: ZoneItem
  ) {
    if (saving || loading) {
      return;
    }

    event.stopPropagation();

    const zoneX = Number(zone.posX ?? 0);
    const zoneY = Number(zone.posY ?? 0);

    setSelectedZoneId(zone.id);

    zoneResizeStateRef.current = {
      kind: "zone_resize",
      id: zone.id,
      startWidth: Number(zone.width ?? 600),
      startHeight: Number(zone.height ?? 400),
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      minWidth: 180,
      minHeight: 120,
      canvasWidth,
      canvasHeight,
      currentX: zoneX,
      currentY: zoneY
    };

    tableDragStateRef.current = null;
    labelDragStateRef.current = null;
    zoneDragStateRef.current = null;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "nwse-resize";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020817",
        color: "#ffffff",
        padding: "24px",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: "1500px",
          margin: "0 auto",
          display: "grid",
          gap: "20px"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap"
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                fontSize: "12px",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "14px"
              }}
            >
              {chromeLabels.badge}
            </div>

            <h1 style={{ margin: 0, fontSize: "34px", lineHeight: 1.1 }}>
              {chromeLabels.title}
            </h1>

            <p
              style={{
                marginTop: "12px",
                marginBottom: 0,
                color: "rgba(255,255,255,0.68)",
                fontSize: "15px",
                lineHeight: 1.7
              }}
            >
              {editorLabels.description}
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = "/de";
            }}
            style={{
              minHeight: "44px",
              padding: "0 16px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.08)",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            {chromeLabels.backToDashboard}
          </button>
        </div>

        {message ? (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.06)",
              color: "#ffffff"
            }}
          >
            {message}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: "360px minmax(0,1fr)"
          }}
        >
          <aside
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "24px",
              padding: "18px",
              boxShadow: "0 14px 45px rgba(0,0,0,0.26)",
              alignSelf: "start",
              maxHeight: "calc(100vh - 48px)",
              overflowY: "auto"
            }}
          >
            <FloorPlanEditorSection openSection={openSection} setOpenSection={setOpenSection} id="zone" title={editorLabels.addZone}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label style={{ display: "grid", gap: "6px" }}>
                  <span>{editorLabels.zoneName}</span>
                  <input
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    style={fieldStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>{editorLabels.zoneCode}</span>
                  <input
                    value={zoneCode}
                    onChange={(e) => setZoneCode(e.target.value)}
                    style={fieldStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>{editorLabels.zoneType}</span>
                  <select
                    value={zoneType}
                    onChange={(e) => setZoneType(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="INDOOR" style={optionStyle}>{editorLabels.indoor}</option>
                    <option value="TERRACE" style={optionStyle}>{editorLabels.terrace}</option>
                    <option value="VIP" style={optionStyle}>VIP</option>
                    <option value="BAR" style={optionStyle}>Bar</option>
                    <option value="PRIVATE_ROOM" style={optionStyle}>{editorLabels.privateRoom}</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>{editorLabels.color}</span>
                  <select
                    value={zoneColorName}
                    onChange={(e) => setZoneColorName(e.target.value)}
                    style={selectStyle}
                  >
                    {COLOR_OPTIONS.map((option) => (
                      <option key={option.name} value={option.name} style={optionStyle}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  onClick={handleCreateZone}
                  disabled={saving || loading}
                  style={primaryButtonStyle}
                >
                  {saving ? editorLabels.saving : editorLabels.createZone}
                </button>
              </div>
            </FloorPlanEditorSection>

            <FloorPlanEditorSection openSection={openSection} setOpenSection={setOpenSection} id="zone-selected" title={editorLabels.selectedZone}>
              {selectedZone ? (
                <div style={{ display: "grid", gap: "12px" }}>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.name}</span>
                    <input
                      value={zoneName}
                      onChange={(e) => setZoneName(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.code}</span>
                    <input
                      value={zoneCode}
                      onChange={(e) => setZoneCode(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.type}</span>
                    <select
                      value={zoneType}
                      onChange={(e) => setZoneType(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="INDOOR" style={optionStyle}>{editorLabels.indoor}</option>
                      <option value="TERRACE" style={optionStyle}>{editorLabels.terrace}</option>
                      <option value="VIP" style={optionStyle}>VIP</option>
                      <option value="BAR" style={optionStyle}>Bar</option>
                      <option value="PRIVATE_ROOM" style={optionStyle}>{editorLabels.privateRoom}</option>
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.color}</span>
                    <select
                      value={zoneColorName}
                      onChange={(e) => setZoneColorName(e.target.value)}
                      style={selectStyle}
                    >
                      {COLOR_OPTIONS.map((option) => (
                        <option key={option.name} value={option.name} style={optionStyle}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={infoCardStyle}>
                    <div><strong>{selectedZone.name}</strong></div>
                    <div>X: {selectedZone.posX ?? 0} | Y: {selectedZone.posY ?? 0}</div>
                    <div>W: {selectedZone.width ?? 600} | H: {selectedZone.height ?? 400}</div>
                    <div>Tables: {tables.filter((t) => t.zoneId === selectedZone.id).length}</div>
                  </div>

                  <button
                    onClick={handleUpdateSelectedZone}
                    disabled={saving}
                    style={primaryButtonStyle}
                  >
                    {saving ? editorLabels.saving : editorLabels.updateZone}
                  </button>

                  <button
                    onClick={handleDeleteSelectedZone}
                    disabled={saving}
                    style={dangerButtonStyle}
                  >
                    {editorLabels.deleteZone}
                  </button>
                </div>
              ) : (
                <div style={infoCardStyle}>
                  Select a zone from the canvas.
                </div>
              )}
            </FloorPlanEditorSection>

            <FloorPlanEditorSection openSection={openSection} setOpenSection={setOpenSection} id="label" title={editorLabels.addLabel}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label style={{ display: "grid", gap: "6px" }}>
                  <span>{editorLabels.text}</span>
                  <input
                    value={labelText}
                    onChange={(e) => setLabelText(e.target.value)}
                    style={fieldStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>{editorLabels.textColor}</span>
                  <select
                    value={labelColorName}
                    onChange={(e) => setLabelColorName(e.target.value)}
                    style={selectStyle}
                  >
                    {COLOR_OPTIONS.map((option) => (
                      <option key={option.name} value={option.name} style={optionStyle}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>{editorLabels.fontSize}</span>
                  <input
                    value={labelFontSize}
                    onChange={(e) => setLabelFontSize(e.target.value)}
                    style={fieldStyle}
                  />
                </label>

                <button
                  onClick={handleCreateLabel}
                  disabled={saving || loading}
                  style={primaryButtonStyle}
                >
                  {saving ? editorLabels.saving : editorLabels.createLabel}
                </button>
              </div>
            </FloorPlanEditorSection>

            <FloorPlanEditorSection openSection={openSection} setOpenSection={setOpenSection} id="label-selected" title={editorLabels.selectedLabel}>
              {selectedLabel ? (
                <div style={{ display: "grid", gap: "12px" }}>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.text}</span>
                    <input
                      value={labelText}
                      onChange={(e) => setLabelText(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.textColor}</span>
                    <select
                      value={labelColorName}
                      onChange={(e) => setLabelColorName(e.target.value)}
                      style={selectStyle}
                    >
                      {COLOR_OPTIONS.map((option) => (
                        <option key={option.name} value={option.name} style={optionStyle}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.fontSize}</span>
                    <input
                      value={labelFontSize}
                      onChange={(e) => setLabelFontSize(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <div style={infoCardStyle}>
                    <div><strong>{selectedLabel.text}</strong></div>
                    <div>X: {selectedLabel.posX} | Y: {selectedLabel.posY}</div>
                  </div>

                  <button
                    onClick={handleUpdateSelectedLabel}
                    disabled={saving}
                    style={primaryButtonStyle}
                  >
                    {saving ? editorLabels.saving : editorLabels.updateLabel}
                  </button>

                  <button
                    onClick={handleDeleteSelectedLabel}
                    disabled={saving}
                    style={dangerButtonStyle}
                  >
                    {editorLabels.deleteLabel}
                  </button>
                </div>
              ) : (
                <div style={infoCardStyle}>
                  Select a label from the canvas.
                </div>
              )}
            </FloorPlanEditorSection>

            <FloorPlanEditorSection openSection={openSection} setOpenSection={setOpenSection} id="table" title={editorLabels.addTable}>
              <div style={{ display: "grid", gap: "12px" }}>
                <label style={{ display: "grid", gap: "6px" }}>
                  <span>{editorLabels.zone}</span>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    style={selectStyle}
                  >
                    {zones.map((zone) => (
                      <option
                        key={zone.id}
                        value={zone.id}
                        style={optionStyle}
                      >
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>{editorLabels.tableName}</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={fieldStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>{editorLabels.tableCode}</span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={fieldStyle}
                  />
                </label>

                <label style={{ display: "grid", gap: "6px" }}>
                  <span>{editorLabels.shape}</span>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="ROUND" style={optionStyle}>{editorLabels.round}</option>
                    <option value="SQUARE" style={optionStyle}>{editorLabels.square}</option>
                    <option value="RECTANGLE" style={optionStyle}>{editorLabels.rectangle}</option>
                  </select>
                </label>

                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                    gridTemplateColumns: "1fr 1fr"
                  }}
                >
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.min}</span>
                    <input
                      value={capacityMin}
                      onChange={(e) => setCapacityMin(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.max}</span>
                    <input
                      value={capacityMax}
                      onChange={(e) => setCapacityMax(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                    gridTemplateColumns: "1fr 1fr"
                  }}
                >
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.width}</span>
                    <input
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.height}</span>
                    <input
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>
                </div>

                <button
                  onClick={handleAddTable}
                  disabled={saving || loading}
                  style={primaryButtonStyle}
                >
                  {saving ? editorLabels.saving : editorLabels.createTable}
                </button>
              </div>
            </FloorPlanEditorSection>

            <FloorPlanEditorSection openSection={openSection} setOpenSection={setOpenSection} id="table-selected" title={editorLabels.selectedTable}>
              {selectedTable ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.tableName}</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.tableCode}</span>
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      style={fieldStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "6px" }}>
                    <span>{editorLabels.shape}</span>
                    <select
                      value={shape}
                      onChange={(e) => setShape(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="ROUND" style={optionStyle}>{editorLabels.round}</option>
                      <option value="SQUARE" style={optionStyle}>{editorLabels.square}</option>
                      <option value="RECTANGLE" style={optionStyle}>{editorLabels.rectangle}</option>
                    </select>
                  </label>

                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      gridTemplateColumns: "1fr 1fr"
                    }}
                  >
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span>{editorLabels.minCapacity}</span>
                      <input
                        value={capacityMin}
                        onChange={(e) => setCapacityMin(e.target.value)}
                        style={fieldStyle}
                      />
                    </label>

                    <label style={{ display: "grid", gap: "6px" }}>
                      <span>{editorLabels.maxCapacity}</span>
                      <input
                        value={capacityMax}
                        onChange={(e) => setCapacityMax(e.target.value)}
                        style={fieldStyle}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      gridTemplateColumns: "1fr 1fr"
                    }}
                  >
                    <label style={{ display: "grid", gap: "6px" }}>
                      <span>{editorLabels.width}</span>
                      <input
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        style={fieldStyle}
                      />
                    </label>

                    <label style={{ display: "grid", gap: "6px" }}>
                      <span>{editorLabels.height}</span>
                      <input
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        style={fieldStyle}
                      />
                    </label>
                  </div>

                  <div style={infoCardStyle}>
                    <div>
                      <strong>{selectedTable.code || selectedTable.name}</strong>
                    </div>
                    <div>{selectedTable.zone?.name || editorLabels.noZone}</div>
                    <div>
                      {selectedTable.capacityMin}-{selectedTable.capacityMax} {chromeLabels.guestLabel}
                    </div>
                    <div>
                      X: {selectedTable.posX} | Y: {selectedTable.posY}
                    </div>
                    <div>
                      {selectedTable.width} x {selectedTable.height}
                    </div>
                  </div>

                  <button
                    onClick={handleUpdateSelectedTableDetails}
                    disabled={saving}
                    style={primaryButtonStyle}
                  >
                    {saving ? editorLabels.saving : editorLabels.updateTable}
                  </button>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.65)"
                    }}
                  >
                    Tip: drag the table directly on the canvas. Labels and zones can also be dragged.
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                      gridTemplateColumns: "1fr 1fr 1fr"
                    }}
                  >
                    <button
                      onClick={() => nudgeSelectedTable(0, -20)}
                      disabled={saving}
                      style={secondaryButtonStyle}
                    >
                      Up
                    </button>
                    <button
                      onClick={() => resizeSelectedTable(20)}
                      disabled={saving}
                      style={secondaryButtonStyle}
                    >
                      Bigger
                    </button>
                    <button
                      onClick={() => nudgeSelectedTable(0, 20)}
                      disabled={saving}
                      style={secondaryButtonStyle}
                    >
                      Down
                    </button>
                    <button
                      onClick={() => nudgeSelectedTable(-20, 0)}
                      disabled={saving}
                      style={secondaryButtonStyle}
                    >
                      Left
                    </button>
                    <button
                      onClick={() => resizeSelectedTable(-20)}
                      disabled={saving}
                      style={secondaryButtonStyle}
                    >
                      Smaller
                    </button>
                    <button
                      onClick={() => nudgeSelectedTable(20, 0)}
                      disabled={saving}
                      style={secondaryButtonStyle}
                    >
                      Right
                    </button>
                  </div>

                  <button
                    onClick={handleDeleteSelected}
                    disabled={saving}
                    style={dangerButtonStyle}
                  >
                    {editorLabels.deleteTable}
                  </button>
                </div>
              ) : (
                <div style={infoCardStyle}>
                  Select a table from the canvas.
                </div>
              )}
            </FloorPlanEditorSection>
          </aside>

          <section
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "24px",
              padding: "18px",
              boxShadow: "0 14px 45px rgba(0,0,0,0.26)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "14px"
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "18px" }}>
                {chromeLabels.canvasTitle}
              </div>

              <div
                style={{
                  color: "rgba(255,255,255,0.68)",
                  fontSize: "13px"
                }}
              >
                {tables.length} {chromeLabels.tablesLoaded}
              </div>
            </div>

            <div
              style={{
                overflow: "auto",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "12px",
                background: "rgba(255,255,255,0.03)"
              }}
            >
              <div
                ref={canvasRef}
                style={{
                  position: "relative",
                  width: canvasWidth,
                  height: canvasHeight,
                  borderRadius: "20px",
                  backgroundColor: "#eef2f7",
                  backgroundImage:
                    "linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                  overflow: "hidden",
                  boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)"
                }}
              >
                {zones.map((zone) => {
                  const palette = normalizeColor(zone.color);
                  const isActiveZone = zone.id === selectedZoneId;
                  const zoneX = Number(zone.posX ?? 0);
                  const zoneY = Number(zone.posY ?? 0);
                  const zoneWidth = Number(zone.width ?? 600);
                  const zoneHeight = Number(zone.height ?? 400);

                  return (
                    <div
                      key={zone.id}
                      ref={(element) => {
                        zoneElementsRef.current[zone.id] = element;
                      }}
                      onClick={() => setSelectedZoneId(zone.id)}
                      onPointerDown={(event) => handleZonePointerDown(event, zone)}
                      style={{
                        position: "absolute",
                        transform:
                          "translate3d(" +
                          zoneX +
                          "px, " +
                          zoneY +
                          "px, 0)",
                        width: zoneWidth,
                        height: zoneHeight,
                        borderRadius: "24px",
                        border: isActiveZone
                          ? "2px solid " + palette.value
                          : "1px dashed rgba(15,23,42,0.18)",
                        background: palette.soft,
                        boxShadow: isActiveZone
                          ? "inset 0 0 0 1px rgba(255,255,255,0.45)"
                          : "none",
                        left: 0,
                        top: 0,
                        userSelect: "none",
                        touchAction: "none",
                        cursor: "move",
                        zIndex: 1
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: "16px",
                          top: "12px",
                          fontSize: "12px",
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          color: palette.value,
                          textTransform: "uppercase"
                        }}
                      >
                        {zone.name}
                      </div>

                      <button
                        type="button"
                        data-delete-handle="true"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedZoneId(zone.id);
                          handleDeleteSelectedZone();
                        }}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "10px",
                          width: "28px",
                          height: "28px",
                          borderRadius: "999px",
                          border: "1px solid rgba(255,255,255,0.35)",
                          background: "rgba(255,255,255,0.92)",
                          color: "#111111",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#111111"
                          strokeWidth="3"
                          strokeLinecap="round"
                        >
                          <line x1="6" y1="6" x2="18" y2="18" />
                          <line x1="18" y1="6" x2="6" y2="18" />
                        </svg>
                      </button>

                      <div
                        data-resize-handle="true"
                        onPointerDown={(event) => handleZoneResizePointerDown(event, zone)}
                        style={{
                          position: "absolute",
                          right: "8px",
                          bottom: "8px",
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          background: palette.value,
                          border: "2px solid rgba(255,255,255,0.9)",
                          cursor: "nwse-resize"
                        }}
                      />
                    </div>
                  );
                })}

                {labels.map((label) => (
                  <div
                    key={label.id}
                    ref={(element) => {
                      labelElementsRef.current[label.id] = element;
                    }}
                    onClick={() => setSelectedLabelId(label.id)}
                    onPointerDown={(event) => handleLabelPointerDown(event, label)}
                    style={{
                      position: "absolute",
                      transform:
                        "translate3d(" +
                        label.posX +
                        "px, " +
                        label.posY +
                        "px, 0)",
                      color: label.color || "#111111",
                      fontSize: label.fontSize || 28,
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      cursor: "grab",
                      userSelect: "none",
                      touchAction: "none",
                      willChange: "transform",
                      left: 0,
                      top: 0,
                      zIndex: 3,
                      outline:
                        selectedLabelId === label.id
                          ? "2px dashed rgba(17,17,17,0.35)"
                          : "none",
                      outlineOffset: "6px"
                    }}
                  >
                    {label.text}
                  </div>
                ))}

                {tables.map((table) => {
                  const combinationEntry = combinationMap.get(table.id);

                  const isActiveCombination =
                    combinationEntry &&
                    combinationEntry.group &&
                    combinationEntry.group.isActive === true;

                  if (isActiveCombination && !combinationEntry.isLeader) {
                    return null;
                  }

                  const groupedTables = (isActiveCombination ? combinationEntry?.tableIds : [table.id])
                    .map((tableId: string) => tables.find((item) => item.id === tableId))
                    .filter(Boolean) as TableItem[];

                  const renderTables = groupedTables.length > 0 ? groupedTables : [table];
                  const isCombination = renderTables.length > 1;

                  const renderX = isCombination
                    ? renderTables.reduce((sum, t) => sum + t.posX, 0) / renderTables.length
                    : table.posX;

                  const renderY = isCombination
                    ? renderTables.reduce((sum, t) => sum + t.posY, 0) / renderTables.length
                    : table.posY;

                  const renderWidth = isCombination ? 120 : table.width;
                  const renderHeight = isCombination ? 120 : table.height;

                  const totalCapacityMin = renderTables.reduce(
                    (sum, item) => sum + Number(item.capacityMin || 0),
                    0
                  );

                  const totalCapacityMax = renderTables.reduce(
                    (sum, item) => sum + Number(item.capacityMax || 0),
                    0
                  );

                  const isSelected = isCombination
                    ? renderTables.some((item) => item.id === selectedTableId)
                    : table.id === selectedTableId;

                  const background = isCombination
                    ? "rgba(37,99,235,0.88)"
                    : table.zone?.color || "#2563EB";

                  const isRound = !isCombination && table.shape === "ROUND";

                  const titleText = isCombination
                    ? (combinationEntry?.group?.name ||
                        renderTables.map((item) => item.code || item.name).join(" + "))
                    : (table.code || table.name);

                  const zoneText = table.zone?.name || editorLabels.noZone;

                  return (
                    <button
                      key={isCombination ? "cmb-" + table.id : table.id}
                      ref={(element) => {
                        tableElementsRef.current[table.id] = element;
                      }}
                      type="button"
                      onClick={() => setSelectedTableId(table.id)}
                      onMouseEnter={(event) => handleTableHover(event, table.id)}
                      onMouseLeave={handleTableLeave}
                      onPointerDown={(event) => {
                        if (!isCombination) {
                          handleTablePointerDown(event, table);
                        }
                      }}
                      title={titleText}
                      style={{
                        position: "absolute",
                        transform:
                          "translate3d(" +
                          renderX +
                          "px, " +
                          renderY +
                          "px, 0)",
                        width: renderWidth,
                        height: renderHeight,
                        background,
                        color: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: 700,
                        borderRadius: isCombination ? "18px" : isRound ? "999px" : "14px",
                        cursor: isCombination
                          ? "pointer"
                          : tableDragStateRef.current?.id === table.id
                            ? "grabbing"
                            : "grab",
                        boxShadow: isSelected
                          ? "0 0 0 4px rgba(255,255,255,0.65), 0 8px 18px rgba(0,0,0,0.18)"
                          : "0 8px 18px rgba(0,0,0,0.18)",
                        border: isCombination
                          ? "2px dashed rgba(255,255,255,0.78)"
                          : "2px solid rgba(255,255,255,0.35)",
                        userSelect: "none",
                        touchAction: "none",
                        willChange: "transform",
                        left: 0,
                        top: 0,
                        zIndex: 4
                      }}
                    >
                      <div style={{
                        maxWidth: "100%",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: "12px",
                        fontWeight: 700
                      }}>
                        {titleText}
                      </div>
                      <div style={{ fontSize: "10px", opacity: 0.9, marginTop: "4px" }}>
                        {zoneText}
                      </div>
                      {isCombination ? (
                        <div style={{ fontSize: "10px", marginTop: "4px" }}>
                          {renderTables.length} tables | {totalCapacityMin}-{totalCapacityMax}
                        </div>
                      ) : null}
                    </button>
                  );
                })}

                {tooltip.visible && tooltipData ? (
                  <div
                    style={{
                      position: "absolute",
                      left: tooltip.x + 12,
                      top: tooltip.y + 12,
                      background: "rgba(15,23,42,0.92)",
                      color: "#ffffff",
                      borderRadius: "14px",
                      border: "1px solid rgba(255,255,255,0.10)",
                      padding: "10px 12px",
                      pointerEvents: "none",
                      zIndex: 20,
                      minWidth: "160px",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.22)"
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>{tooltipData.title}</div>
                    <div style={{ fontSize: "11px", opacity: 0.75, marginTop: "4px" }}>
                      {tooltipData.subtitle}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    
      <div
        data-editor-language-switcher="true"
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(2,6,23,0.82)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)"
        }}
      >
        <a
          href={"/" + initialLocale + "/dashboard"}
          style={{
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.92)",
            fontSize: "12px",
            fontWeight: 800,
            padding: "0 12px",
            textDecoration: "none"
          }}
        >
          {chromeLabels.backToDashboard}
        </a>

        {(["de", "en", "it", "sq"] as EditorLocale[]).map((item) => (
          <a
            key={item}
            href={"/floor-plan/editor?locale=" + item}
            style={{
              minWidth: "34px",
              height: "32px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: item === initialLocale ? "#ffffff" : "rgba(255,255,255,0.06)",
              color: item === initialLocale ? "#020617" : "rgba(255,255,255,0.78)",
              fontSize: "12px",
              fontWeight: 900,
              textDecoration: "none"
            }}
          >
            {item.toUpperCase()}
          </a>
        ))}
      </div>
    </main>
  );
}

const fieldStyle: React.CSSProperties = {
  height: "42px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  padding: "0 12px",
  width: "100%",
  boxSizing: "border-box",
  outline: "none"
};

const selectStyle: React.CSSProperties = {
  height: "42px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#ffffff",
  padding: "0 12px",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none"
};

const optionStyle: React.CSSProperties = {
  background: "#ffffff",
  color: "#111111"
};

const primaryButtonStyle: React.CSSProperties = {
  height: "44px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "#ffffff",
  color: "#111111",
  cursor: "pointer",
  fontWeight: 700
};

const secondaryButtonStyle: React.CSSProperties = {
  height: "40px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 600
};

const dangerButtonStyle: React.CSSProperties = {
  height: "42px",
  borderRadius: "14px",
  border: "1px solid rgba(255,120,120,0.25)",
  background: "rgba(255,80,80,0.12)",
  color: "#ffd6d6",
  cursor: "pointer",
  fontWeight: 700
};

const infoCardStyle: React.CSSProperties = {
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  padding: "12px",
  color: "#ffffff",
  lineHeight: 1.7
};