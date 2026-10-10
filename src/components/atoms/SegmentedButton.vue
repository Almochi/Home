<script setup lang="ts">
/**
 * M3E SegmentedButton —— 单选项组（radiogroup 语义 + roving tabindex）。
 * 键盘：左右/上下方向键切换，Home/End 跳到首尾，与原生 radio 行为一致。
 */
import { ref } from "vue";
import Icon from "@/components/atoms/Icon.vue";

export interface SegmentOption {
  value: string;
  label: string;
  icon?: string;
}

const props = defineProps<{
  modelValue: string;
  options: SegmentOption[];
  /** 无障碍名称 */
  label: string;
  /** 平铺等宽（默认按内容宽度） */
  block?: boolean;
}>();

const emit = defineEmits<{ "update:modelValue": [string] }>();

const buttons = ref<HTMLButtonElement[]>([]);

function select(value: string): void {
  if (value !== props.modelValue) emit("update:modelValue", value);
}

function handleKeydown(event: KeyboardEvent, index: number): void {
  const last = props.options.length - 1;
  let next = index;
  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      next = index >= last ? 0 : index + 1;
      break;
    case "ArrowLeft":
    case "ArrowUp":
      next = index <= 0 ? last : index - 1;
      break;
    case "Home":
      next = 0;
      break;
    case "End":
      next = last;
      break;
    default:
      return;
  }
  event.preventDefault();
  select(props.options[next].value);
  buttons.value[next]?.focus();
}
</script>

<template>
  <div class="m3-segmented" :class="{ 'm3-segmented--block': block }" role="radiogroup" :aria-label="label">
    <button
      v-for="(option, index) in options"
      :key="option.value"
      ref="buttons"
      class="m3-segmented__item m3-state-layer"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      :tabindex="option.value === modelValue ? 0 : -1"
      @click="select(option.value)"
      @keydown="handleKeydown($event, index)"
    >
      <Icon v-if="option.icon" :name="option.icon" class="m3-segmented__icon" />
      <span>{{ option.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.m3-segmented {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid var(--outline);
  border-radius: var(--shape-corner-full);
  overflow: hidden;
}

.m3-segmented--block {
  display: flex;
  inline-size: 100%;
}

.m3-segmented__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--m3e-space-2);
  min-block-size: calc(2.5rem + var(--m3e-density) * 4px);
  padding: 0 var(--m3e-space-4);
  border: 0;
  border-inline-start: 1px solid var(--outline);
  background-color: transparent;
  color: var(--on-surface);
  font: var(--m3e-type-label-large);
  cursor: pointer;
  flex: 1;
  white-space: nowrap;
}

.m3-segmented__item:first-child {
  border-inline-start: 0;
}

.m3-segmented__icon {
  font-size: var(--m3e-icon-size-lg);
}

.m3-segmented__item[aria-checked="true"] {
  background-color: var(--secondary-container);
  color: var(--on-secondary-container);
  --m3e-state-color: var(--on-secondary-container);
}
</style>
