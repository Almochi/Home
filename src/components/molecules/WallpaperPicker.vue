<script setup lang="ts">
/** 壁纸来源选择：可选中的筛选 chip，数据来自 config/wallpaper.ts */
import Chip from "@/components/atoms/Chip.vue";
import { wallpaperConfig } from "@/config/wallpaper";
import { useI18n } from "@/i18n";
import { appActions, appState } from "@/stores/app";

const { t } = useI18n();

function select(id: string): void {
  appActions.setWallpaperId(id);
}
</script>

<template>
  <div class="wallpaper-picker" role="group" :aria-label="t('settings.wallpaper.label')">
    <Chip
      v-for="source in wallpaperConfig.sources"
      :key="source.id"
      :label="t(source.labelKey)"
      :icon="source.kind === 'local' ? 'image' : 'public'"
      interactive
      :selected="appState.wallpaperId === source.id"
      @click="select(source.id)"
    />
  </div>
</template>

<style scoped>
.wallpaper-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--m3e-space-2);
}
</style>
