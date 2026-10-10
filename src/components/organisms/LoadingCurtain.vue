<script setup lang="ts">
/**
 * 加载幕布：壁纸就绪后退场。
 * 保留一个最小展示时长，避免「一闪而过」；「减少动效」下由全局规则压平过渡。
 */
import { onMounted, ref, watch } from "vue";
import LoadingIndicator from "@/components/atoms/LoadingIndicator.vue";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/i18n";
import { appState } from "@/stores/app";

const MIN_VISIBLE_MS = 420;

const { t } = useI18n();
const visible = ref(true);
const mountedAt = ref(0);

onMounted(() => {
  mountedAt.value = Date.now();
  if (appState.wallpaperReady) dismiss();
});

watch(
  () => appState.wallpaperReady,
  (ready) => {
    if (ready) dismiss();
  },
);

function dismiss(): void {
  const elapsed = Date.now() - mountedAt.value;
  const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);
  window.setTimeout(() => {
    visible.value = false;
  }, delay);
}
</script>

<template>
  <Transition name="m3-curtain">
    <div v-if="visible" class="loading-curtain" role="status" aria-live="polite">
      <LoadingIndicator contained :size="52" :label="t('app.loading')" />
      <p class="loading-curtain__name">{{ siteConfig.name }}</p>
      <p class="loading-curtain__tip">{{ t("app.loading") }}</p>
    </div>
  </Transition>
</template>

<style scoped>
.loading-curtain {
  position: fixed;
  inset: 0;
  z-index: var(--m3e-z-curtain);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--m3e-space-4);
  background-color: var(--page-bg);
}

.loading-curtain__name {
  font-family: var(--font-display);
  font-size: var(--m3e-type-headline-medium);
  color: var(--on-surface);
}

.loading-curtain__tip {
  font: var(--m3e-type-body-medium);
  color: var(--on-surface-variant);
}

.m3-curtain-leave-active {
  transition:
    opacity var(--m3e-duration-long) var(--m3e-easing-emphasized-accelerate),
    transform var(--m3e-duration-long) var(--m3e-easing-emphasized-accelerate);
}

.m3-curtain-leave-to {
  opacity: 0;
  transform: scale(1.02);
}
</style>
