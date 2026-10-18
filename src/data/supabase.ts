const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function supabaseRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  if (!url || !key) throw new Error("Supabase 설정이 없습니다.");
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error("Supabase 요청에 실패했습니다.");
  return (await response.json()) as T;
}
