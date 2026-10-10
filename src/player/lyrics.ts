/**
 * 歌词：LRC 解析 + 拉取组合，播放器里唯一碰歌词的模块。
 *
 * 分工：parseLrc 是纯函数（文本 → LyricLine[]），loadLyricLines 负责「取 + 解析」。
 * 竞态令牌由调用方（usePlayer）持有并校验 —— 这样本模块保持无状态，
 * 而「快速切歌时先发出的请求不能覆盖后一首的歌词」由引擎统一保证。
 */
import { fetchLyric, type Track } from "@/api/music";

export interface LyricLine {
  /** 起始时间（秒） */
  time: number;
  text: string;
}

const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const OFFSET_TAG = /\[offset:\s*([+-]?\d+)\]/i;

/** 解析 LRC：支持 [mm:ss.xx] / [mm:ss:xx] / 一行多时间戳 / [offset:±ms] */
export function parseLrc(raw: string | null | undefined): LyricLine[] {
  if (!raw) return [];
  const offsetMatch = OFFSET_TAG.exec(raw);
  const offset = offsetMatch ? Number(offsetMatch[1]) / 1000 : 0;

  const lines: LyricLine[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const text = rawLine.replace(TIME_TAG, "").trim();
    if (!text) continue;
    TIME_TAG.lastIndex = 0;
    let match = TIME_TAG.exec(rawLine);
    while (match) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const fraction = match[3] ? Number(`0.${match[3]}`) : 0;
      lines.push({ time: minutes * 60 + seconds + fraction + offset, text });
      match = TIME_TAG.exec(rawLine);
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

/** 当前时间对应的歌词行下标，找不到返回 -1 */
export function findLyricIndex(lines: LyricLine[], currentTime: number): number {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (currentTime >= lines[i].time) return i;
  }
  return -1;
}

/** 拉取并解析歌词；没有歌词地址时直接返回空数组，不产生请求 */
export async function loadLyricLines(track: Track, timeoutMs: number): Promise<LyricLine[]> {
  if (!track.lrc) return [];
  return parseLrc(await fetchLyric(track.lrc, timeoutMs));
}
