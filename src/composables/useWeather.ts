/**
 * 天气：进页面拉一次，之后按配置间隔刷新；页面隐藏时定时器停摆
 * （复用 useTicker，不再自建 setInterval）。
 *
 * 城市从哪来（定位与回落都发生在这里，组件不自己拼城市名）：
 * - 开了 autoLocate 就先定位一次（src/api/visitorLocation.ts），结果在本次会话里缓存，
 *   不会每 30 分钟重发一次定位请求；
 * - 定位失败、访客在国外或关掉开关，都回落到 weatherConfig.city；
 * - 只认「定位成功」的结果：失败不写缓存，下一个刷新周期还会再试一次。
 *
 * 天气是「锦上添花」——定位失败与天气请求失败都只降级成占位文案，不打断页面。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { fetchVisitorLocation, type VisitorLocation } from "@/api/visitorLocation";
import { fetchWeather, resolveWeatherIcon, type WeatherSnapshot } from "@/api/weather";
import { useTicker } from "@/composables/useTicker";
import { weatherConfig } from "@/config/weather";
import type { AsyncStatus } from "@/types/status";

/** 定位结果在模块级缓存：同一个页面只会定位一次。undefined = 还没成功过 */
let located: VisitorLocation | null | undefined;

export function useWeather() {
  const status = ref<AsyncStatus>("idle");
  const data = ref<WeatherSnapshot | null>(null);
  const icon = computed(() => resolveWeatherIcon(data.value?.iconCode, data.value?.condition));

  let controller: AbortController | null = null;

  async function resolveCity(signal: AbortSignal): Promise<string> {
    if (!weatherConfig.autoLocate) return weatherConfig.city;
    if (located === undefined) {
      const found = await fetchVisitorLocation(weatherConfig, signal);
      if (found) located = found;
    }
    return located?.city || weatherConfig.city;
  }

  async function refresh(): Promise<void> {
    if (!weatherConfig.enabled) return;
    controller?.abort();
    controller = new AbortController();
    status.value = data.value ? "ready" : "loading";
    try {
      const city = await resolveCity(controller.signal);
      const snapshot = await fetchWeather(weatherConfig, city, controller.signal);
      if (!snapshot) return;
      data.value = snapshot;
      status.value = "ready";
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      status.value = "error";
    }
  }

  onMounted(() => void refresh());
  onBeforeUnmount(() => controller?.abort());

  // 定时刷新走共享定时器：页面隐藏时不空转，回到前台立即补一次
  const { now } = useTicker(weatherConfig.refreshMs, weatherConfig.enabled);
  watch(now, () => void refresh());

  return { status, data, icon, refresh };
}
