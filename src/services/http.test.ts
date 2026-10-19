import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";
import {
  ApiError,
  getFieldError,
  request,
  setCsrfToken,
  setUnauthorizedHandler,
} from "./http";

const API_URL = "http://localhost:8000";
const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  setCsrfToken(null);
  setUnauthorizedHandler(null);
});

afterAll(() => {
  server.close();
});

describe("cliente HTTP", () => {
  it("envía credenciales y devuelve el JSON de la API", async () => {
    server.use(
      http.get(`${API_URL}/health`, ({ request: incomingRequest }) => {
        expect(incomingRequest.credentials).toBe("include");
        return HttpResponse.json({ status: "ok" });
      }),
    );

    await expect(request("/health")).resolves.toEqual({ status: "ok" });
  });

  it("interpreta el sobre de error del contrato", async () => {
    server.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json(
          {
            error: {
              code: "invalid_credentials",
              message: "Credenciales inválidas.",
              details: { email: ["El correo no está registrado."] },
            },
          },
          { status: 422 },
        ),
      ),
    );

    const error = await request("/auth/login", { method: "POST" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      code: "invalid_credentials",
      message: "Credenciales inválidas.",
    });
    expect(getFieldError(error, "email")).toBe(
      "El correo no está registrado.",
    );
  });

  it("llena el header CSRF cuando hay token configurado", async () => {
    setCsrfToken("token-de-prueba");

    server.use(
      http.post(`${API_URL}/cuentas`, ({ request: incomingRequest }) => {
        expect(incomingRequest.headers.get("x-csrf-token")).toBe(
          "token-de-prueba",
        );
        return HttpResponse.json({ id: "1" }, { status: 201 });
      }),
    );

    await expect(
      request("/cuentas", { method: "POST", body: { name: "Ahorros" } }),
    ).resolves.toEqual({ id: "1" });
  });

  it("invoca el manejador de 401 e informa el error", async () => {
    let unauthorizedCalls = 0;
    setUnauthorizedHandler(() => {
      unauthorizedCalls += 1;
    });

    server.use(
      http.get(`${API_URL}/auth/me`, () =>
        HttpResponse.json(
          {
            error: {
              code: "unauthorized",
              message: "Sesión no válida.",
            },
          },
          { status: 401 },
        ),
      ),
    );

    await expect(request("/auth/me")).rejects.toMatchObject({
      status: 401,
      code: "unauthorized",
    });
    expect(unauthorizedCalls).toBe(1);
  });

  it("permite omitir la redirección de un 401", async () => {
    let unauthorizedCalls = 0;
    setUnauthorizedHandler(() => {
      unauthorizedCalls += 1;
    });

    server.use(
      http.get(`${API_URL}/auth/me`, () =>
        HttpResponse.json(
          {
            error: {
              code: "unauthorized",
              message: "Sesión no válida.",
            },
          },
          { status: 401 },
        ),
      ),
    );

    await expect(
      request("/auth/me", { skipUnauthorizedRedirect: true }),
    ).rejects.toMatchObject({ status: 401 });
    expect(unauthorizedCalls).toBe(0);
  });

  it("extrae errores de campo desde un arreglo de details", () => {
    const error = new ApiError(422, "validation_error", "Datos inválidos", [
      { field: "amount", message: "El importe debe ser positivo." },
    ]);

    expect(getFieldError(error, "amount")).toBe(
      "El importe debe ser positivo.",
    );
    expect(getFieldError(error, "currency")).toBeUndefined();
  });
});
