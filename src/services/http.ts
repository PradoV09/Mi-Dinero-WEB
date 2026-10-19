const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

const CSRF_HEADER_NAME = "X-CSRF-Token";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipUnauthorizedRedirect?: boolean;
}

let csrfToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function defaultUnauthorizedHandler(): void {
  if (typeof window === "undefined" || window.location.pathname === "/login") {
    return;
  }

  const from = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?from=${encodeURIComponent(from)}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseErrorResponse(
  status: number,
  statusText: string,
  rawBody: string,
): ApiError {
  let code = "http_error";
  let message = statusText || `Error ${status}`;
  let details: unknown;

  try {
    const payload: unknown = JSON.parse(rawBody);

    if (isRecord(payload) && isRecord(payload.error)) {
      if (typeof payload.error.code === "string") {
        code = payload.error.code;
      }

      if (typeof payload.error.message === "string") {
        message = payload.error.message;
      }

      details = payload.error.details;
    }
  } catch {
    details = undefined;
  }

  return new ApiError(status, code, message, details);
}

function isNativeBody(value: unknown): value is BodyInit {
  return (
    typeof value === "string" ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof Blob
  );
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    skipUnauthorizedRedirect = false,
    headers,
    ...init
  } = options;

  const requestHeaders = new Headers(headers);

  if (csrfToken) {
    requestHeaders.set(CSRF_HEADER_NAME, csrfToken);
  }

  let payload: BodyInit | undefined;

  if (body !== undefined && body !== null) {
    if (isNativeBody(body)) {
      payload = body;
    } else {
      requestHeaders.set("Content-Type", "application/json");
      payload = JSON.stringify(body);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: requestHeaders,
    body: payload,
  });

  if (!response.ok) {
    const rawBody = await response.text();
    const error = parseErrorResponse(
      response.status,
      response.statusText,
      rawBody,
    );

    if (response.status === 401 && !skipUnauthorizedRedirect) {
      (unauthorizedHandler ?? defaultUnauthorizedHandler)();
    }

    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const rawBody = await response.text();

  if (!rawBody) {
    return undefined as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new ApiError(
      response.status,
      "invalid_json",
      "La API devolvió una respuesta no válida.",
    );
  }
}

export function getFieldError(
  error: unknown,
  field: string,
): string | undefined {
  if (!(error instanceof ApiError) || error.details === undefined) {
    return undefined;
  }

  const { details } = error;

  if (Array.isArray(details)) {
    for (const item of details) {
      if (isRecord(item) && item.field === field) {
        if (typeof item.message === "string") {
          return item.message;
        }

        if (typeof item.detail === "string") {
          return item.detail;
        }
      }
    }

    return undefined;
  }

  if (!isRecord(details)) {
    return undefined;
  }

  const value = details[field];

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string");
    return typeof first === "string" ? first : undefined;
  }

  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  return undefined;
}

export { API_URL, CSRF_HEADER_NAME };
