import { prisma } from "../prisma.ts";
import { MOCK_NOTES } from "../mock-notes.ts";
import type { NoteDetail, NoteMeta, PaginatedResponse } from "../types.ts";
import type {
  ValidatedCreateNoteInput,
  ValidatedListNotesQuery,
  ValidatedUpdateNoteInput,
} from "../validations/notes.ts";
import type { Prisma } from "@prisma/client";

export class ConflictError extends Error {
  currentNote: NoteDetail;
  constructor(message: string, currentNote: NoteDetail) {
    super(message);
    this.name = "ConflictError";
    this.currentNote = currentNote;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

function formatNoteDetail(note: {
  id: string;
  title: string;
  doc: Prisma.JsonValue;
  scene: Prisma.JsonValue | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}): NoteDetail {
  return {
    id: note.id,
    title: note.title,
    doc: note.doc as NoteDetail["doc"],
    scene: note.scene as NoteDetail["scene"],
    version: note.version,
    createdAt: note.createdAt.getTime(),
    updatedAt: note.updatedAt.getTime(),
  };
}

function formatNoteMeta(note: {
  id: string;
  title: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}): NoteMeta {
  return {
    id: note.id,
    title: note.title,
    version: note.version,
    createdAt: note.createdAt.getTime(),
    updatedAt: note.updatedAt.getTime(),
  };
}

export async function seedDemoNotesIfEmpty(): Promise<void> {
  const count = await prisma.note.count();
  if (count > 0) return;

  // Insert mock notes idempotently with transaction
  for (const seed of MOCK_NOTES) {
    await prisma.note.create({
      data: {
        id: seed.id,
        title: seed.title,
        doc: seed.doc as unknown as Prisma.InputJsonValue,
        scene: seed.skeleton
          ? ({ elements: [], appState: {} } as unknown as Prisma.InputJsonValue)
          : undefined,
        version: 1,
        createdAt: new Date(seed.updatedAt),
        updatedAt: new Date(seed.updatedAt),
      },
    });
  }
}

export async function listNotes(
  query: ValidatedListNotesQuery
): Promise<PaginatedResponse<NoteMeta>> {
  const { q, page, limit, sortBy, order } = query;

  const where: Prisma.NoteWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, notes] = await Promise.all([
    prisma.note.count({ where }),
    prisma.note.findMany({
      where,
      select: {
        id: true,
        title: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: order },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items: notes.map(formatNoteMeta),
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export async function getNoteById(id: string): Promise<NoteDetail | null> {
  const note = await prisma.note.findUnique({
    where: { id },
  });
  if (!note) return null;
  return formatNoteDetail(note);
}

export async function createNote(input: ValidatedCreateNoteInput): Promise<NoteDetail> {
  const defaultDoc = { type: "doc", content: [{ type: "paragraph" }] };
  const note = await prisma.note.create({
    data: {
      ...(input.id ? { id: input.id } : {}),
      title: input.title,
      doc: (input.doc ?? defaultDoc) as unknown as Prisma.InputJsonValue,
      scene: input.scene ? (input.scene as unknown as Prisma.InputJsonValue) : undefined,
      version: 1,
    },
  });
  return formatNoteDetail(note);
}

export async function updateNote(
  id: string,
  input: ValidatedUpdateNoteInput
): Promise<NoteDetail> {
  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError(`Note with id '${id}' was not found`);
  }

  const currentDetail = formatNoteDetail(existing);

  // Optimistic Concurrency Control (OCC)
  if (
    input.expectedVersion !== undefined &&
    existing.version !== input.expectedVersion
  ) {
    throw new ConflictError(
      `Version mismatch. Expected version ${input.expectedVersion}, but current version is ${existing.version}.`,
      currentDetail
    );
  }

  const updateData: Prisma.NoteUpdateInput = {
    version: { increment: 1 },
  };

  if (input.title !== undefined) updateData.title = input.title;
  if (input.doc !== undefined) updateData.doc = input.doc as unknown as Prisma.InputJsonValue;
  if (input.scene !== undefined) updateData.scene = input.scene as unknown as Prisma.InputJsonValue;

  const updated = await prisma.note.update({
    where: { id },
    data: updateData,
  });

  return formatNoteDetail(updated);
}

export async function deleteNote(id: string): Promise<void> {
  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError(`Note with id '${id}' was not found`);
  }
  await prisma.note.delete({ where: { id } });
}
