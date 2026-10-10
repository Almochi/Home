<script setup lang="ts">
/**
 * M3E Tooltip —— 朴素提示气泡（无依赖实现）。
 * 触发区在 hover / focus 后延迟出现；气泡通过 aria-describedby 关联，读屏可读。
 */
import { onBeforeUnmount, ref, useId } from "vue";

withDefaults(defineProps<{ text: string; placement?: "top" | "bottom" }>(), {
  placement: "top",
});

const visible = ref(false);
const tooltipId = `m3-tooltip-${useId()}`;
let timer = 0;

function show(): void {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    visible.value = true;
  }, 320);
}

function hide(): void {
  window.clearTimeout(timer);
  visible.value = false;
}

onBeforeUnmount(() => window.clearTimeout(timer));
</script>

<template>
  <span
    class="m3-tooltip"
    :aria-describedby="visible ? tooltipId : undefined"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
    @keydown.escape="hide"
  >
    <slot />
    <Transition name="m3-fade">
      <span
        v-if="visible"
        :id="tooltipId"
        class="m3-tooltip__bubble"
        :class="`m3-tooltip__bubble--${placement}`"
        role="tooltip"
      >
        {{ text }}
      </span>
    </Transition>
  </span>
</template>

<style scoped>
.m3-tooltip {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.m3-tooltip__bubble {
  position: absolute;
  z-index: var(--m3e-z-tooltip);
  inset-inline-start: 50%;
  padding: var(--m3e-space-1) var(--m3e-space-2);
  border-radius: var(--shape-corner-xs);
  background-color: var(--inverse-surface);
  color: var(--inverse-on-surface);
  font: var(--m3e-type-body-small);
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
}

.m3-tooltip__bubble--top {
  inset-block-end: calc(100% + var(--m3e-space-2));
}

.m3-tooltip__bubble--bottom {
  inset-block-start: calc(100% + var(--m3e-space-2));
}
</style>
