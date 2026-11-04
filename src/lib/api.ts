import { ApiPlayer } from "@/types";

const API_BASE_PATH = "/backend";

export interface PlayersResponse {
  success: boolean;
  players: ApiPlayer[];
  totals: unknown;
}

export interface SocketTicketResponse {
  success: boolean;
  ticket: string;
  expiresIn: number;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload;

  if (payload && typeof payload === "object") {
    const body = payload as Record<string, unknown>;
    if (typeof body.message === "string" && body.message.trim()) return body.message;
    if (typeof body.error === "string" && body.error.trim()) return body.error;
  }

  return fallback;
}

async function requestJson<TResponse>(
  path: string,
  init: RequestInit = {}
): Promise<TResponse> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    throw new ApiClientError(`Could not reach the backend: ${message}`, 0, error);
  }

  const responseText = await response.text();
  let payload: unknown;

  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        throw new ApiClientError(
          getErrorMessage(responseText, `Request failed (${response.status})`),
          response.status,
          responseText
        );
      }
      throw new ApiClientError("Backend returned invalid JSON", response.status, responseText);
    }
  }

  if (!response.ok) {
    throw new ApiClientError(
      getErrorMessage(payload, `Request failed (${response.status} ${response.statusText})`),
      response.status,
      payload
    );
  }

  return payload as TResponse;
}

export function login<TRequest extends object, TResponse = unknown>(
  credentials: TRequest
): Promise<TResponse> {
  return requestJson<TResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser<TResponse = unknown>(): Promise<TResponse> {
  return requestJson<TResponse>("/api/auth/me");
}

export function logout<TResponse = unknown>(): Promise<TResponse> {
  return requestJson<TResponse>("/api/auth/logout", { method: "POST" });
}

export function getSocketTicket(): Promise<SocketTicketResponse> {
  return requestJson<SocketTicketResponse>("/api/auth/socket-ticket", { method: "POST" });
}

export function getServerStatus<TResponse = unknown>(): Promise<TResponse> {
  return requestJson<TResponse>("/api/server/status");
}

export function getServerResources<TResponse = unknown>(): Promise<TResponse> {
  return requestJson<TResponse>("/api/server/resources");
}

export function startServer<TResponse = unknown>(): Promise<TResponse> {
  return requestJson<TResponse>("/api/server/start", { method: "POST" });
}

export function stopServer<TResponse = unknown>(): Promise<TResponse> {
  return requestJson<TResponse>("/api/server/stop", { method: "POST" });
}

export function restartServer<TResponse = unknown>(): Promise<TResponse> {
  return requestJson<TResponse>("/api/server/restart", { method: "POST" });
}

export function getPlayers<TResponse = PlayersResponse>(): Promise<TResponse> {
  return requestJson<TResponse>("/api/players");
}

function playerPath(username: string, action: string): string {
  return `/api/players/${encodeURIComponent(username)}/${action}`;
}

export function kickPlayer<TResponse = unknown>(username: string, reason?: string): Promise<TResponse> {
  return requestJson<TResponse>(playerPath(username, "kick"), {
    method: "POST",
    ...(reason ? { body: JSON.stringify({ reason }) } : {}),
  });
}

export function banPlayer<TResponse = unknown>(username: string, reason?: string): Promise<TResponse> {
  return requestJson<TResponse>(playerPath(username, "ban"), {
    method: "POST",
    ...(reason ? { body: JSON.stringify({ reason }) } : {}),
  });
}

export function unbanPlayer<TResponse = unknown>(username: string): Promise<TResponse> {
  return requestJson<TResponse>(playerPath(username, "unban"), { method: "POST" });
}

export function setPlayerWhitelist<TResponse = unknown>(
  username: string,
  isWhitelisted: boolean
): Promise<TResponse> {
  return requestJson<TResponse>(playerPath(username, "whitelist"), {
    method: isWhitelisted ? "POST" : "DELETE",
  });
}
