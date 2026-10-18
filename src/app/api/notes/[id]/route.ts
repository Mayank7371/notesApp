import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/api-errors";
import { validateUpdateNoteInput } from "@/lib/validations/notes";
import {
  ConflictError,
  NotFoundError,
  deleteNote,
  getNoteById,
  updateNote,
} from "@/lib/services/notes-service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const url = new URL(request.url);

  try {
    const note = await getNoteById(id);
    if (!note) {
      return createErrorResponse(
        404,
        "NOT_FOUND",
        `Note with id '${id}' was not found`,
        url.pathname
      );
    }
    return NextResponse.json(note, { status: 200 });
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
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", message, url.pathname);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
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

  const validation = validateUpdateNoteInput(rawBody);
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
    const updated = await updateNote(id, validation.data);
    return NextResponse.json(updated, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) {
      return createErrorResponse(404, "NOT_FOUND", err.message, url.pathname);
    }
    if (err instanceof ConflictError) {
      return createErrorResponse(
        409,
        "CONFLICT",
        err.message,
        url.pathname,
        { currentNote: err.currentNote }
      );
    }

    const message = err instanceof Error ? err.message : "Internal Server Error";
    if (message.includes("Can't reach database server") || message.includes("P1001")) {
      return createErrorResponse(
        503,
        "DATABASE_UNAVAILABLE",
        "Database is unavailable. Verify that PostgreSQL is running and DATABASE_URL is configured.",
        url.pathname
      );
    }
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", message, url.pathname);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const url = new URL(request.url);

  try {
    await deleteNote(id);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) {
      return createErrorResponse(404, "NOT_FOUND", err.message, url.pathname);
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    if (message.includes("Can't reach database server") || message.includes("P1001")) {
      return createErrorResponse(
        503,
        "DATABASE_UNAVAILABLE",
        "Database is unavailable. Verify that PostgreSQL is running and DATABASE_URL is configured.",
        url.pathname
      );
    }
    return createErrorResponse(500, "INTERNAL_SERVER_ERROR", message, url.pathname);
  }
}
