<script setup lang="ts">
/** 设置项：左标签（可选说明），右控件 */
defineProps<{ label: string; hint?: string; stack?: boolean }>();
</script>

<template>
  <div class="setting-row" :class="{ 'setting-row--stack': stack }">
    <div class="setting-row__text">
      <span class="setting-row__label">{{ label }}</span>
      <span v-if="hint" class="setting-row__hint">{{ hint }}</span>
    </div>
    <div class="setting-row__control">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--m3e-space-4);
  padding-block: var(--m3e-space-3);
  min-block-size: 3rem;
}

.setting-row--stack {
  flex-direction: column;
  align-items: stretch;
  gap: var(--m3e-space-2);
}

.setting-row__text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-inline-size: 0;
}

.setting-row__label {
  font: var(--m3e-type-body-medium);
  color: var(--on-surface);
}

.setting-row__hint {
  font: var(--m3e-type-body-small);
  color: var(--on-surface-variant);
}

.setting-row__control {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-3);
  flex: none;
}

.setting-row--stack .setting-row__control {
  flex: 1;
  min-inline-size: 0;
}
</style>
