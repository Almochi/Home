/**
 * MediaSession：把曲目信息与传输控制交给系统（锁屏 / 通知栏 / 耳机按键）。
 * 不支持的浏览器静默跳过 —— 这是增强能力，不是播放的前提。
 */
import type { Track } from "@/api/music";

export interface MediaSessionActions {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
}

export function bindMediaSession(track: Track, actions: MediaSessionActions): void {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: track.artist,
      artwork: track.cover ? [{ src: track.cover, sizes: "512x512" }] : [],
    });
    navigator.mediaSession.setActionHandler("play", actions.play);
    navigator.mediaSession.setActionHandler("pause", actions.pause);
    navigator.mediaSession.setActionHandler("previoustrack", actions.previous);
    navigator.mediaSession.setActionHandler("nexttrack", actions.next);
  } catch {
    /* 部分浏览器不支持某些 action，忽略即可 */
  }
}

/** 释放时清空元数据，避免锁屏继续显示上一首 */
export function clearMediaSession(): void {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = null;
  } catch {
    /* 忽略 */
  }
}
