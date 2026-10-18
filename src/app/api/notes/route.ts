import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-errors";
import {
  validateCreateNoteInput,
  validateListNotesQuery,
} from "@/lib/validations/notes";
import {
  createNote,
  listNotes,
  seedDemoNotesIfEmpty,
} from "@/lib/services/notes-service";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const validation = validateListNotesQuery(url);

  if (validation.errors || !validation.data) {
    return createErrorResponse(
      422,
      "VALIDATION_ERROR",
      "Invalid query parameters",
      url.pathname,
      validation.errors
    );
  }

  try {
    // Ensure initial demo seed exists on first run
    await seedDemoNotesIfEmpty();
    const result = await listNotes(validation.data);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    // Check if database is unreachable
    if (message.includes("Can't reach database server") || message.includes("P1001")) {
      return createErrorResponse(
        503,
        "DATABASE_UNAVAILABLE",
        "Database is unavailable. Verify that PostgreSQL is running and DATABASE_URL is configured.",
        url.pathname
      );
    }
    return createErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      message,
      url.pathname
    );
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return createErrorResponse(
      400,
      "BAD_REQUEST",
      "Malformed JSON payload in request body",
      url.pathname
    );
  }

  const validation = validateCreateNoteInput(rawBody);
  if (validation.errors || !validation.data) {
    return createErrorResponse(
      422,
      "VALIDATION_ERROR",
      "Invalid request body",
      url.pathname,
      validation.errors
    );
  }

  try {
    const created = await createNote(validation.data);
    return NextResponse.json(created, {
      status: 201,
      headers: {
        Location: `/api/notes/${created.id}`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    if (message.includes("Can't reach database server") || message.includes("P1001")) {
      return createErrorResponse(
        503,
        "DATABASE_UNAVAILABLE",
        "Database is unavailable. Verify that PostgreSQL is running and DATABASE_URL is configured.",
        url.pathname
      );
    }
    return createErrorResponse(
      500,
      "INTERNAL_SERVER_ERROR",
      message,
      url.pathname
    );
  }
}
