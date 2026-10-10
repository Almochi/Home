<script setup lang="ts">
/**
 * 播放控制：上一首 / 播放暂停 / 下一首 + 音量。
 * 控件只调用引擎动作，不自己持有播放状态（状态在 usePlayer / appState）。
 */
import { computed } from "vue";
import Icon from "@/components/atoms/Icon.vue";
import IconButton from "@/components/atoms/IconButton.vue";
import Slider from "@/components/atoms/Slider.vue";
import { usePlayer } from "@/player";
import { useI18n } from "@/i18n";
import { appActions, appState } from "@/stores/app";

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });

const { t } = useI18n();
const { current, toggle, next, prev, hasTracks, status } = usePlayer();

const trackLabel = computed(() => {
  if (!current.value) return t(status.value === "loading" ? "music.loading" : "music.idle");
  return current.value.artist
    ? `${current.value.name} · ${current.value.artist}`
    : current.value.name;
});

const volume = computed({
  get: () => appState.playerVolume,
  set: (value: number) => appActions.setVolume(value),
});

function formatVolume(value: number): string {
  return `${Math.round(value * 100)}%`;
}
</script>

<template>
  <div class="player-controls" :class="{ 'player-controls--compact': compact }">
    <div class="player-controls__buttons">
      <IconButton
        icon="skip-previous"
        :label="t('music.prev')"
        :disabled="!hasTracks"
        @click="prev"
      />
      <button
        class="player-controls__toggle m3-state-layer"
        type="button"
        :aria-label="appState.playerPlaying ? t('music.pause') : t('music.play')"
        :aria-pressed="appState.playerPlaying"
        :disabled="!hasTracks"
        @click="toggle"
      >
        <Icon :name="appState.playerPlaying ? 'pause' : 'play-arrow'" :size="26" />
      </button>
      <IconButton icon="skip-next" :label="t('music.next')" :disabled="!hasTracks" @click="next" />
    </div>

    <p class="player-controls__track text-truncate">{{ trackLabel }}</p>

    <div v-if="!compact" class="player-controls__volume">
      <Icon :name="volume === 0 ? 'volume-off' : 'volume-up'" class="player-controls__volume-icon" />
      <Slider
        v-model="volume"
        :min="0"
        :max="1"
        :step="0.01"
        :label="t('music.volume')"
        :format="formatVolume"
      />
    </div>
  </div>
</template>

<style scoped>
.player-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--m3e-space-2);
  inline-size: 100%;
}

.player-controls__buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--m3e-space-3);
}

.player-controls__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 3.25rem;
  block-size: 3.25rem;
  padding: 0;
  border: 0;
  border-radius: var(--shape-corner-full);
  background-color: var(--primary);
  color: var(--on-primary);
  --m3e-state-color: var(--on-primary);
  cursor: pointer;
  flex: none;
}

.player-controls__toggle:disabled {
  opacity: 0.38;
  pointer-events: none;
}

.player-controls__track {
  inline-size: 100%;
  text-align: center;
  font: var(--m3e-type-body-small);
  color: var(--on-surface-variant);
}

.player-controls__volume {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-2);
  inline-size: 100%;
  padding-inline: var(--m3e-space-2);
}

.player-controls__volume-icon {
  color: var(--on-surface-variant);
  flex: none;
}
</style>
