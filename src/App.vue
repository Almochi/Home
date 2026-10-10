<script setup lang="ts">
/**
 * 应用根组件：只做三件事——组装布局、绑定全局快捷键、挂载浮层。
 * 业务状态一律在 src/stores 与 composables 中，这里不承载逻辑分支。
 */
import { onBeforeUnmount, onMounted } from "vue";
import AppShell from "@/components/layout/AppShell.vue";
import SnackbarHost from "@/components/molecules/SnackbarHost.vue";
import BackgroundLayer from "@/components/organisms/BackgroundLayer.vue";
import HeroPanel from "@/components/organisms/HeroPanel.vue";
import InfoSheet from "@/components/organisms/InfoSheet.vue";
import LinksPanel from "@/components/organisms/LinksPanel.vue";
import LoadingCurtain from "@/components/organisms/LoadingCurtain.vue";
import MusicEngine from "@/components/organisms/MusicEngine.vue";
import PlaylistDialog from "@/components/organisms/PlaylistDialog.vue";
import SettingsSheet from "@/components/organisms/SettingsSheet.vue";
import UtilityPanel from "@/components/organisms/UtilityPanel.vue";
import { usePlayer } from "@/player";
import { notify } from "@/stores/snackbar";
import { features } from "@/config/features";
import { musicConfig } from "@/config/music";
import { t } from "@/i18n";
import { appActions, appState } from "@/stores/app";

const { hasTracks, toggle } = usePlayer();

/** 快捷键不应抢走输入控件的原生行为 */
function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement && Boolean(target.closest("input, button, a, select, textarea"))
  );
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    if (appState.showcaseMode) {
      appActions.closeShowcase();
      notify(t("app.showcase.exit"), { icon: "fullscreen", duration: 2000 });
      return;
    }
    if (appState.playlistOpen || appState.settingsOpen || appState.infoOpen) {
      appActions.closePanels();
    }
    return;
  }
  // 空格播放/暂停：避开输入控件，避免抢走原生行为
  if (event.code === "Space" && hasTracks.value && !isInteractiveTarget(event.target)) {
    event.preventDefault();
    void toggle();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <BackgroundLayer />

  <AppShell>
    <template #hero>
      <HeroPanel />
    </template>
    <template #utility>
      <UtilityPanel />
    </template>
    <template #links>
      <LinksPanel />
    </template>
  </AppShell>

  <MusicEngine v-if="musicConfig.enabled" />

  <InfoSheet v-if="features.timeCapsule || features.siteStartDate" />
  <SettingsSheet />
  <PlaylistDialog v-if="musicConfig.enabled" />

  <LoadingCurtain />
  <SnackbarHost />
</template>
