import { getFirebaseIdToken } from "./firebase";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export type StudyMode =
  | "panic"
  | "exam_answers"
  | "reverse_revision"
  | "deep_architecture";

export type ApiUser = {
  id: string;
  firebase_uid: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiDocument = {
  id: string;
  filename: string;
  original_filename: string;
  content_type: string;
  file_size: number;
  status: "uploaded" | "processing" | "ready" | "failed";
  document_type:
  | "syllabus"
  | "lecture_notes"
  | "lecture_slides"
  | "pyq"
  | "other";
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiSession = {
  id: string;
  title: string;
  mode: StudyMode;
  created_at: string;
  updated_at: string;
};

export type ApiMessage = {
  id: string;
  session_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type ChatResult = {
  session_id: string;
  message_id: string;
  answer: string;
  sources: Array<{
    document_id: string;
    filename: string;
    page: number;
  }>;
};

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (authenticated) {
    const token = await getFirebaseIdToken();

    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  // Firebase can keep an expired/revoked token in the browser briefly.
  // Refresh once before surfacing an authentication error to the user.
  if (authenticated && response.status === 401) {
    const refreshedToken = await getFirebaseIdToken(true);

    headers.set("Authorization", `Bearer ${refreshedToken}`);

    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
    });
  }

  if (!response.ok) {
    let message = "The backend request failed.";

    try {
      const body = (await response.json()) as {
        detail?: string;
      };

      if (body.detail) {
        message = body.detail;
      }
    } catch {
      // Keep the generic message when the server did not return JSON.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getCurrentUser(): Promise<ApiUser> {
  return request<ApiUser>("/users/me");
}

export function listDocuments(): Promise<ApiDocument[]> {
  return request<ApiDocument[]>("/documents");
}

export function uploadDocument(
  file: File,
  documentType = "other",
): Promise<ApiDocument> {
  const body = new FormData();

  body.append("file", file);
  body.append("document_type", documentType);

  return request<ApiDocument>("/documents/upload", {
    method: "POST",
    body,
  });
}

export function listSessions(): Promise<ApiSession[]> {
  return request<ApiSession[]>("/sessions");
}

export function createSession(
  title: string,
  mode: StudyMode,
): Promise<ApiSession> {
  return request<ApiSession>("/sessions", {
    method: "POST",
    body: JSON.stringify({
      title,
      mode,
    }),
  });
}

export function getSessionMessages(sessionId: string): Promise<ApiMessage[]> {
  return request<ApiMessage[]>(`/sessions/${sessionId}/messages`);
}

export function deleteSession(sessionId: string): Promise<void> {
  return request<void>(`/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export function sendChat(
  sessionId: string,
  message: string,
  mode: StudyMode,
): Promise<ChatResult> {
  return request<ChatResult>("/chat", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      message,
      mode,
    }),
  });
}
