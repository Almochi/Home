<script setup lang="ts">
/** 一言卡片：点击整卡换一句，右上角提供「打开播放器」入口 */
import Icon from "@/components/atoms/Icon.vue";
import IconButton from "@/components/atoms/IconButton.vue";
import { useHitokoto } from "@/composables/useHitokoto";
import { musicConfig } from "@/config/music";
import { useI18n } from "@/i18n";

defineProps<{ playlistReady: boolean }>();
defineEmits<{ openPlayer: [] }>();

const { t } = useI18n();
const { text, from, loading, refresh } = useHitokoto();
</script>

<template>
  <div class="hitokoto-card">
    <div class="hitokoto-card__actions">
      <IconButton
        v-if="musicConfig.enabled && playlistReady"
        icon="queue-music"
        size="small"
        :label="t('hitokoto.player.open')"
        @click="$emit('openPlayer')"
      />
      <IconButton
        icon="refresh"
        size="small"
        :label="t('app.action.refresh')"
        :disabled="loading"
        @click="refresh"
      />
    </div>
    <button class="hitokoto-card__body m3-state-layer" type="button" @click="refresh">
      <Icon name="format-quote" class="hitokoto-card__mark" />
      <Transition name="m3-swap" mode="out-in">
        <span :key="text" class="hitokoto-card__text">
          <span class="hitokoto-card__quote">{{ text }}</span>
          <span class="hitokoto-card__from">—「&nbsp;{{ from }}&nbsp;」</span>
        </span>
      </Transition>
    </button>
  </div>
</template>

<style scoped>
.hitokoto-card {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  block-size: 100%;
  min-block-size: 0;
}

.hitokoto-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--m3e-space-1);
  flex: none;
}

.hitokoto-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  /* 引号贴顶、正文居中、出处贴底，与参考稿的卡片节奏一致 */
  justify-content: space-between;
  gap: var(--m3e-space-3);
  min-block-size: 0;
  padding: var(--m3e-space-2) var(--m3e-space-1) 0;
  border: 0;
  border-radius: var(--shape-corner-m);
  background-color: transparent;
  color: inherit;
  text-align: start;
  cursor: pointer;
  overflow: hidden;
}

.hitokoto-card__mark {
  color: var(--primary);
  font-size: var(--m3e-icon-size-xl);
  flex: none;
}

.hitokoto-card__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: var(--m3e-space-2);
  min-block-size: 0;
}

.hitokoto-card__quote {
  font-size: var(--m3e-size-quote);
  line-height: 1.6;
  color: var(--on-surface);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hitokoto-card__from {
  align-self: flex-end;
  font: var(--m3e-type-label-large);
  color: var(--on-surface-variant);
}
</style>
