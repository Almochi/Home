/**
 * 应用状态（轻量单例，替代 Pinia）
 *
 * 为什么不用状态库：这里只有一份全局状态、没有服务端数据、也没有跨 store 依赖，
 * 用 reactive + 显式持久化契约更小更透明。
 *
 * 边界：本文件只描述「状态长什么样 + 怎么改」；
 * 哪些字段跨会话保留、坏数据如何回落在 persist.ts。
 */
import { reactive, watch } from "vue";
import { defaultPersistedState, persistState, restorePersistedState } from "@/stores/persist";
import type { PlayerLoop, PlayerOrder } from "@/types/config";
import { pickNumber } from "@/utils/pick";

export interface AppState {
  /* ——— 运行期状态（永不持久化） ——— */
  /** 壁纸是否加载完成（加载幕布据此退场） */
  wallpaperReady: boolean;
  /** 播放器是否正在播放 */
  playerPlaying: boolean;
  /** 当前歌词行 */
  lyric: string;
  /** 歌单是否就绪 */
  playlistReady: boolean;
  /** 一言与音乐面板的切换（同一卡片位置） */
  musicPanelOpen: boolean;
  /** 浮层开关 */
  settingsOpen: boolean;
  infoOpen: boolean;
  playlistOpen: boolean;
  /** 壁纸展示模式 */
  showcaseMode: boolean;
  /** 指针是否正压在站点链接网格上（只驱动背景虚化，不持久化） */
  linkHovered: boolean;

  /* ——— 用户偏好（持久化） ——— */
  /** 壁纸源 id，对应 wallpaperConfig.sources */
  wallpaperId: string;
  showSiteAge: boolean;
  playerVolume: number;
  playerLyrics: boolean;
  footerBackdrop: boolean;
  playerAutoplay: boolean;
  playerLoop: PlayerLoop;
  playerOrder: PlayerOrder;
  /** 指针压在站点卡片上时是否虚化背景 */
  linkBackdrop: boolean;
}

const RUNTIME_DEFAULTS = {
  wallpaperReady: false,
  playerPlaying: false,
  lyric: "",
  playlistReady: false,
  musicPanelOpen: false,
  settingsOpen: false,
  infoOpen: false,
  playlistOpen: false,
  showcaseMode: false,
  linkHovered: false,
} as const;

export const appState = reactive<AppState>({
  ...RUNTIME_DEFAULTS,
  ...restorePersistedState(defaultPersistedState()),
});

watch(appState, () => persistState(appState), { deep: true });

export const appActions = {
  setWallpaperReady(value: boolean): void {
    appState.wallpaperReady = value;
  },

  setWallpaperId(id: string): void {
    appState.wallpaperId = id;
  },

  setPlaying(value: boolean): void {
    appState.playerPlaying = value;
  },

  setLyric(text: string): void {
    appState.lyric = text;
  },

  setPlaylistReady(value: boolean): void {
    appState.playlistReady = value;
  },

  setLinkHovered(value: boolean): void {
    appState.linkHovered = value;
  },

  setVolume(value: number): void {
    appState.playerVolume = pickNumber(value, appState.playerVolume, 0, 1);
  },

  toggleShowcase(): boolean {
    appState.showcaseMode = !appState.showcaseMode;
    if (appState.showcaseMode) appActions.closePanels();
    return appState.showcaseMode;
  },

  closeShowcase(): void {
    appState.showcaseMode = false;
  },

  openSettings(): void {
    appState.settingsOpen = true;
    appState.infoOpen = false;
  },

  openInfo(): void {
    appState.infoOpen = true;
    appState.settingsOpen = false;
  },

  closePanels(): void {
    appState.settingsOpen = false;
    appState.infoOpen = false;
    appState.playlistOpen = false;
  },

  openPlaylist(): void {
    appState.playlistOpen = true;
  },

  toggleMusicPanel(force?: boolean): void {
    appState.musicPanelOpen = force ?? !appState.musicPanelOpen;
  },
} as const;
