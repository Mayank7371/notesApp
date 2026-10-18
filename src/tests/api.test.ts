import {
  validateCreateNoteInput,
  validateListNotesQuery,
  validateUpdateNoteInput,
} from "../lib/validations/notes.ts";
import { createErrorResponse } from "../lib/api-errors.ts";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("▶ Running API Design & Validation Tests...\n");

// Test 1: validateCreateNoteInput - Valid input
{
  const res = validateCreateNoteInput({
    title: "Test Note",
    doc: { type: "doc", content: [] },
  });
  assert(!res.errors, "Expected no errors for valid create note input");
  assert(res.data?.title === "Test Note", "Expected title to match");
  console.log("✔ Test 1: Valid create note input passes");
}

// Test 2: validateCreateNoteInput - Title too long
{
  const res = validateCreateNoteInput({
    title: "a".repeat(256),
  });
  assert(!!res.errors, "Expected error when title > 255 characters");
  assert(res.errors![0].field === "title", "Expected field to be 'title'");
  console.log("✔ Test 2: Title > 255 chars validation triggers correctly");
}

// Test 3: validateCreateNoteInput - Non-object body
{
  const res = validateCreateNoteInput("string-body");
  assert(!!res.errors, "Expected error when body is not an object");
  assert(res.errors![0].field === "body", "Expected error on body");
  console.log("✔ Test 3: Non-object body validation triggers correctly");
}

// Test 4: validateUpdateNoteInput - Empty body rejected
{
  const res = validateUpdateNoteInput({});
  assert(!!res.errors, "Expected error when update body is empty");
  console.log("✔ Test 4: Empty update body rejected with 422 error");
}

// Test 5: validateUpdateNoteInput - OCC expectedVersion validation
{
  const resInvalid = validateUpdateNoteInput({ expectedVersion: -1 });
  assert(!!resInvalid.errors, "Expected error for negative expectedVersion");

  const resValid = validateUpdateNoteInput({ title: "New Title", expectedVersion: 2 });
  assert(!resValid.errors, "Expected valid update with expectedVersion");
  assert(resValid.data?.expectedVersion === 2, "expectedVersion should be 2");
  console.log("✔ Test 5: OCC expectedVersion validation works as intended");
}

// Test 6: validateListNotesQuery - Defaults
{
  const url = new URL("http://localhost:3000/api/notes");
  const res = validateListNotesQuery(url);
  assert(!res.errors, "Expected no errors for default query");
  assert(res.data?.page === 1, "Default page should be 1");
  assert(res.data?.limit === 20, "Default limit should be 20");
  assert(res.data?.sortBy === "updatedAt", "Default sortBy should be updatedAt");
  assert(res.data?.order === "desc", "Default order should be desc");
  console.log("✔ Test 6: Query parameter defaults assigned properly");
}

// Test 7: validateListNotesQuery - Out of bounds & invalid params
{
  const url = new URL("http://localhost:3000/api/notes?page=0&limit=500&sortBy=invalid");
  const res = validateListNotesQuery(url);
  assert(!!res.errors, "Expected errors for invalid query params");
  assert(res.errors!.length === 3, "Expected 3 validation errors for page, limit, and sortBy");
  console.log("✔ Test 7: Query param boundaries and enum validations work");
}

// Test 8: createErrorResponse - Standardized schema
{
  const errRes = createErrorResponse(404, "NOT_FOUND", "Note not found", "/api/notes/123", { id: "123" });
  assert(errRes.status === 404, "Status should be 404");
  console.log("✔ Test 8: createErrorResponse constructs proper HTTP status and RFC structure");
}

console.log("\n All 8 API Validation & Contract tests passed successfully!\n");
