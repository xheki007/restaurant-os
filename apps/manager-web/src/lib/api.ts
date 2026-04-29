export type ReservationListItem = {
  id: string;
  status: string;
  partySize?: number;
  startAt?: string;
  endAt?: string;
  reservationDate?: string;
  confirmationCode?: string;
  guest?: {
    id?: string;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  assignedTable?: {
    id?: string;
    code?: string | null;
    name?: string | null;
  } | null;
  assignedCombination?: {
    id?: string;
    name?: string | null;
    code?: string | null;
  } | null;
};
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "";

const DEV_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_DEV_ACCESS_TOKEN?.trim() ||
  process.env.DEV_ACCESS_TOKEN?.trim() ||
  "";

function getAccessToken() {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken") || "";
    if (token) {
      return token;
    }
  }

  return DEV_ACCESS_TOKEN;
}

function buildHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  const token = getAccessToken();

  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  return headers;
}

export async function apiGet(path: string) {
  const url = API_BASE_URL + path;

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      "API GET failed: " +
        response.status +
        " " +
        response.statusText +
        " | " +
        url +
        " | " +
        errorText
    );
  }

  return response.json();
}

export async function apiPost(path: string, body: any) {
  const url = API_BASE_URL + path;

  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      "API POST failed: " +
        response.status +
        " " +
        response.statusText +
        " | " +
        url +
        " | " +
        errorText
    );
  }

  return response.json();
}

export async function apiPatch(path: string, body: any) {
  const url = API_BASE_URL + path;

  const response = await fetch(url, {
    method: "PATCH",
    headers: buildHeaders(),
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      "API PATCH failed: " +
        response.status +
        " " +
        response.statusText +
        " | " +
        url +
        " | " +
        errorText
    );
  }

  return response.json();
}

export async function apiDelete(path: string) {
  const url = API_BASE_URL + path;

  const response = await fetch(url, {
    method: "DELETE",
    headers: buildHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      "API DELETE failed: " +
        response.status +
        " " +
        response.statusText +
        " | " +
        url +
        " | " +
        errorText
    );
  }

  return response.json();
}

export async function getReservations(params: {
  tenantId: string;
  branchId: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  if (!params?.tenantId || !params?.branchId) {
    throw new Error("getReservations: tenantId or branchId missing");
  }

  const search = new URLSearchParams({
    tenantId: params.tenantId,
    branchId: params.branchId
  });

  if (params?.dateFrom && params?.dateTo) {
    search.set("dateFrom", params.dateFrom);
    search.set("dateTo", params.dateTo);
  } else if (params?.date) {
    const d = new Date(params.date);

    const from = new Date(d);
    from.setHours(0, 0, 0, 0);

    const to = new Date(d);
    to.setHours(23, 59, 59, 999);

    search.set("dateFrom", from.toISOString());
    search.set("dateTo", to.toISOString());
  }

  return apiGet("/reservations?" + search.toString());
}

export async function getFloorPlans(params?: {
  tenantId?: string;
  branchId?: string;
  isActive?: string;
}) {
  const search = new URLSearchParams();

  if (params?.tenantId) search.set("tenantId", params.tenantId);
  if (params?.branchId) search.set("branchId", params.branchId);
  if (params?.isActive) search.set("isActive", params.isActive);

  const path = search.toString() ? "/floor-plans?" + search.toString() : "/floor-plans";
  const res: any = await apiGet(path);

  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.value)) return res.value;

  return [];
}
export async function getTables(params?: {
  tenantId?: string;
  branchId?: string;
  zoneId?: string;
  floorPlanId?: string;
  isActive?: string;
}) {
  const search = new URLSearchParams();

  if (params?.tenantId) search.set("tenantId", params.tenantId);
  if (params?.branchId) search.set("branchId", params.branchId);
  if (params?.zoneId) search.set("zoneId", params.zoneId);
  if (params?.floorPlanId) search.set("floorPlanId", params.floorPlanId);
  if (params?.isActive) search.set("isActive", params.isActive);

  const path = search.toString() ? "/tables?" + search.toString() : "/tables";
  const res: any = await apiGet(path);

  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.value)) return res.value;

  return [];
}

export async function createTable(body: {
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
}) {
  return apiPost("/tables", body);
}

export async function updateTable(
  id: string,
  body: {
    zoneId?: string;
    floorPlanId?: string;
    name?: string;
    code?: string;
    capacityMin?: number;
    capacityMax?: number;
    shape?: string;
    posX?: number;
    posY?: number;
    width?: number;
    height?: number;
    rotation?: number;
    isActive?: boolean;
  }
) {
  return apiPatch("/tables/" + id, body);
}

export async function deleteTable(id: string) {
  return apiDelete("/tables/" + id);
}

export async function getZones(params?: {
  tenantId?: string;
  branchId?: string;
  floorPlanId?: string;
  isActive?: string;
}) {
  const search = new URLSearchParams();

  if (params?.tenantId) search.set("tenantId", params.tenantId);
  if (params?.branchId) search.set("branchId", params.branchId);
  if (params?.floorPlanId) search.set("floorPlanId", params.floorPlanId);
  if (params?.isActive) search.set("isActive", params.isActive);

  const path = search.toString() ? "/zones?" + search.toString() : "/zones";
  const res: any = await apiGet(path);

  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.value)) return res.value;

  return [];
}

export async function createZone(body: {
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
}) {
  return apiPost("/zones", body);
}

export async function updateZone(
  id: string,
  body: {
    floorPlanId?: string;
    name?: string;
    code?: string;
    type?: string;
    color?: string;
    posX?: number;
    posY?: number;
    width?: number;
    height?: number;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  return apiPatch("/zones/" + id, body);
}

export async function deleteZone(id: string) {
  return apiDelete("/zones/" + id);
}

export async function getTableCombinations(params?: {
  tenantId?: string;
  branchId?: string;
  isActive?: string;
}) {
  const search = new URLSearchParams();

  if (params?.tenantId) search.set("tenantId", params.tenantId);
  if (params?.branchId) search.set("branchId", params.branchId);
  if (params?.isActive) search.set("isActive", params.isActive);

  const path = search.toString()
    ? "/table-combinations?" + search.toString()
    : "/table-combinations";

  const res: any = await apiGet(path);

  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.value)) return res.value;

  return [];
}

export async function getLayoutLabels(params?: {
  tenantId?: string;
  branchId?: string;
  floorPlanId?: string;
  isActive?: string;
}) {
  const search = new URLSearchParams();

  if (params?.tenantId) search.set("tenantId", params.tenantId);
  if (params?.branchId) search.set("branchId", params.branchId);
  if (params?.floorPlanId) search.set("floorPlanId", params.floorPlanId);
  if (params?.isActive) search.set("isActive", params.isActive);

  const path = search.toString()
    ? "/layout-labels?" + search.toString()
    : "/layout-labels";

  const res: any = await apiGet(path);

  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.value)) return res.value;

  return [];
}

export async function createLayoutLabel(body: {
  tenantId: string;
  branchId: string;
  floorPlanId: string;
  text: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  fontSize?: number;
  rotation?: number;
  color?: string;
  isActive?: boolean;
}) {
  return apiPost("/layout-labels", body);
}

export async function updateLayoutLabel(
  id: string,
  body: {
    text?: string;
    posX?: number;
    posY?: number;
    width?: number;
    height?: number;
    fontSize?: number;
    rotation?: number;
    color?: string;
    isActive?: boolean;
  }
) {
  return apiPatch("/layout-labels/" + id, body);
}

export async function deleteLayoutLabel(id: string) {
  return apiDelete("/layout-labels/" + id);
}

export function getCurrentContext() {
  if (typeof window === "undefined") {
    return { tenantId: "", branchId: "" };
  }

  return {
    tenantId: localStorage.getItem("tenantId") || "",
    branchId: localStorage.getItem("branchId") || ""
  };
}