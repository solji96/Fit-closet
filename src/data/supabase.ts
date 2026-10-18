const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class SupabaseConfigError extends Error {
  constructor() {
    super("Supabase 설정이 없습니다.");
    this.name = "SupabaseConfigError";
  }
}

export async function supabaseRpc<T>(
  name: string,
  args: Record<string, unknown>,
  keepalive = false,
): Promise<T> {
  if (!url || !key) throw new SupabaseConfigError();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    keepalive,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error("Supabase 요청에 실패했습니다.");
  return (await response.json()) as T;
}
