<script setup lang="ts">
/** M3E Chip —— 标签 / 筛选胶囊。胶囊圆角是它的语义，不参与站点形状契约。 */
import Icon from "@/components/atoms/Icon.vue";

withDefaults(
  defineProps<{
    icon?: string;
    /** 可选中的筛选 chip */
    selected?: boolean;
    /** 是否可交互（否则渲染为纯展示标签） */
    interactive?: boolean;
    href?: string;
    label?: string;
  }>(),
  { icon: undefined, selected: false, interactive: false, href: undefined, label: undefined },
);
</script>

<template>
  <component
    :is="href ? 'a' : interactive ? 'button' : 'span'"
    class="m3-chip"
    :class="{ 'm3-state-layer': interactive || href, 'm3-chip--selected': selected }"
    :type="interactive && !href ? 'button' : undefined"
    :href="href"
    :aria-pressed="interactive ? selected : undefined"
  >
    <Icon v-if="icon" :name="icon" class="m3-chip__icon" />
    <span class="m3-chip__label"><slot>{{ label }}</slot></span>
  </component>
</template>

<style scoped>
.m3-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--m3e-space-2);
  height: 2rem;
  padding: 0 var(--m3e-space-3);
  border: 1px solid var(--outline-variant);
  border-radius: var(--shape-corner-full);
  background-color: transparent;
  color: var(--on-surface-variant);
  font: var(--m3e-type-label-large);
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
}

.m3-chip__icon {
  font-size: var(--m3e-icon-size-lg);
}

.m3-chip--selected {
  background-color: var(--secondary-container);
  border-color: transparent;
  color: var(--on-secondary-container);
  --m3e-state-color: var(--on-secondary-container);
}

span.m3-chip {
  cursor: default;
}
</style>
