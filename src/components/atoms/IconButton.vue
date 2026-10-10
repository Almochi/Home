<script setup lang="ts">
/**
 * M3E IconButton —— 纯图标操作。
 * label 必填：它会成为 aria-label，图标本身对读屏隐藏。
 */
import Icon from "@/components/atoms/Icon.vue";

withDefaults(
  defineProps<{
    /** 图标名 */
    icon: string;
    /** 无障碍名称（必填） */
    label: string;
    variant?: "standard" | "filled" | "tonal" | "outlined";
    size?: "small" | "medium";
    /**
     * 视觉基调：面板内用 surface；直接压在壁纸上时用 wallpaper
     * （固定前景 + 投影，避免浅色模式下深色压深色）
     */
    tone?: "surface" | "wallpaper";
    /** 开关型按钮的选中态 */
    pressed?: boolean;
    disabled?: boolean;
    /** 悬浮时显示的气泡提示 */
    tip?: string;
  }>(),
  {
    variant: "standard",
    size: "medium",
    tone: "surface",
    pressed: undefined,
    disabled: false,
    tip: undefined,
  },
);
</script>

<template>
  <button
    class="m3-icon-button m3-state-layer"
    :class="[`m3-icon-button--${variant}`, `m3-icon-button--${size}`, `m3-icon-button--${tone}`]"
    type="button"
    :aria-label="label"
    :aria-pressed="pressed"
    :title="tip"
    :disabled="disabled"
  >
    <Icon :name="icon" />
  </button>
</template>

<style scoped>
.m3-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(2.5rem + var(--m3e-density) * 4px);
  height: calc(2.5rem + var(--m3e-density) * 4px);
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--shape-corner-full);
  background-color: transparent;
  color: var(--on-surface-variant);
  font-size: var(--m3e-icon-size-xl);
  cursor: pointer;
  flex: none;
}

.m3-icon-button--small {
  width: calc(2rem + var(--m3e-density) * 4px);
  height: calc(2rem + var(--m3e-density) * 4px);
  font-size: var(--m3e-icon-size-lg);
}

.m3-icon-button--wallpaper {
  color: var(--on-wallpaper);
  --m3e-state-color: var(--on-wallpaper);
  filter: drop-shadow(var(--wallpaper-text-shadow-strong));
}

.m3-icon-button--filled {
  background-color: var(--primary);
  color: var(--on-primary);
  --m3e-state-color: var(--on-primary);
}

.m3-icon-button--tonal {
  background-color: var(--secondary-container);
  color: var(--on-secondary-container);
  --m3e-state-color: var(--on-secondary-container);
}

.m3-icon-button--outlined {
  border-color: var(--outline-variant);
  color: var(--on-surface-variant);
}

.m3-icon-button[aria-pressed="true"] {
  background-color: var(--secondary-container);
  color: var(--on-secondary-container);
  --m3e-state-color: var(--on-secondary-container);
}
</style>
