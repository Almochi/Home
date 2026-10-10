<script setup lang="ts">
/** 时钟与天气：日期、数字时钟（UnidreamLED）、一行天气摘要 */
import { computed } from "vue";
import Icon from "@/components/atoms/Icon.vue";
import { useClock } from "@/composables/useClock";
import { useWeather } from "@/composables/useWeather";
import { weatherConfig } from "@/config/weather";
import { useI18n } from "@/i18n";
import { formatClock, formatDateParts } from "@/utils/format";

const { t, locale } = useI18n();
const { now } = useClock();
const { status, data, icon } = useWeather();

const parts = computed(() => formatDateParts(now.value, locale.value));
const clock = computed(() => formatClock(now.value));

const dateText = computed(() => {
  if (locale.value === "en") {
    return `${parts.value.weekday} · ${parts.value.month}/${parts.value.day}/${parts.value.year}`;
  }
  return `${parts.value.year} 年 ${parts.value.month} 月 ${parts.value.day} 日 ${parts.value.weekday}`;
});

/** 风向 + 风速：风向已是「西北风」这类完整描述，只在缺「风」字时补后缀 */
const windText = computed(() => {
  if (!data.value) return "";
  const { windDirection, windSpeed } = data.value;
  if (!windDirection && !windSpeed) return "";
  const suffix = t("weather.wind.suffix");
  const direction =
    windDirection && suffix && !windDirection.endsWith(suffix)
      ? `${windDirection}${suffix}`
      : windDirection;
  return [direction, windSpeed].filter(Boolean).join(" ");
});

/** 温度已由 api 层格式化（Aurora 是当日区间、Azure 是当前值），组件不再拼单位 */
const temperature = computed(() => data.value?.temperature ?? "");

/** 空气质量：接口只给「优」这类等级，前缀交给 i18n */
const air = computed(() =>
  data.value?.air ? t("weather.air", { level: data.value.air }) : "",
);
</script>

<template>
  <div class="clock-weather">
    <p class="clock-weather__date">{{ dateText }}</p>
    <time class="clock-weather__time" :datetime="now.toISOString()" :aria-label="t('clock.aria', { time: clock })">
      {{ clock }}
    </time>

    <p v-if="weatherConfig.enabled" class="clock-weather__weather" :aria-label="t('weather.title')">
      <template v-if="status === 'ready' && data">
        <Icon :name="icon" class="clock-weather__weather-icon" />
        <span v-if="data.city">{{ data.city }}</span>
        <span>{{ data.condition }}</span>
        <span class="clock-weather__temperature">{{ temperature }}</span>
        <span v-if="windText" class="clock-weather__wind text-truncate">{{ windText }}</span>
        <span v-if="air" class="clock-weather__air text-truncate">{{ air }}</span>
      </template>
      <template v-else-if="status === 'error'">
        <Icon name="warning" class="clock-weather__weather-icon" />
        <span>{{ t("weather.failed") }}</span>
      </template>
      <template v-else>
        <Icon name="cloud" class="clock-weather__weather-icon" />
        <span>{{ t("weather.loading") }}</span>
      </template>
    </p>
  </div>
</template>

<style scoped>
.clock-weather {
  /* 三行网格：日期贴顶、时钟永远居中、天气贴底。
     没有天气行时上下两行各占一半，时钟仍然居中，不会因为缺一行而跑偏。 */
  display: grid;
  flex: 1;
  grid-template-rows: 1fr auto 1fr;
  justify-items: center;
  gap: var(--m3e-space-2);
  text-align: center;
}

.clock-weather__date {
  grid-row: 1;
  align-self: end;
  font: var(--m3e-type-label-large);
  color: var(--on-surface-variant);
}

.clock-weather__time {
  grid-row: 2;
  font-family: var(--font-digital);
  font-size: var(--m3e-size-clock);
  line-height: 1.1;
  letter-spacing: 0.04em;
  color: var(--on-surface);
  font-variant-numeric: tabular-nums;
}

.clock-weather__weather {
  grid-row: 3;
  align-self: start;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--m3e-space-2);
  inline-size: 100%;
  font: var(--m3e-type-body-small);
  color: var(--on-surface-variant);
}

.clock-weather__weather-icon {
  font-size: var(--m3e-icon-size-md);
  color: var(--primary);
}

.clock-weather__temperature {
  font: var(--m3e-type-label-large);
  color: var(--on-surface);
}

.clock-weather__wind,
.clock-weather__air {
  min-inline-size: 0;
}

/* 窄屏只保留「图标 + 地点 + 现象 + 温度」，风向与空气质量让位给可读性 */
@media (max-width: 767px) {
  .clock-weather__wind,
  .clock-weather__air {
    display: none;
  }
}
</style>
