/**
 * 播放器门面 usePlayer（模块级单例）
 *
 * 设计要点：
 * - 用原生 Audio 而不是引入播放器库：歌词、循环、随机、音量、MediaSession 全部可控，
 *   样式也完全走设计令牌，不再需要一堆 :deep() 覆盖；
 * - 引擎由 <MusicEngine> 挂载，只要它还在，切换浮层 / 重绘不会打断播放；
 * - 歌单只在有明确意图时拉取（打开播放器 / 点播放 / 用户显式开启自动播放），失败可重试；
 *   首屏不碰第三方接口 —— 没打算听歌的人不该为此买单；
 * - 歌词按曲目 token 防止竞态覆盖；
 * - 本文件只负责状态机与音频元素，歌词与系统媒体控制分别在 lyrics.ts / mediaSession.ts。
 */
import { computed, ref, shallowRef } from "vue";
import { fetchPlaylist, type Track } from "@/api/music";
import { musicConfig } from "@/config/music";
import { t } from "@/i18n";
import { findLyricIndex, type LyricLine, loadLyricLines } from "@/player/lyrics";
import { bindMediaSession, clearMediaSession } from "@/player/mediaSession";
import { appActions, appState } from "@/stores/app";
import { notify, notifyError } from "@/stores/snackbar";
import type { AsyncStatus } from "@/types/status";

const playlist = ref<Track[]>([]);
const status = ref<AsyncStatus>("idle");
const index = ref(0);
const currentTime = ref(0);
const duration = ref(0);
const lyricLines = shallowRef<LyricLine[]>([]);
const lyricIndex = ref(-1);

let audio: HTMLAudioElement | null = null;
let controller: AbortController | null = null;
/** 歌词竞态令牌：切歌后旧请求的返回值必须丢弃 */
let lyricToken = 0;

const current = computed<Track | null>(() => playlist.value[index.value] ?? null);
const hasTracks = computed(() => playlist.value.length > 0);
const progress = computed(() => (duration.value > 0 ? currentTime.value / duration.value : 0));

/* -------------------------------------------------------------------------- */
/* 音频元素                                                                    */
/* -------------------------------------------------------------------------- */

function handleTimeUpdate(): void {
  if (!audio) return;
  currentTime.value = audio.currentTime;
  const next = findLyricIndex(lyricLines.value, audio.currentTime);
  if (next === lyricIndex.value) return;
  lyricIndex.value = next;
  if (lyricLines.value.length === 0) return;
  appActions.setLyric(lyricLines.value[next]?.text ?? "");
}

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio;
  const element = new Audio();
  element.preload = "metadata";
  element.volume = appState.playerVolume;
  element.loop = appState.playerLoop === "one";
  element.addEventListener("play", () => appActions.setPlaying(true));
  element.addEventListener("pause", () => appActions.setPlaying(false));
  element.addEventListener("loadedmetadata", () => {
    duration.value = Number.isFinite(element.duration) ? element.duration : 0;
  });
  element.addEventListener("timeupdate", handleTimeUpdate);
  element.addEventListener("ended", () => next({ auto: true }));
  element.addEventListener("error", () => {
    if (!element.src) return;
    notifyError(playlist.value.length > 1 ? t("music.play.failed.next") : t("music.play.failed"));
    if (playlist.value.length > 1) next({ auto: true });
    else appActions.setPlaying(false);
  });
  audio = element;
  return element;
}

async function resume(): Promise<void> {
  const element = ensureAudio();
  try {
    await element.play();
  } catch {
    appActions.setPlaying(false);
  }
}

function pause(): void {
  audio?.pause();
}

/* -------------------------------------------------------------------------- */
/* 歌词                                                                        */
/* -------------------------------------------------------------------------- */

async function loadLyrics(track: Track): Promise<void> {
  lyricToken += 1;
  const token = lyricToken;
  lyricLines.value = [];
  lyricIndex.value = -1;

  if (!track.lrc) {
    appActions.setLyric(t("music.lyric.unavailable"));
    return;
  }
  appActions.setLyric(t("music.lyric.loading"));

  const lines = await loadLyricLines(track, musicConfig.timeoutMs);
  if (token !== lyricToken) return;

  lyricLines.value = lines;
  appActions.setLyric(lines[0]?.text ?? t("music.lyric.unavailable"));
}

/* -------------------------------------------------------------------------- */
/* 播放控制                                                                    */
/* -------------------------------------------------------------------------- */

function randomIndex(length: number): number {
  if (length <= 1) return 0;
  let next = index.value;
  while (next === index.value) next = Math.floor(Math.random() * length);
  return next;
}

async function playAt(target: number, options: { notifyBlocked?: boolean } = {}): Promise<void> {
  const length = playlist.value.length;
  if (length === 0) return;

  const nextIndex = ((target % length) + length) % length;
  index.value = nextIndex;
  const track = playlist.value[nextIndex];
  const element = ensureAudio();

  element.src = track.url;
  currentTime.value = 0;
  duration.value = 0;
  bindMediaSession(track, {
    play: () => void resume(),
    pause,
    next: () => next(),
    previous: prev,
  });
  void loadLyrics(track);

  try {
    await element.play();
  } catch {
    appActions.setPlaying(false);
    if (options.notifyBlocked) {
      notify(t("music.autoplay.blocked"), { icon: "info", duration: 4000 });
    }
  }
}

/**
 * 播放 / 暂停。歌单还没加载时先加载：点播放本身就是「意图」，
 * 所以首屏（没有任何操作）不会产生任何请求。
 */
async function toggle(): Promise<void> {
  if (playlist.value.length === 0) {
    await ensurePlaylist();
    if (playlist.value.length === 0) return;
    if (!appState.playerPlaying) await playAt(0, { notifyBlocked: true });
    return;
  }
  if (!audio || audio.paused) void resume();
  else pause();
}

function next(options: { auto?: boolean } = {}): void {
  const length = playlist.value.length;
  if (length === 0) return;

  const isLast = index.value === length - 1;
  if (options.auto && appState.playerOrder === "list" && appState.playerLoop === "none" && isLast) {
    appActions.setPlaying(false);
    return;
  }

  const target =
    appState.playerOrder === "random"
      ? randomIndex(length)
      : index.value >= length - 1
        ? 0
        : index.value + 1;
  void playAt(target);
}

function prev(): void {
  const length = playlist.value.length;
  if (length === 0) return;
  const target =
    appState.playerOrder === "random"
      ? randomIndex(length)
      : index.value <= 0
        ? length - 1
        : index.value - 1;
  void playAt(target);
}

function seek(seconds: number): void {
  if (!audio) return;
  const clamped = Math.min(Math.max(seconds, 0), duration.value || seconds);
  audio.currentTime = clamped;
  currentTime.value = clamped;
}

/* -------------------------------------------------------------------------- */
/* 生命周期                                                                    */
/* -------------------------------------------------------------------------- */

/** 拉取歌单（幂等，失败后可再次调用重试） */
async function ensurePlaylist(): Promise<void> {
  if (!musicConfig.enabled) return;
  if (status.value === "ready" || status.value === "loading") return;

  status.value = "loading";
  controller?.abort();
  controller = new AbortController();
  try {
    const tracks = await fetchPlaylist(musicConfig, controller.signal);
    if (tracks.length === 0) {
      status.value = "error";
      notifyError(t("music.empty"));
      return;
    }
    playlist.value = tracks;
    appActions.setPlaylistReady(true);
    status.value = "ready";
    if (appState.playerAutoplay) {
      await playAt(0);
    }
  } catch (error) {
    if ((error as Error).name === "AbortError") return;
    status.value = "error";
    notifyError(t("music.load.failed"));
  }
}

/** 把偏好（音量 / 循环）同步到音频元素；由 <MusicEngine> 监听 appState 后调用 */
function syncPreferences(): void {
  if (!audio) return;
  audio.volume = appState.playerVolume;
  audio.loop = appState.playerLoop === "one";
}

/** 组件卸载时释放音频与在途请求 */
function dispose(): void {
  controller?.abort();
  controller = null;
  audio?.pause();
  if (audio) audio.src = "";
  audio = null;
  clearMediaSession();
}

export function usePlayer() {
  return {
    playlist,
    status,
    index,
    current,
    currentTime,
    duration,
    progress,
    lyricLines,
    lyricIndex,
    hasTracks,
    ensurePlaylist,
    playAt: (trackIndex: number) => void playAt(trackIndex),
    resume,
    pause,
    toggle,
    next,
    prev,
    seek,
    syncPreferences,
    dispose,
  };
}
