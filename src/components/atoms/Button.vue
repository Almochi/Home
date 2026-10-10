<script setup lang="ts">
/**
 * M3E Button —— 官方五种变体 + 站点形状契约（默认 12px）
 *
 * filled：主操作（primary + on-primary）
 * tonal：次级操作（secondary-container）
 * elevated：需要浮起的中性操作
 * outlined：与背景同层，靠描边区分
 * text：最低强调度，放在面板内联使用
 */
import Icon from "@/components/atoms/Icon.vue";

withDefaults(
  defineProps<{
    variant?: "filled" | "tonal" | "elevated" | "outlined" | "text";
    size?: "small" | "medium";
    /** 前置图标名 */
    icon?: string;
    /** 提供 href 时渲染为 <a>，保留原生语义 */
    href?: string;
    target?: string;
    rel?: string;
    disabled?: boolean;
    /** 拉满父容器宽度 */
    block?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "filled",
    size: "small",
    icon: undefined,
    href: undefined,
    target: undefined,
    rel: undefined,
    disabled: false,
    block: false,
    type: "button",
  },
);
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    class="m3-button m3-state-layer"
    :class="[`m3-button--${variant}`, `m3-button--${size}`, { 'm3-button--block': block }]"
    :href="href"
    :target="target"
    :rel="rel"
    :type="href ? undefined : type"
    :disabled="href ? undefined : disabled"
    :aria-disabled="href && disabled ? 'true' : undefined"
  >
    <Icon v-if="icon" :name="icon" class="m3-button__icon" />
    <span class="m3-button__label"><slot /></span>
  </component>
</template>

<style scoped>
.m3-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--m3e-space-2);
  height: calc(2.5rem + var(--m3e-density) * 4px);
  padding: 0 var(--m3e-space-6);
  border: 1px solid transparent;
  border-radius: var(--shape-corner-m);
  font: var(--m3e-type-label-large);
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  flex: none;
  --m3e-state-color: var(--primary);
  box-shadow: var(--m3e-elevation-0);
  transition:
    box-shadow var(--m3e-duration-short) var(--m3e-easing-standard),
    background-color var(--m3e-duration-short) var(--m3e-easing-standard);
}

.m3-button__icon {
  font-size: var(--m3e-icon-size-lg);
}

.m3-button--small {
  height: calc(2.25rem + var(--m3e-density) * 4px);
  padding: 0 var(--m3e-space-4);
}

.m3-button--block {
  width: 100%;
}

.m3-button--filled {
  background-color: var(--primary);
  color: var(--on-primary);
  --m3e-state-color: var(--on-primary);
}

.m3-button--filled:hover {
  box-shadow: var(--m3e-elevation-1);
}

.m3-button--tonal {
  background-color: var(--secondary-container);
  color: var(--on-secondary-container);
  --m3e-state-color: var(--on-secondary-container);
}

.m3-button--tonal:hover {
  box-shadow: var(--m3e-elevation-1);
}

.m3-button--elevated {
  background-color: var(--btn-regular-bg);
  color: var(--primary);
  box-shadow: var(--m3e-elevation-1);
}

.m3-button--elevated:hover {
  background-color: var(--btn-regular-bg-hover);
  box-shadow: var(--m3e-elevation-2);
}

.m3-button--outlined {
  border-color: var(--outline);
  color: var(--primary);
}

.m3-button--text {
  padding: 0 var(--m3e-space-3);
  color: var(--primary);
}
</style>
