<script setup lang="ts">
/**
 * M3E Switch —— 开关。
 * 原生 button + role="switch"：键盘（Space/Enter）、读屏、禁用态全部由浏览器保证。
 */
import Icon from "@/components/atoms/Icon.vue";

withDefaults(
  defineProps<{
    modelValue: boolean;
    /** 无障碍名称 */
    label: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

defineEmits<{ "update:modelValue": [boolean] }>();
</script>

<template>
  <button
    class="m3-switch"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label"
    :disabled="disabled"
    :class="{ 'm3-switch--on': modelValue }"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="m3-switch__track">
      <span class="m3-switch__handle">
        <Icon v-if="modelValue" name="check" class="m3-switch__check" />
      </span>
    </span>
  </button>
</template>

<style scoped>
.m3-switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 2px solid var(--outline);
  border-radius: var(--shape-corner-full);
  background-color: var(--surface-container-highest);
  cursor: pointer;
  flex: none;
  transition:
    background-color var(--m3e-duration-short) var(--m3e-easing-standard),
    border-color var(--m3e-duration-short) var(--m3e-easing-standard);
}

.m3-switch__track {
  position: relative;
  display: block;
  inline-size: 3.25rem;
  block-size: 2rem;
}

.m3-switch__handle {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 1rem;
  block-size: 1rem;
  border-radius: var(--shape-corner-full);
  background-color: var(--outline);
  color: var(--on-primary);
  transform: translateY(-50%);
  transition:
    inline-size var(--m3e-duration-short) var(--m3e-easing-emphasized),
    inset-inline-start var(--m3e-duration-short) var(--m3e-easing-emphasized),
    background-color var(--m3e-duration-short) var(--m3e-easing-standard);
}

.m3-switch__check {
  font-size: var(--m3e-icon-size-xs);
  opacity: 0;
  transition: opacity var(--m3e-duration-short) var(--m3e-easing-standard);
}

.m3-switch--on {
  border-color: var(--primary);
  background-color: var(--primary);
}

.m3-switch--on .m3-switch__handle {
  inset-inline-start: 1.625rem;
  inline-size: 1.5rem;
  block-size: 1.5rem;
  background-color: var(--on-primary);
}

.m3-switch--on .m3-switch__check {
  opacity: 1;
  color: var(--primary);
}

.m3-switch:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.m3-switch:disabled {
  opacity: 0.38;
  pointer-events: none;
}
</style>
