// Cliente da API (POST /api/rpc). A sessão fica num cookie HttpOnly que o navegador
// envia sozinho — o JavaScript do app nunca vê nem guarda a senha ou o token.

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function rpc<T = unknown>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action, ...params }),
    });
  } catch {
    throw new ApiError("NETWORK", "Sem conexão com o servidor. Verifique sua internet e tente de novo.", 0);
  }

  let json: { ok?: boolean; data?: T; error?: { code?: string; message?: string } } | null = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!json || typeof json.ok !== "boolean") {
    // Resposta que não é da API (ex.: preview do editor, sem servidor).
    throw new ApiError(
      "NO_SERVER",
      "Servidor indisponível. O banco de dados só funciona no site publicado na Vercel (não no preview do editor).",
      res.status,
    );
  }
  if (!json.ok) {
    throw new ApiError(json.error?.code || "ERROR", json.error?.message || "Erro inesperado.", res.status);
  }
  return json.data as T;
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return "Erro inesperado. Tente novamente.";
}
