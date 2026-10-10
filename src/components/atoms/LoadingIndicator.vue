<script setup lang="ts">
/**
 * M3E LoadingIndicator —— 官方 CircularProgressIndicator 的确定性/不确定态。
 * 用两条 arc 的旋转与伸缩表达「正在加载」，时长与曲线取自动效令牌，
 * 「减少动效」下由全局规则压平为静态图形。
 */
withDefaults(
  defineProps<{
    /** 直径（px） */
    size?: number;
    /** 带主色容器（用于加载幕布等大面积场景） */
    contained?: boolean;
    /** 无障碍名称 */
    label?: string;
  }>(),
  { size: 40, contained: false, label: undefined },
);
</script>

<template>
  <span
    class="m3-loading"
    :class="{ 'm3-loading--contained': contained }"
    :style="{ '--m3-loading-size': `${size}px` }"
    role="progressbar"
    :aria-label="label"
  >
    <svg class="m3-loading__svg" viewBox="0 0 48 48" aria-hidden="true">
      <circle class="m3-loading__track" cx="24" cy="24" r="18" />
      <circle class="m3-loading__arc" cx="24" cy="24" r="18" />
    </svg>
  </span>
</template>

<style scoped>
.m3-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--m3-loading-size);
  block-size: var(--m3-loading-size);
  flex: none;
}

.m3-loading--contained {
  border-radius: var(--shape-corner-full);
  background-color: var(--primary-container);
  color: var(--on-primary-container);
}

.m3-loading__svg {
  inline-size: 100%;
  block-size: 100%;
  animation: m3-loading-rotate var(--m3e-duration-ambient-medium) var(--m3e-easing-linear) infinite;
}

.m3-loading__track,
.m3-loading__arc {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
}

.m3-loading__track {
  stroke: color-mix(in oklab, currentColor 16%, transparent);
}

.m3-loading__arc {
  stroke: var(--primary);
  stroke-dasharray: 30 100;
  transform-origin: 50% 50%;
  animation: m3-loading-dash var(--m3e-duration-ambient-short) var(--m3e-easing-standard) infinite;
}

.m3-loading--contained .m3-loading__arc {
  stroke: var(--on-primary-container);
}

@keyframes m3-loading-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes m3-loading-dash {
  0% {
    stroke-dasharray: 4 100;
  }
  50% {
    stroke-dasharray: 42 100;
  }
  100% {
    stroke-dasharray: 4 100;
  }
}
</style>
