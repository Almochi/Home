/**
 * 歌单：Meting-API → 归一化的 Track 列表。
 *
 * 设计要点（对齐 Shirone 的 utils/music/meting.ts）：
 * - 地址是「模板 + 占位符」，换实例只改模板，不用改代码；
 * - 组装与解析都是纯函数，边界一眼可见；
 * - 记录必须「有名字 + 有播放地址」才保留，并按 id 去重（歌单里重复曲目很常见）；
 * - 时长同时兼容秒与毫秒：不同 Meting 实现返回的单位不一致。
 *
 * 兼容分支：部分自建 Meting（尤其网易云）会把 url 返回成
 * `@module@callback@callbackFn@url`，需要浏览器再发一次 JSONP 才能拿到真实地址，
 * 这条路径保留在 fetchPlaylist 里（Shirone 没有它，但自建实例仍会用到）。
 */
import { fetchJson, fetchText } from "@/api/http";
import { fetchJsonp } from "@/api/jsonp";
import type { MusicConfig } from "@/types/config";

export interface Track {
  /** 稳定标识：Meting 的歌曲 id 优先，用作列表 key 与去重依据 */
  id: string;
  name: string;
  artist: string;
  url: string;
  cover: string;
  /** 歌词文件地址，可能为空 */
  lrc: string | null;
  /** 时长（秒），未知为 null */
  duration: number | null;
}

interface MetingItem {
  id?: number | string;
  name?: string;
  title?: string;
  artist?: string;
  author?: string;
  url?: string;
  cover?: string;
  pic?: string;
  lrc?: string;
  duration?: number | string;
}

interface NeteaseJsonpPayload {
  req_0?: {
    data?: {
      sip?: string[];
      midurlinfo?: Array<{ purl?: string }>;
    };
  };
}

/**
 * 组装请求地址：把模板里的 :server / :type / :id / :auth / :r 逐个替换。
 * id 为空时返回 null —— 调用方据此判断「播放器没有配置」。
 */
export function buildMetingUrl(config: MusicConfig, random: number = Date.now()): string | null {
  const id = config.id.trim();
  if (!id) return null;
  return config.api
    .replace(":server", encodeURIComponent(config.server))
    .replace(":type", encodeURIComponent(config.type))
    .replace(":id", encodeURIComponent(id))
    .replace(":auth", config.auth ? encodeURIComponent(config.auth) : "")
    .replace(":r", String(random));
}

/** Meting 的时长有秒也有毫秒，统一成秒 */
function parseDuration(value: MetingItem["duration"]): number | null {
  const raw = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return Math.floor(raw > 10_000 ? raw / 1000 : raw);
}

/** 单条记录 → Track；没有名字或没有播放地址就丢弃 */
export function parseMetingSong(item: MetingItem, index: number, server: string): Track | null {
  if (!item || typeof item !== "object") return null;
  const name = (item.name ?? item.title ?? "").trim();
  const url = (item.url ?? "").trim();
  if (!name || !url) return null;

  const rawId = item.id === undefined || item.id === null ? "" : String(item.id).trim();
  const lrc = (item.lrc ?? "").trim();
  return {
    id: rawId ? `meting-${server}-${rawId}` : `meting-${server}-${index}`,
    name,
    artist: (item.artist ?? item.author ?? "").trim(),
    url,
    cover: (item.cover ?? item.pic ?? "").trim(),
    lrc: lrc ? lrc : null,
    duration: parseDuration(item.duration),
  };
}

function collect(items: MetingItem[], server: string): Track[] {
  const seen = new Set<string>();
  const tracks: Track[] = [];
  items.forEach((item, index) => {
    const track = parseMetingSong(item, index, server);
    if (!track || seen.has(track.id)) return;
    seen.add(track.id);
    tracks.push(track);
  });
  return tracks;
}

export async function fetchPlaylist(config: MusicConfig, signal?: AbortSignal): Promise<Track[]> {
  const url = buildMetingUrl(config);
  if (!url) return [];

  const data = await fetchJson<MetingItem[]>(url, { timeoutMs: config.timeoutMs, signal });
  if (!Array.isArray(data) || data.length === 0) return [];

  const first = (data[0]?.url ?? "").trim();
  if (!first.startsWith("@")) return collect(data, config.server);

  // 网易云直链：先用 JSONP 探一次 sip 域名，再按 purl 拼出每首的真实地址
  const [, , callbackFunction, jsonpUrl] = first.split("@").slice(1);
  if (!jsonpUrl) return [];

  const payload = await fetchJsonp<NeteaseJsonpPayload>(jsonpUrl, {
    timeoutMs: config.timeoutMs,
    callbackParam: callbackFunction || "callback",
  });
  const sip = payload.req_0?.data?.sip ?? [];
  const domain = (sip.find((entry) => !entry.startsWith("http://ws")) || sip[0] || "").replace(
    "http://",
    "https://",
  );
  const info = payload.req_0?.data?.midurlinfo ?? [];

  return collect(
    data.map((item, index) => ({ ...item, url: `${domain}${info[index]?.purl ?? ""}` })),
    config.server,
  );
}

/** 拉取歌词文件；失败返回空字符串而不是抛错 */
export async function fetchLyric(url: string, timeoutMs = 8000): Promise<string> {
  try {
    return await fetchText(url, { timeoutMs });
  } catch {
    return "";
  }
}
