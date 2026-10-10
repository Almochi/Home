<script setup lang="ts">
/**
 * 提示条宿主（全站唯一，挂在 App 根部）
 *
 * 由原来的两个原子（Snackbar + SnackbarHost）合并而来：条目只在这里渲染一次，
 * 队列与超时在 stores/snackbar，宿主只负责 Teleport、过渡与操作回调。
 * 放在 molecules 是因为它消费全局 store（原子层只允许无状态展示）。
 */
import Icon from "@/components/atoms/Icon.vue";
import { useI18n } from "@/i18n";
import { dismiss, snackbarItems } from "@/stores/snackbar";

const { t } = useI18n();

function runAction(item: { action?: { onAction?: () => void } }, id: number): void {
  item.action?.onAction?.();
  dismiss(id);
}
</script>

<template>
  <Teleport to="body">
    <div class="snackbar-host" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="m3-fade-up">
        <div
          v-for="item in snackbarItems"
          :key="item.id"
          class="snackbar-host__item"
          :class="`snackbar-host__item--${item.variant}`"
          role="status"
        >
          <Icon v-if="item.icon" :name="item.icon" class="snackbar-host__item__icon" />
          <span class="snackbar-host__item__message">{{ item.message }}</span>
          <button
            v-if="item.action"
            class="snackbar-host__item__action"
            type="button"
            @click="runAction(item, item.id)"
          >
            {{ item.action.label }}
          </button>
          <button
            class="snackbar-host__item__close"
            type="button"
            :aria-label="t('snackbar.close')"
            @click="dismiss(item.id)"
          >
            <Icon name="close" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.snackbar-host {
  position: fixed;
  z-index: var(--m3e-z-snackbar);
  inset-block-end: var(--m3e-space-6);
  inset-inline-start: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--m3e-space-2);
  inline-size: min(28rem, calc(100vw - var(--m3e-space-8)));
  transform: translateX(-50%);
  pointer-events: none;
}

.snackbar-host__item {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-3);
  inline-size: 100%;
  min-block-size: 3rem;
  padding: var(--m3e-space-2) var(--m3e-space-2) var(--m3e-space-2) var(--m3e-space-4);
  border-radius: var(--shape-corner-xs);
  background-color: var(--inverse-surface);
  color: var(--inverse-on-surface);
  font: var(--m3e-type-body-medium);
  box-shadow: var(--m3e-elevation-3);
  pointer-events: auto;
}

.snackbar-host__item__icon {
  font-size: var(--m3e-icon-size-xl);
  color: var(--inverse-primary);
}

.snackbar-host__item--error .snackbar-host__item__icon {
  color: var(--error);
}

.snackbar-host__item__message {
  flex: 1;
  min-inline-size: 0;
}

.snackbar-host__item__action {
  padding: var(--m3e-space-1) var(--m3e-space-3);
  border: 0;
  border-radius: var(--shape-corner-full);
  background-color: transparent;
  color: var(--inverse-primary);
  font: var(--m3e-type-label-large);
  cursor: pointer;
  flex: none;
}

.snackbar-host__item__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 2rem;
  block-size: 2rem;
  padding: 0;
  border: 0;
  border-radius: var(--shape-corner-full);
  background-color: transparent;
  color: var(--inverse-on-surface);
  font-size: var(--m3e-icon-size-lg);
  cursor: pointer;
  opacity: 0.75;
  flex: none;
}

.snackbar-host__item__close:hover,
.snackbar-host__item__action:hover {
  background-color: color-mix(in oklab, var(--inverse-on-surface) 12%, transparent);
}

@media (max-width: 767px) {
  .snackbar-host {
    inset-block-end: var(--m3e-space-4);
    inset-inline-start: var(--m3e-space-4);
    inline-size: calc(100vw - var(--m3e-space-8));
    transform: none;
  }
}
</style>
