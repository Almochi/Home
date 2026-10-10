<script setup lang="ts">
/**
 * M3E Dialog —— 模态对话框。
 * 焦点陷阱、Esc 关闭、焦点归还、aria-modal 由 useOverlay 统一保证；
 * 圆角取 --shape-corner-xl（浮层形状契约）。
 */
import { computed, ref, useId } from "vue";
import IconButton from "@/components/atoms/IconButton.vue";
import { useOverlay } from "@/composables/useOverlay";
import { useI18n } from "@/i18n";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    size?: "sm" | "md" | "lg";
    /** 无标题时用外部元素作为无障碍名称 */
    labelledBy?: string;
  }>(),
  { title: undefined, size: "md", labelledBy: undefined },
);

const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const container = ref<HTMLElement | null>(null);
const active = computed(() => props.open);
const titleId = `m3-dialog-title-${useId()}`;

useOverlay({ container, active, onClose: () => emit("close") });
</script>

<template>
  <Teleport to="body">
    <Transition name="m3-fade">
      <div v-if="open" class="m3-dialog__scrim" @click="emit('close')" />
    </Transition>
    <Transition name="m3-scale-fade">
      <div
        v-if="open"
        ref="container"
        class="m3-dialog"
        :class="`m3-dialog--${size}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : labelledBy"
        tabindex="-1"
      >
        <header class="m3-dialog__header">
          <h2 v-if="title" :id="titleId" class="m3-dialog__title">{{ title }}</h2>
          <slot name="header" />
          <IconButton
            icon="close"
            size="small"
            :label="t('app.action.close')"
            @click="emit('close')"
          />
        </header>
        <div class="m3-dialog__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="m3-dialog__footer">
          <slot name="footer" />
        </footer>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.m3-dialog__scrim {
  position: fixed;
  inset: 0;
  z-index: var(--m3e-z-scrim);
  background-color: color-mix(in oklab, var(--scrim) 60%, transparent);
  -webkit-backdrop-filter: blur(var(--m3e-space-2));
  backdrop-filter: blur(var(--m3e-space-2));
}

.m3-dialog {
  position: fixed;
  z-index: var(--m3e-z-sheet);
  inset-block-start: 50%;
  inset-inline-start: 50%;
  display: flex;
  flex-direction: column;
  inline-size: min(36rem, calc(100vw - var(--m3e-space-8)));
  max-block-size: min(42rem, calc(100dvh - var(--m3e-space-10)));
  border-radius: var(--shape-corner-xl);
  background-color: var(--panel-bg-strong);
  border: 1px solid var(--panel-border);
  box-shadow: var(--m3e-elevation-4);
  -webkit-backdrop-filter: blur(var(--panel-blur)) saturate(var(--panel-saturate));
  backdrop-filter: blur(var(--panel-blur)) saturate(var(--panel-saturate));
  transform: translate(-50%, -50%);
  overflow: hidden;
}

.m3-dialog--sm {
  inline-size: min(24rem, calc(100vw - var(--m3e-space-8)));
}

.m3-dialog--lg {
  inline-size: min(48rem, calc(100vw - var(--m3e-space-8)));
}

.m3-dialog__header {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-3);
  padding: var(--m3e-space-4) var(--m3e-space-4) var(--m3e-space-4) var(--m3e-space-6);
  flex: none;
}

.m3-dialog__title {
  flex: 1;
  min-inline-size: 0;
  font: var(--m3e-type-title-large);
  color: var(--on-surface);
}

.m3-dialog__body {
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
  padding: 0 var(--m3e-space-6) var(--m3e-space-6);
}

.m3-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--m3e-space-2);
  padding: var(--m3e-space-4) var(--m3e-space-6);
  flex: none;
}
</style>
