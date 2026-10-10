<script setup lang="ts">
/**
 * M3E Surface —— 色阶容器。
 * panel：壁纸上的半透明浮层（引导页主力表面）
 * card：实色卡片，用于浮层内部再分层
 * sunken：低一层级的凹陷表面
 */
withDefaults(
  defineProps<{
    variant?: "panel" | "card" | "sunken";
    /** 是否随内容自适应高度（默认自适应） */
    block?: boolean;
    /** 语义标签 */
    as?: string;
  }>(),
  { variant: "panel", block: true, as: "div" },
);
</script>

<template>
  <component
    :is="as"
    class="m3-surface"
    :class="[`m3-surface--${variant}`, { 'm3-surface--inline': !block }]"
  >
    <slot />
  </component>
</template>

<style scoped>
.m3-surface {
  border-radius: var(--shape-corner-l);
}

.m3-surface--inline {
  display: inline-flex;
}

.m3-surface--panel {
  background-color: var(--panel-bg);
  border: 1px solid var(--panel-border);
  box-shadow: var(--panel-shadow);
  -webkit-backdrop-filter: blur(var(--panel-blur)) saturate(var(--panel-saturate));
  backdrop-filter: blur(var(--panel-blur)) saturate(var(--panel-saturate));
}

.m3-surface--card {
  background-color: var(--card-bg);
}

.m3-surface--sunken {
  background-color: var(--surface-container-low);
}
</style>
