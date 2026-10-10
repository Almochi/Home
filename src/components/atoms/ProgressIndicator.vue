<script setup lang="ts">
/** M3E LinearProgressIndicator —— 带标签的确定性进度条（时光胶囊使用） */
const props = withDefaults(
  defineProps<{
    /** 0-100 */
    value: number;
    /** 左侧标题 */
    label?: string;
    /** 右侧说明文字（如剩余量） */
    trailing?: string;
    /** 无障碍描述；省略时用 label + 百分比 */
    ariaLabel?: string;
  }>(),
  { label: undefined, trailing: undefined, ariaLabel: undefined },
);

const clamped = () => Math.min(100, Math.max(0, props.value));
</script>

<template>
  <div class="m3-progress">
    <div v-if="label || trailing" class="m3-progress__head">
      <span v-if="label" class="m3-progress__label">{{ label }}</span>
      <span v-if="trailing" class="m3-progress__trailing">{{ trailing }}</span>
    </div>
    <div
      class="m3-progress__track"
      role="progressbar"
      :aria-valuenow="Math.round(clamped())"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="ariaLabel || label"
    >
      <div class="m3-progress__bar" :style="{ inlineSize: `${clamped()}%` }" />
    </div>
  </div>
</template>

<style scoped>
.m3-progress {
  display: flex;
  flex-direction: column;
  gap: var(--m3e-space-2);
  width: 100%;
}

.m3-progress__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--m3e-space-3);
  font: var(--m3e-type-body-small);
  color: var(--on-surface-variant);
}

.m3-progress__label {
  color: var(--on-surface);
  font: var(--m3e-type-label-large);
}

.m3-progress__trailing {
  font-variant-numeric: tabular-nums;
}

.m3-progress__track {
  position: relative;
  width: 100%;
  height: 0.5rem;
  overflow: hidden;
  border-radius: var(--shape-corner-full);
  background-color: color-mix(in oklab, var(--on-surface) 12%, transparent);
}

.m3-progress__bar {
  height: 100%;
  border-radius: var(--shape-corner-full);
  background-color: var(--primary);
  transition: inline-size var(--m3e-duration-long) var(--m3e-easing-emphasized-decelerate);
}
</style>
