export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ValidatedListNotesQuery {
  q?: string;
  page: number;
  limit: number;
  sortBy: "updatedAt" | "title" | "createdAt";
  order: "asc" | "desc";
}

export function validateListNotesQuery(url: URL): {
  data?: ValidatedListNotesQuery;
  errors?: ValidationErrorDetail[];
} {
  const errors: ValidationErrorDetail[] = [];
  const searchParams = url.searchParams;

  const q = searchParams.get("q")?.trim() || undefined;
  if (q && q.length > 100) {
    errors.push({ field: "q", message: "Search query must not exceed 100 characters" });
  }

  let page = 1;
  const pageParam = searchParams.get("page");
  if (pageParam !== null) {
    const parsed = parseInt(pageParam, 10);
    if (isNaN(parsed) || parsed < 1) {
      errors.push({ field: "page", message: "Page must be an integer greater than or equal to 1" });
    } else {
      page = parsed;
    }
  }

  let limit = 20;
  const limitParam = searchParams.get("limit");
  if (limitParam !== null) {
    const parsed = parseInt(limitParam, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) {
      errors.push({ field: "limit", message: "Limit must be an integer between 1 and 100" });
    } else {
      limit = parsed;
    }
  }

  let sortBy: "updatedAt" | "title" | "createdAt" = "updatedAt";
  const sortByParam = searchParams.get("sortBy");
  if (sortByParam !== null) {
    if (["updatedAt", "title", "createdAt"].includes(sortByParam)) {
      sortBy = sortByParam as "updatedAt" | "title" | "createdAt";
    } else {
      errors.push({
        field: "sortBy",
        message: "sortBy must be one of: 'updatedAt', 'title', 'createdAt'",
      });
    }
  }

  let order: "asc" | "desc" = "desc";
  const orderParam = searchParams.get("order");
  if (orderParam !== null) {
    if (["asc", "desc"].includes(orderParam.toLowerCase())) {
      order = orderParam.toLowerCase() as "asc" | "desc";
    } else {
      errors.push({ field: "order", message: "order must be 'asc' or 'desc'" });
    }
  }

  if (errors.length > 0) return { errors };
  return { data: { q, page, limit, sortBy, order } };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ValidatedCreateNoteInput {
  id?: string;
  title: string;
  doc?: unknown;
  scene?: unknown;
}

export function validateCreateNoteInput(body: unknown): {
  data?: ValidatedCreateNoteInput;
  errors?: ValidationErrorDetail[];
} {
  const errors: ValidationErrorDetail[] = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: [{ field: "body", message: "Request body must be a JSON object" }] };
  }

  const obj = body as Record<string, unknown>;

  let id: string | undefined;
  if (obj.id !== undefined) {
    if (typeof obj.id !== "string" || !UUID_REGEX.test(obj.id)) {
      errors.push({ field: "id", message: "id must be a valid UUID string" });
    } else {
      id = obj.id;
    }
  }

  let title = "";
  if (obj.title !== undefined) {
    if (typeof obj.title !== "string") {
      errors.push({ field: "title", message: "Title must be a string" });
    } else if (obj.title.length > 255) {
      errors.push({ field: "title", message: "Title cannot exceed 255 characters" });
    } else {
      title = obj.title;
    }
  }

  let doc = obj.doc;
  if (doc !== undefined && (typeof doc !== "object" || doc === null)) {
    errors.push({ field: "doc", message: "doc must be a valid JSON object" });
  }

  let scene = obj.scene;
  if (scene !== undefined && scene !== null && typeof scene !== "object") {
    errors.push({ field: "scene", message: "scene must be a JSON object or null" });
  }

  if (errors.length > 0) return { errors };
  return { data: { id, title, doc, scene } };
}

export interface ValidatedUpdateNoteInput {
  title?: string;
  doc?: unknown;
  scene?: unknown;
  expectedVersion?: number;
}

export function validateUpdateNoteInput(body: unknown): {
  data?: ValidatedUpdateNoteInput;
  errors?: ValidationErrorDetail[];
} {
  const errors: ValidationErrorDetail[] = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { errors: [{ field: "body", message: "Request body must be a JSON object" }] };
  }

  const obj = body as Record<string, unknown>;
  const keys = Object.keys(obj);

  if (keys.length === 0) {
    return { errors: [{ field: "body", message: "Request body cannot be empty" }] };
  }

  let title: string | undefined;
  if (obj.title !== undefined) {
    if (typeof obj.title !== "string") {
      errors.push({ field: "title", message: "Title must be a string" });
    } else if (obj.title.length > 255) {
      errors.push({ field: "title", message: "Title cannot exceed 255 characters" });
    } else {
      title = obj.title;
    }
  }

  let doc = obj.doc;
  if (doc !== undefined && (typeof doc !== "object" || doc === null)) {
    errors.push({ field: "doc", message: "doc must be a valid JSON object" });
  }

  let scene = obj.scene;
  if (scene !== undefined && scene !== null && typeof scene !== "object") {
    errors.push({ field: "scene", message: "scene must be a JSON object or null" });
  }

  let expectedVersion: number | undefined;
  if (obj.expectedVersion !== undefined) {
    if (typeof obj.expectedVersion !== "number" || !Number.isInteger(obj.expectedVersion) || obj.expectedVersion < 1) {
      errors.push({ field: "expectedVersion", message: "expectedVersion must be a positive integer" });
    } else {
      expectedVersion = obj.expectedVersion;
    }
  }

  if (errors.length > 0) return { errors };
  return { data: { title, doc, scene, expectedVersion } };
}
