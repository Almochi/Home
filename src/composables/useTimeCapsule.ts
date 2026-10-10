/**
 * 时光胶囊与建站时长：把配置 + 时钟换算成可直接渲染的数据。
 *
 * 粒度是分钟级，因此订阅 30 秒的对齐定时器（useTicker），而不是复用秒级时钟；
 * 两个功能都关闭时连定时器都不订阅（零负担）。
 */
import { computed } from "vue";
import { useTicker } from "@/composables/useTicker";
import { features } from "@/config/features";
import { siteConfig } from "@/config/site";
import { computeSiteAge, computeTimeCapsule, parseStartDate } from "@/utils/capsule";

const REFRESH_MS = 30_000;

export function useTimeCapsule() {
  const active = features.timeCapsule || features.siteStartDate;
  const { now } = useTicker(REFRESH_MS, active);

  const entries = computed(() => (features.timeCapsule ? computeTimeCapsule(now.value) : []));
  const startDate = computed(() =>
    features.siteStartDate ? parseStartDate(siteConfig.startDate) : null,
  );
  const age = computed(() => (startDate.value ? computeSiteAge(startDate.value, now.value) : null));

  return { now, entries, age };
}
