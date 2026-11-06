export type Session = {
  device: { id: string; role: "support" | "communicator"; name: string } | null;
  peers: { id: string; name: string }[];
  subscribed: boolean;
  publicKey: string | null;
};
export type NetworkRequest = {
  id: string;
  phrase: string;
  createdAt: string;
  readAt: string | null;
  senderName?: string;
};
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  try {
    const response = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error("O serviço da rede está indisponível. Tente novamente com internet.");
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível concluir. Tente novamente.");
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "Error") throw error;
    throw new Error("Não foi possível acessar a rede. Confira a conexão e tente novamente.");
  }
}
