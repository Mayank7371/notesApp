import type { NoteMeta } from "./types";

const hour = 3_600_000;
const now = Date.now();

export const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export const MOCK_NOTES = [
  {
    id: "n1",
    title: "How a request reaches the database",
    updatedAt: now - hour,
    doc: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "The path of one request" }] },
        { type: "paragraph", content: [{ type: "text", text: "The browser sends a request to a Next.js route handler." }] },
      ],
    },
  },
  {
    id: "n2",
    title: "React state vs refs",
    updatedAt: now - 5 * hour,
    doc: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Two ways to remember a value" }] },
        { type: "paragraph", content: [{ type: "text", text: "State triggers a re-render when it changes." }] },
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
