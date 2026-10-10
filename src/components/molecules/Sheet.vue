<script setup lang="ts">
/**
 * M3E Sheet —— 侧边栏/底部面板。
 * 桌面从右侧滑入（Dismissible side sheet），窄屏自动改为底部面板；
 * 与 Dialog 共用同一套焦点与键盘行为。
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
  }>(),
  { title: undefined, size: "md" },
);

const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const container = ref<HTMLElement | null>(null);
const active = computed(() => props.open);
const titleId = `m3-sheet-title-${useId()}`;

useOverlay({ container, active, onClose: () => emit("close") });
</script>

<template>
  <Teleport to="body">
    <Transition name="m3-fade">
      <div v-if="open" class="m3-sheet__scrim" @click="emit('close')" />
    </Transition>
    <Transition name="m3-sheet">
      <aside
        v-if="open"
        ref="container"
        class="m3-sheet"
        :class="`m3-sheet--${size}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        tabindex="-1"
      >
        <header class="m3-sheet__header">
          <h2 v-if="title" :id="titleId" class="m3-sheet__title">{{ title }}</h2>
          <IconButton
            icon="close"
            size="small"
            :label="t('app.action.close')"
            @click="emit('close')"
          />
        </header>
        <div class="m3-sheet__body">
          <slot />
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.m3-sheet__scrim {
  position: fixed;
  inset: 0;
  z-index: var(--m3e-z-scrim);
  background-color: color-mix(in oklab, var(--scrim) 56%, transparent);
}

.m3-sheet {
  position: fixed;
  z-index: var(--m3e-z-sheet);
  inset-block: 0;
  inset-inline-end: 0;
  display: flex;
  flex-direction: column;
  inline-size: min(26rem, 100vw);
  border-start-start-radius: var(--shape-corner-xl);
  border-end-start-radius: var(--shape-corner-xl);
  background-color: var(--panel-bg-strong);
  border: 1px solid var(--panel-border);
  box-shadow: var(--m3e-elevation-4);
  -webkit-backdrop-filter: blur(var(--panel-blur)) saturate(var(--panel-saturate));
  backdrop-filter: blur(var(--panel-blur)) saturate(var(--panel-saturate));
  overflow: hidden;
}

.m3-sheet--sm {
  inline-size: min(22rem, 100vw);
}

.m3-sheet--lg {
  inline-size: min(32rem, 100vw);
}

.m3-sheet__header {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-3);
  padding: var(--m3e-space-4) var(--m3e-space-4) var(--m3e-space-3) var(--m3e-space-6);
  flex: none;
}

.m3-sheet__title {
  flex: 1;
  min-inline-size: 0;
  font: var(--m3e-type-title-large);
}

.m3-sheet__body {
  flex: 1;
  min-block-size: 0;
  overflow-y: auto;
  padding: 0 var(--m3e-space-5) var(--m3e-space-6);
}

/* 底部面板形态 */
@media (max-width: 767px) {
  .m3-sheet {
    inset-block: auto 0;
    inset-inline: 0;
    inline-size: 100%;
    max-block-size: 88dvh;
    border-radius: var(--shape-corner-xl) var(--shape-corner-xl) 0 0;
  }

  .m3-sheet--sm,
  .m3-sheet--lg {
    inline-size: 100%;
  }
}

.m3-sheet-enter-active,
.m3-sheet-leave-active {
  transition: transform var(--m3e-duration-long) var(--m3e-easing-emphasized-decelerate);
}

.m3-sheet-enter-from,
.m3-sheet-leave-to {
  transform: translateX(100%);
}

@media (max-width: 767px) {
  .m3-sheet-enter-from,
  .m3-sheet-leave-to {
    transform: translateY(100%);
  }
}
</style>
