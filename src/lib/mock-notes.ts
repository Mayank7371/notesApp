import type { SeedNote } from "./types";

const h = (text: string) => ({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] });
const p = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });
const hour = 3_600_000;
const now = Date.now();

export const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export const MOCK_NOTES: SeedNote[] = [
  {
    id: "n1",
    title: "How a request reaches the database",
    updatedAt: now - hour,
    doc: {
      type: "doc",
      content: [
        h("The path of one request"),
        p("The browser sends a request to a Next.js route handler. The handler validates the input, then asks Prisma to read or write a row in PostgreSQL."),
        {
          type: "taskList",
          content: [
            { type: "taskItem", attrs: { checked: true }, content: [p("Draw the three boxes")] },
            { type: "taskItem", attrs: { checked: false }, content: [p("Label the arrows")] },
          ],
        },
        {
          type: "codeBlock",
          attrs: { language: "ts" },
          content: [{ type: "text", text: "export async function GET() {\n  const notes = await prisma.note.findMany();\n  return Response.json(notes);\n}" }],
        },
      ],
    },
    skeleton: [
      { type: "rectangle", x: 40, y: 80, width: 140, height: 70, label: { text: "Browser" } },
      { type: "rectangle", x: 280, y: 80, width: 140, height: 70, label: { text: "Route handler" } },
      { type: "rectangle", x: 520, y: 80, width: 140, height: 70, label: { text: "PostgreSQL" } },
      { type: "arrow", x: 185, y: 115, width: 90, height: 0 },
      { type: "arrow", x: 425, y: 115, width: 90, height: 0 },
    ],
  },
  {
    id: "n2",
    title: "React state vs refs",
    updatedAt: now - 5 * hour,
    doc: {
      type: "doc",
      content: [
        h("Two ways to remember a value"),
        p("State triggers a re-render when it changes. A ref holds a value across renders without triggering one."),
      ],
    },
  },
  {
    id: "n3",
    title: "Untitled sketch",
    updatedAt: now - 30 * hour,
    doc: { type: "doc", content: [{ type: "paragraph" }] },
  },
];
