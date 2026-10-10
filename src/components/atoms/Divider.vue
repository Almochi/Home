<script setup lang="ts">
/** M3E Divider —— 1px 分隔线，只取 outline-variant */
withDefaults(defineProps<{ vertical?: boolean; inset?: boolean }>(), {
  vertical: false,
  inset: false,
});
</script>

<template>
  <hr
    class="m3-divider"
    :class="{ 'm3-divider--vertical': vertical, 'm3-divider--inset': inset }"
    aria-hidden="true"
  />
</template>

<style scoped>
.m3-divider {
  border: 0;
  margin: 0;
  background-color: var(--line-divider);
  flex: none;
}

.m3-divider:not(.m3-divider--vertical) {
  height: 1px;
  width: 100%;
}

.m3-divider--vertical {
  width: 1px;
  height: 100%;
  min-height: 1rem;
}

.m3-divider--inset {
  margin-inline: var(--m3e-space-4);
}
</style>
