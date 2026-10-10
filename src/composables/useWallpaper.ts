/**
 * 壁纸：解析地址 → 预加载（带超时）→ 失败回落本地 → 触发取色。
 * 组件只负责画图，所有状态机都在这里。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { features } from "@/config/features";
import { wallpaperConfig } from "@/config/wallpaper";
import { t } from "@/i18n";
import { appActions, appState } from "@/stores/app";
import { notify, notifyError } from "@/stores/snackbar";
import { setWallpaperHue } from "@/theme";
import { extractWallpaperHue } from "@/theme/wallpaperHue";
import type { WallpaperContext, WallpaperSource } from "@/types/config";
import type { AsyncStatus } from "@/types/status";

const DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function sourceOf(id: string): WallpaperSource {
  return wallpaperConfig.sources.find((source) => source.id === id) ?? wallpaperConfig.sources[0];
}

/** 每次加载只生成一次上下文：src 与 srcset 必须来自同一份随机值 / 时间戳 */
function buildContext(): WallpaperContext {
  return {
    random: Math.floor(Math.random() * wallpaperConfig.localCount) + 1,
    stamp: Date.now(),
    day: DAY_FORMAT.format(new Date()).replaceAll("-", ""),
  };
}

/** 预加载：onload / onerror / 超时三选一先到先得 */
function preload(url: string, timeoutMs: number): Promise<"ok" | "error"> {
  return new Promise((resolve) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.src = "";
      resolve("error");
    }, timeoutMs);
    image.onload = () => {
      window.clearTimeout(timer);
      resolve("ok");
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      resolve("error");
    };
    image.src = url;
  });
}

export function useWallpaper() {
  const url = ref<string | null>(null);
  /** 多分辨率清单（仅自托管插画提供），交给 img 的 srcset */
  const srcset = ref<string | undefined>(undefined);
  const status = ref<AsyncStatus>("idle");
  const activeId = ref(appState.wallpaperId);
  const source = computed(() => sourceOf(activeId.value));
  const canDownload = computed(() => source.value.downloadable);

  let token = 0;

  async function apply(nextId: string, allowFallback = true): Promise<void> {
    token += 1;
    const current = token;
    const target = sourceOf(nextId);
    activeId.value = target.id;
    status.value = "loading";

    const context = buildContext();
    const candidate = target.resolve(context);
    const candidateSet = target.srcset?.(context);
    const result = await preload(candidate, wallpaperConfig.timeoutMs);
    if (current !== token) return;

    if (result === "ok") {
      url.value = candidate;
      srcset.value = candidateSet;
      status.value = "ready";
      appActions.setWallpaperReady(true);
      void updateSeedHue(candidate);
      return;
    }

    if (allowFallback && target.id !== wallpaperConfig.defaultId) {
      notifyError(t("settings.wallpaper.failed"));
      await apply(wallpaperConfig.defaultId, false);
      return;
    }

    // 连本地壁纸都失败：直接进入站点，避免加载幕布永不退场
    url.value = candidate;
    srcset.value = candidateSet;
    status.value = "error";
    appActions.setWallpaperReady(true);
  }

  async function updateSeedHue(imageUrl: string): Promise<void> {
    if (!features.wallpaperAutoTheme) return;
    const hue = await extractWallpaperHue(imageUrl);
    setWallpaperHue(hue);
  }

  watch(
    () => appState.wallpaperId,
    (next, previous) => {
      if (next === previous) return;
      void apply(next);
      if (previous) notify(t("settings.wallpaper.changed"));
    },
  );

  onMounted(() => void apply(appState.wallpaperId));
  onBeforeUnmount(() => {
    token += 1;
  });

  return { url, srcset, status, source, canDownload, apply };
}
