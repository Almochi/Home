<script setup lang="ts">
/**
 * 右栏上半：一言 / 音乐卡（同一位置切换）+ 时钟天气卡，两卡等宽等高。
 * 顺序与参考稿一致：内容卡在左，时钟在右。
 */
import Divider from "@/components/atoms/Divider.vue";
import IconButton from "@/components/atoms/IconButton.vue";
import Surface from "@/components/atoms/Surface.vue";
import ClockWeather from "@/components/molecules/ClockWeather.vue";
import HitokotoCard from "@/components/molecules/HitokotoCard.vue";
import PlayerControls from "@/components/molecules/PlayerControls.vue";
import { musicConfig } from "@/config/music";
import { useI18n } from "@/i18n";
import { appActions, appState } from "@/stores/app";

const { t } = useI18n();

function openPlayer(): void {
  appActions.toggleMusicPanel(true);
}

function backToHitokoto(): void {
  appActions.toggleMusicPanel(false);
}

function openPlaylist(): void {
  appActions.openPlaylist();
}
</script>

<template>
  <div class="utility-panel">
    <Surface class="utility-panel__card">
      <div v-if="musicConfig.enabled && appState.musicPanelOpen" class="utility-panel__music">
        <div class="utility-panel__music-head">
          <span class="utility-panel__music-title">{{ t("music.title") }}</span>
          <div class="utility-panel__music-actions">
            <IconButton
              icon="queue-music"
              size="small"
              :label="t('music.playlist')"
              @click="openPlaylist"
            />
            <IconButton
              icon="format-quote"
              size="small"
              :label="t('music.hitokoto.back')"
              @click="backToHitokoto"
            />
          </div>
        </div>
        <Divider inset />
        <PlayerControls />
      </div>
      <HitokotoCard v-else :playlist-ready="appState.playlistReady" @open-player="openPlayer" />
    </Surface>

    <Surface class="utility-panel__card">
      <ClockWeather />
    </Surface>
  </div>
</template>

<style scoped>
.utility-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--m3e-space-4);
  min-inline-size: 0;
}

.utility-panel__card {
  display: flex;
  flex-direction: column;
  min-block-size: 11rem;
  padding: var(--m3e-space-5);
  min-inline-size: 0;
}

.utility-panel__music {
  display: flex;
  flex-direction: column;
  gap: var(--m3e-space-2);
  inline-size: 100%;
  block-size: 100%;
}

.utility-panel__music-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--m3e-space-2);
}

.utility-panel__music-title {
  font: var(--m3e-type-title-small);
  color: var(--on-surface-variant);
}

.utility-panel__music-actions {
  display: flex;
  gap: var(--m3e-space-1);
}

@media (max-width: 767px) {
  .utility-panel {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
