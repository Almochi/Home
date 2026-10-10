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

/** 预加载结果：status 定成败，picked 是浏览器按 srcset 真正下载的那一档（没有 srcset 时等于 url） */
interface PreloadResult {
  status: "ok" | "error";
  picked: string;
}

/**
 * 预加载：onload / onerror / 超时三选一先到先得。
 *
 * srcset 必须一并交给探针，原因有两条：
 * 1. 只按 src 拉起请求时，页面上的 <img> 会复用在途请求而绕过 srcset，多分辨率清单形同虚设；
 * 2. 探针 load 之后的 currentSrc 就是浏览器选中的那一档 —— 取色直接用它，命中同一份缓存，
 *    不会为了算 24×24 的主色再把最大档拉一遍。
 */
function preload(url: string, timeoutMs: number, srcset?: string): Promise<PreloadResult> {
  return new Promise((resolve) => {
    const image = new Image();
    let timer = 0;
    const finish = (status: "ok" | "error"): void => {
      window.clearTimeout(timer);
      resolve({ status, picked: image.currentSrc || url });
    };
    timer = window.setTimeout(() => {
      image.src = "";
      resolve({ status: "error", picked: url });
    }, timeoutMs);
    image.onload = () => finish("ok");
    image.onerror = () => finish("error");
    if (srcset) {
      image.sizes = "100vw";
      image.srcset = srcset;
    }
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
    const result = await preload(candidate, wallpaperConfig.timeoutMs, candidateSet);
    if (current !== token) return;

    if (result.status === "ok") {
      url.value = candidate;
      srcset.value = candidateSet;
      status.value = "ready";
      appActions.setWallpaperReady(true);
      // 取色用浏览器实际选中的那一档：同一份缓存，不会为算主色再下一张最大图
      void updateSeedHue(result.picked);
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
