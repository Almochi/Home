import { fetchJson } from "@/api/http";

interface HitokotoResponse {
  hitokoto?: string;
  from?: string;
  from_who?: string | null;
}

export interface Hitokoto {
  text: string;
  from: string;
}

/** 一言：失败由调用方降级为占位文案 */
export async function fetchHitokoto(timeoutMs = 8000): Promise<Hitokoto> {
  const data = await fetchJson<HitokotoResponse>("https://v1.hitokoto.cn", { timeoutMs });
  const text = data.hitokoto?.trim();
  if (!text) throw new Error("一言返回内容为空");
  return { text, from: data.from_who?.trim() || data.from?.trim() || "" };
}
