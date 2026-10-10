<script setup lang="ts">
/**
 * 页面骨架：顶栏（站点标识 + 全局操作）、主区（三段式栅格）、页脚。
 * 布局只在这里定义，子组件不关心自己在栅格里的位置。
 */
import { computed } from "vue";
import IconButton from "@/components/atoms/IconButton.vue";
import Tooltip from "@/components/atoms/Tooltip.vue";
import FooterBar from "@/components/organisms/FooterBar.vue";
import { features } from "@/config/features";
import { notify } from "@/stores/snackbar";
import { useI18n } from "@/i18n";
import { themeState, updateTheme } from "@/theme";
import { appActions, appState } from "@/stores/app";

const { t } = useI18n();

const modeLabel = computed(() => {
  const { mode } = themeState.prefs;
  if (mode === "light") return t("settings.appearance.mode.light");
  if (mode === "dark") return t("settings.appearance.mode.dark");
  return t("settings.appearance.mode.auto");
});

const themeIcon = computed(() => {
  const { mode } = themeState.prefs;
  if (mode === "light") return "light-mode";
  if (mode === "dark") return "dark-mode";
  return "brightness-auto";
});

/** 明暗模式循环：跟随系统 → 浅色 → 深色 → 跟随系统 */
function cycleMode(): void {
  const order = ["auto", "light", "dark"] as const;
  const current = order.indexOf(themeState.prefs.mode);
  updateTheme({ mode: order[(current + 1) % order.length] });
}

/** 展示模式：所有面板退场，只留壁纸与下载入口 */
function toggleShowcase(): void {
  const on = appActions.toggleShowcase();
  notify(t(on ? "app.showcase.enter" : "app.showcase.exit"), { icon: "fullscreen", duration: 2400 });
}
</script>

<template>
  <div class="app-shell">
    <a class="app-shell__skip" href="#main">{{ t("a11y.content.skip") }}</a>

    <header class="app-shell__bar">
      <!-- 站点标识只在主区出现一次（h1）；顶栏只承载全局操作 -->
      <div class="app-shell__actions">
        <Tooltip v-if="features.wallpaperShowcase" :text="t('app.action.showcase')">
          <IconButton
            :icon="appState.showcaseMode ? 'fullscreen-exit' : 'fullscreen'"
            :label="appState.showcaseMode ? t('app.action.showcase.exit') : t('app.action.showcase')"
            tone="wallpaper"
            :pressed="appState.showcaseMode"
            @click="toggleShowcase"
          />
        </Tooltip>
        <Tooltip :text="modeLabel">
          <IconButton
            :icon="themeIcon"
            :label="t('a11y.theme.toggle', { mode: modeLabel })"
            tone="wallpaper"
            @click="cycleMode"
          />
        </Tooltip>
        <Tooltip :text="t('panel.info')">
          <IconButton
            icon="info"
            :label="t('a11y.info.open')"
            tone="wallpaper"
            @click="appActions.openInfo()"
          />
        </Tooltip>
        <Tooltip :text="t('app.action.settings')">
          <IconButton
            icon="settings"
            :label="t('a11y.settings.open')"
            tone="wallpaper"
            @click="appActions.openSettings()"
          />
        </Tooltip>
      </div>
    </header>

    <main id="main" class="app-shell__main">
      <div class="app-shell__grid" :class="{ 'app-shell__grid--showcase': appState.showcaseMode }">
        <div class="app-shell__hero">
          <slot name="hero" />
        </div>
        <div class="app-shell__utility">
          <slot name="utility" />
        </div>
        <div class="app-shell__links">
          <slot name="links" />
        </div>
      </div>
    </main>

    <!-- 底栏由 features.footer 决定是否挂载：关掉时不输出任何 DOM -->
    <FooterBar v-if="features.footer && !appState.showcaseMode" />
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  z-index: var(--m3e-z-content);
  display: flex;
  flex-direction: column;
  block-size: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
}

.app-shell__skip {
  position: absolute;
  z-index: var(--m3e-z-skip-link);
  inset-block-start: var(--m3e-space-2);
  inset-inline-start: var(--m3e-space-2);
  padding: var(--m3e-space-2) var(--m3e-space-4);
  border-radius: var(--shape-corner-m);
  background-color: var(--primary);
  color: var(--on-primary);
  font: var(--m3e-type-label-large);
  transform: translateY(-200%);
  transition: transform var(--m3e-duration-short) var(--m3e-easing-standard);
}

.app-shell__skip:focus-visible {
  transform: translateY(0);
}

.app-shell__bar {
  position: sticky;
  inset-block-start: 0;
  z-index: var(--m3e-z-sticky);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--m3e-space-4);
  padding: var(--m3e-space-3) var(--m3e-space-6);
  flex: none;
}

.app-shell__actions {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-1);
  flex: none;
}

.app-shell__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: var(--m3e-space-4) var(--m3e-space-6) var(--m3e-space-6);
}

.app-shell__grid {
  display: grid;
  /* 右栏承载功能卡与链接网格，因此比左栏略宽；两栏内部各自成为一个视觉整体 */
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  grid-template-areas:
    "hero utility"
    "hero links";
  grid-template-rows: auto 1fr;
  gap: var(--m3e-space-5) var(--m3e-space-6);
  align-items: start;
  inline-size: min(76rem, 100%);
  margin-inline: auto;
  margin-block: auto;
  transition: opacity var(--m3e-duration-medium) var(--m3e-easing-standard);
}

/* 展示模式：面板整体退场，只留壁纸 */
.app-shell__grid--showcase {
  opacity: 0;
  pointer-events: none;
}

.app-shell__hero {
  grid-area: hero;
  min-inline-size: 0;
  /* 左栏内容是「标识 + 简介 + 社交」，限宽后与右栏形成呼应，而不是被拉成一行 */
  max-inline-size: 30rem;
  align-self: center;
}

.app-shell__utility {
  grid-area: utility;
  min-inline-size: 0;
}

.app-shell__links {
  grid-area: links;
  min-inline-size: 0;
}

@media (max-width: 1023px) {
  .app-shell__grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "hero"
      "utility"
      "links";
  }

  /* 单列时左栏不再限宽，避免居中留白 */
  .app-shell__hero {
    max-inline-size: none;
  }
}

@media (max-width: 767px) {
  .app-shell__bar {
    padding: var(--m3e-space-2) var(--m3e-space-4);
  }

  .app-shell__main {
    padding: var(--m3e-space-3) var(--m3e-space-4) var(--m3e-space-5);
  }
}

@media (max-width: 479px) {
  .app-shell__actions {
    gap: 0;
  }
}
</style>
