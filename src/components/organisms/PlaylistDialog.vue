<script setup lang="ts">
/** 播放列表面板：曲目列表 + 进度 + 传输控制 */
import { computed, watch } from "vue";
import Dialog from "@/components/molecules/Dialog.vue";
import Slider from "@/components/atoms/Slider.vue";
import PlayerControls from "@/components/molecules/PlayerControls.vue";
import { usePlayer } from "@/player";
import { useI18n } from "@/i18n";
import { appActions, appState } from "@/stores/app";
import { formatDuration } from "@/utils/format";

const { t } = useI18n();
const { playlist, index, currentTime, duration, status, playAt, seek, ensurePlaylist } =
  usePlayer();

/** 打开列表即视为「要听歌」：这时才去拉歌单（首屏不发请求） */
watch(
  () => appState.playlistOpen,
  (open) => {
    if (open) void ensurePlaylist();
  },
  { immediate: true },
);

const close = (): void => appActions.closePanels();
const timeLabel = computed(() => `${formatDuration(currentTime.value)} / ${formatDuration(duration.value)}`);
</script>

<template>
  <Dialog :open="appState.playlistOpen" :title="t('music.playlist')" size="md" @close="close">
    <div class="playlist-dialog">
      <div class="playlist-dialog__progress">
        <span class="playlist-dialog__time">{{ timeLabel }}</span>
        <Slider
          :model-value="currentTime"
          :min="0"
          :max="duration > 0 ? duration : 1"
          :step="1"
          :label="t('music.playlist')"
          :format="(value: number) => formatDuration(value)"
          @update:model-value="seek"
        />
      </div>

      <ul v-if="playlist.length > 0" class="playlist-dialog__list">
        <li v-for="(track, trackIndex) in playlist" :key="track.id">
          <button
            class="playlist-dialog__item m3-state-layer"
            :class="{ 'playlist-dialog__item--active': trackIndex === index && appState.playerPlaying }"
            type="button"
            :aria-current="trackIndex === index ? 'true' : undefined"
            @click="playAt(trackIndex)"
          >
            <span class="playlist-dialog__index">{{ trackIndex + 1 }}</span>
            <span class="playlist-dialog__meta">
              <span class="playlist-dialog__name text-truncate">{{ track.name || t("music.idle") }}</span>
              <span class="playlist-dialog__artist text-truncate">{{ track.artist }}</span>
            </span>
            <span v-if="track.duration" class="playlist-dialog__duration">
              {{ formatDuration(track.duration) }}
            </span>
          </button>
        </li>
      </ul>

      <p v-else class="playlist-dialog__empty">
        {{ status === "loading" ? t("music.loading") : t("music.empty") }}
      </p>
    </div>

    <template #footer>
      <PlayerControls />
    </template>
  </Dialog>
</template>

<style scoped>
.playlist-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--m3e-space-4);
}

.playlist-dialog__progress {
  display: flex;
  flex-direction: column;
  gap: var(--m3e-space-1);
}

.playlist-dialog__time {
  align-self: flex-end;
  font: var(--m3e-type-body-small);
  color: var(--on-surface-variant);
  font-variant-numeric: tabular-nums;
}

.playlist-dialog__list {
  display: flex;
  flex-direction: column;
  gap: var(--m3e-space-1);
  max-block-size: 50dvh;
  overflow-y: auto;
}

.playlist-dialog__item {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-3);
  inline-size: 100%;
  padding: var(--m3e-space-2) var(--m3e-space-3);
  border: 0;
  border-radius: var(--shape-corner-m);
  background-color: transparent;
  color: var(--on-surface);
  text-align: start;
  cursor: pointer;
}

.playlist-dialog__item--active {
  background-color: var(--secondary-container);
  color: var(--on-secondary-container);
  --m3e-state-color: var(--on-secondary-container);
}

.playlist-dialog__index {
  inline-size: 1.5rem;
  text-align: end;
  font: var(--m3e-type-label-medium);
  color: var(--on-surface-variant);
  font-variant-numeric: tabular-nums;
  flex: none;
}

.playlist-dialog__meta {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
}

.playlist-dialog__name {
  font: var(--m3e-type-body-medium);
}

.playlist-dialog__artist {
  font: var(--m3e-type-body-small);
  color: var(--on-surface-variant);
}

.playlist-dialog__duration {
  margin-inline-start: auto;
  flex: none;
  font: var(--m3e-type-label-medium);
  color: var(--on-surface-variant);
  font-variant-numeric: tabular-nums;
}

.playlist-dialog__empty {
  padding-block: var(--m3e-space-6);
  text-align: center;
  font: var(--m3e-type-body-medium);
  color: var(--on-surface-variant);
}
</style>
