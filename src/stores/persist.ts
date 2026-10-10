/**
 * 应用状态的持久化契约：白名单、默认值、恢复与防抖写盘。
 *
 * 与 app.ts 的分工：app.ts 只描述「状态长什么样 + 怎么改」，
 * 这里只描述「哪些字段跨会话保留 + 坏数据如何回落」。
 * 存储键 home:prefs 与主题（home:theme）、语言（home:locale）同属 home: 命名空间。
 */

import { musicConfig } from "@/config/music";
import { wallpaperConfig } from "@/config/wallpaper";
import type { AppState } from "@/stores/app";
import { pickBoolean, pickEnum, pickNumber } from "@/utils/pick";
import { readJson, writeJson } from "@/utils/storage";

const STORAGE_KEY = "home:prefs";
const ENVELOPE_VERSION = 1;
const PERSIST_DEBOUNCE_MS = 300;

/**
 * 需要持久化的字段白名单：运行期状态（浮层开关、播放进度、窗口宽度…）
 * 永远不会被写进 localStorage，避免刷新后弹出一堆面板。
 */
export const PERSISTED_KEYS = [
  "wallpaperId",
  "showSiteAge",
  "playerVolume",
  "playerLyrics",
  "footerBackdrop",
  "playerAutoplay",
  "playerLoop",
  "playerOrder",
  "linkBackdrop",
] as const satisfies readonly (keyof AppState)[];

export type PersistedState = Pick<AppState, (typeof PERSISTED_KEYS)[number]>;

const LOOP_VALUES = ["all", "one", "none"] as const;
const ORDER_VALUES = ["list", "random"] as const;

/** 偏好字段的默认值：与白名单一一对应，新增字段时两处都要改 */
export function defaultPersistedState(): PersistedState {
  const sourceIds = wallpaperConfig.sources.map((source) => source.id);
  return {
    wallpaperId: pickEnum(wallpaperConfig.defaultId, sourceIds, wallpaperConfig.defaultId),
    showSiteAge: false,
    playerVolume: musicConfig.defaults.volume,
    playerLyrics: musicConfig.defaults.showLyric,
    footerBackdrop: true,
    playerAutoplay: musicConfig.defaults.autoplay,
    playerLoop: musicConfig.defaults.loop,
    playerOrder: musicConfig.defaults.order,
    linkBackdrop: true,
  };
}

/** 逐字段校验后恢复偏好：类型不符、越界、手工改坏的值一律回落到默认值 */
export function restorePersistedState(fallback: PersistedState): PersistedState {
  const saved = readJson<Partial<PersistedState>>(STORAGE_KEY, {});
  const sourceIds = wallpaperConfig.sources.map((source) => source.id);
  return {
    wallpaperId: pickEnum(saved.wallpaperId, sourceIds, fallback.wallpaperId),
    showSiteAge: pickBoolean(saved.showSiteAge, fallback.showSiteAge),
    playerVolume: pickNumber(saved.playerVolume, fallback.playerVolume, 0, 1),
    playerLyrics: pickBoolean(saved.playerLyrics, fallback.playerLyrics),
    footerBackdrop: pickBoolean(saved.footerBackdrop, fallback.footerBackdrop),
    playerAutoplay: pickBoolean(saved.playerAutoplay, fallback.playerAutoplay),
    playerLoop: pickEnum(saved.playerLoop, LOOP_VALUES, fallback.playerLoop),
    playerOrder: pickEnum(saved.playerOrder, ORDER_VALUES, fallback.playerOrder),
    linkBackdrop: pickBoolean(saved.linkBackdrop, fallback.linkBackdrop),
  };
}

let timer = 0;

/** 防抖写盘：拖拽音量滑块时不会每帧都碰 localStorage */
export function persistState(state: AppState): void {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    const snapshot: Record<string, unknown> = {};
    for (const key of PERSISTED_KEYS) snapshot[key] = state[key];
    writeJson(STORAGE_KEY, snapshot, ENVELOPE_VERSION);
  }, PERSIST_DEBOUNCE_MS);
}
