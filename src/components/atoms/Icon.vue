<script setup lang="ts">
/**
 * M3E Icon —— 本地图标原子
 *
 * 图标数据由 scripts/generate-icons.mjs 从 @iconify-json 生成（内联 SVG，无运行时依赖、
 * 无网络请求），统一 currentColor，因此自动跟随 HCT 动态配色。
 * 名称解析顺序：brand（simple-icons）→ material（Material Symbols）；
 * 也可显式写 "ui:mail" / "brand:github" 消歧。
 */
import { computed } from "vue";
import { brandIcons, materialIcons, type IconData } from "@/generated/icons";

const props = withDefaults(
  defineProps<{
    /** 图标名，例如 schedule / github / ui:mail */
    name: string;
    /** 像素尺寸，默认跟随字号（1em） */
    size?: number | string;
  }>(),
  { size: "1em" },
);

const icon = computed<IconData | null>(() => {
  const [prefix, raw] = props.name.includes(":")
    ? (props.name.split(":") as [string, string])
    : ["", props.name];
  if (prefix === "ui") return materialIcons[raw] ?? null;
  if (prefix === "brand") return brandIcons[raw] ?? null;
  return brandIcons[props.name] ?? materialIcons[props.name] ?? null;
});

const dimension = computed(() =>
  typeof props.size === "number" ? `${props.size}px` : props.size,
);
</script>

<template>
  <svg
    v-if="icon"
    class="m3-icon"
    :style="{ width: dimension, height: dimension }"
    :viewBox="`0 0 ${icon.width} ${icon.height}`"
    aria-hidden="true"
    focusable="false"
    v-html="icon.body"
  />
</template>

<style scoped>
.m3-icon {
  display: inline-block;
  flex: none;
  fill: currentColor;
  vertical-align: middle;
}
</style>
