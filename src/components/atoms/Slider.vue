<script setup lang="ts">
/**
 * M3E Slider —— 基于原生 input[type=range]：
 * 键盘（方向键/Home/End）、读屏、长按拖动全部由浏览器保证，样式完全走令牌。
 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
    /** 无障碍名称 */
    label: string;
    /** 展示用的值格式化 */
    format?: (value: number) => string;
    disabled?: boolean;
  }>(),
  { min: 0, max: 100, step: 1, format: undefined, disabled: false },
);

defineEmits<{ "update:modelValue": [number] }>();

const progress = computed(() => {
  const span = props.max - props.min;
  if (span <= 0) return 0;
  return ((props.modelValue - props.min) / span) * 100;
});
</script>

<template>
  <input
    class="m3-slider"
    type="range"
    :min="min"
    :max="max"
    :step="step"
    :value="modelValue"
    :disabled="disabled"
    :aria-label="label"
    :aria-valuetext="format ? format(modelValue) : undefined"
    :style="{ '--m3-slider-progress': `${progress}%` }"
    @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
  />
</template>

<style scoped>
.m3-slider {
  appearance: none;
  -webkit-appearance: none;
  inline-size: 100%;
  block-size: 1.75rem;
  background: transparent;
  cursor: pointer;
}

.m3-slider:disabled {
  opacity: 0.38;
  pointer-events: none;
}

.m3-slider::-webkit-slider-runnable-track {
  block-size: 0.5rem;
  border-radius: var(--shape-corner-full);
  background: linear-gradient(
    to right,
    var(--primary) 0 var(--m3-slider-progress),
    color-mix(in oklab, var(--on-surface) 16%, transparent) var(--m3-slider-progress) 100%
  );
}

.m3-slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  inline-size: 1.125rem;
  block-size: 1.125rem;
  margin-block-start: -0.3125rem;
  border: none;
  border-radius: var(--shape-corner-full);
  background-color: var(--primary);
  box-shadow: var(--m3e-elevation-1);
  transition: transform var(--m3e-duration-short) var(--m3e-easing-standard);
}

.m3-slider:hover::-webkit-slider-thumb,
.m3-slider:focus-visible::-webkit-slider-thumb {
  transform: scale(1.15);
}

.m3-slider::-moz-range-track {
  block-size: 0.5rem;
  border-radius: var(--shape-corner-full);
  background: color-mix(in oklab, var(--on-surface) 16%, transparent);
}

.m3-slider::-moz-range-progress {
  block-size: 0.5rem;
  border-radius: var(--shape-corner-full);
  background-color: var(--primary);
}

.m3-slider::-moz-range-thumb {
  inline-size: 1.125rem;
  block-size: 1.125rem;
  border: none;
  border-radius: var(--shape-corner-full);
  background-color: var(--primary);
}

.m3-slider:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 4px;
  border-radius: var(--shape-corner-full);
}
</style>
