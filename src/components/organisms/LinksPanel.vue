<script setup lang="ts">
/**
 * 站点链接面板：标题直接压在壁纸上，卡片网格收在面板内（与参考稿的层级一致）。
 * 一个链接都没有时整块退场，不留下空标题。
 */
import Icon from "@/components/atoms/Icon.vue";
import Surface from "@/components/atoms/Surface.vue";
import LinkGrid from "@/components/molecules/LinkGrid.vue";
import { features } from "@/config/features";
import { siteLinks } from "@/config/links";
import { useI18n } from "@/i18n";
import { appActions } from "@/stores/app";

const { t } = useI18n();

const visible = features.siteLinks && siteLinks.length > 0;

/** 链接里可能混有「音乐」这类站内动作，交给播放器而不是新开标签页 */
function handlePlayMusic(): void {
  appActions.toggleMusicPanel(true);
}
</script>

<template>
  <section v-if="visible" class="links-panel">
    <h2 class="links-panel__title">
      <Icon name="link" class="links-panel__title-icon" />
      <span>{{ t("panel.links") }}</span>
    </h2>
    <Surface class="links-panel__surface">
      <LinkGrid @play-music="handlePlayMusic" />
    </Surface>
  </section>
</template>

<style scoped>
.links-panel {
  display: flex;
  flex-direction: column;
  gap: var(--m3e-space-3);
  min-inline-size: 0;
}

.links-panel__title {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-2);
  padding-inline-start: var(--m3e-space-1);
  font: var(--m3e-type-title-medium);
  /* 标题压在壁纸上：必须用固定的壁纸前景色 + 投影 */
  color: var(--on-wallpaper);
  text-shadow: var(--wallpaper-text-shadow);
}

.links-panel__title-icon {
  font-size: var(--m3e-icon-size-xl);
  color: var(--on-wallpaper);
}

.links-panel__surface {
  padding: var(--m3e-space-4);
}
</style>
