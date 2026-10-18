export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DATABASE_UNAVAILABLE"
  | "INTERNAL_SERVER_ERROR";

export interface ApiErrorPayload {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
    timestamp: string;
    path: string;
  };
}

export function createErrorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  path: string,
  details?: unknown
): Response {
  return Response.json(
    {
      error: {
        code,
        message,
        details: details ?? null,
        timestamp: new Date().toISOString(),
        path,
      },
    },
    { status }
  );
}
