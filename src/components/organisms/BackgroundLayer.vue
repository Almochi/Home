<script setup lang="ts">
/** 壁纸层：图片 + 可读性遮罩 + 悬停站点卡片时的背景虚化 + 展示模式下的下载入口（整层不参与指针事件） */
import { computed } from "vue";
import Icon from "@/components/atoms/Icon.vue";
import { useWallpaper } from "@/composables/useWallpaper";
import { features } from "@/config/features";
import { useI18n } from "@/i18n";
import { appState } from "@/stores/app";

const { t } = useI18n();
const { url, srcset, status, canDownload } = useWallpaper();

/** 指针压在站点链接网格上时，整块壁纸转毛玻璃（设置里可以关掉） */
const frosted = computed(
  () => features.linkBackdrop && appState.linkBackdrop && appState.linkHovered,
);
</script>

<template>
  <div class="background-layer" :class="{ 'background-layer--ready': status === 'ready' }" aria-hidden="false">
    <!-- 壁纸是首屏最大的一块，交给浏览器按屏幕挑分辨率并优先下载 -->
    <img
      v-if="url"
      class="background-layer__image"
      :src="url"
      :srcset="srcset"
      sizes="100vw"
      alt=""
      decoding="async"
      fetchpriority="high"
    />
    <div class="background-layer__scrim" />
    <!-- 毛玻璃层按需挂载：不悬停时连 DOM 都没有，也不白占一次全屏合成 -->
    <Transition name="m3-fade">
      <div v-if="frosted" class="background-layer__frost" aria-hidden="true" />
    </Transition>
    <Transition name="m3-fade-up">
      <a
        v-if="appState.showcaseMode && canDownload && url"
        class="background-layer__download m3-state-layer"
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        download
      >
        <Icon name="download" />
        <span>{{ t("app.action.download") }}</span>
      </a>
    </Transition>
  </div>
</template>

<style scoped>
.background-layer {
  position: fixed;
  inset: 0;
  z-index: var(--m3e-z-base);
  overflow: hidden;
  background-color: var(--wallpaper-placeholder);
  pointer-events: none;
}

.background-layer__image {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  opacity: 0;
}

.background-layer--ready .background-layer__image {
  animation: background-in var(--m3e-duration-long) var(--m3e-easing-emphasized-decelerate) forwards;
}

.background-layer__scrim {
  position: absolute;
  inset: 0;
  background-image: var(--wallpaper-scrim);
  /* 压暗强度走透明度：亮色 0 → 深色 1，切换明暗时平滑淡入淡出而不是瞬间跳变 */
  opacity: var(--wallpaper-scrim-opacity);
  transition: opacity var(--m3e-duration-medium) var(--m3e-easing-standard);
}

/* 指针压在站点卡片上：壁纸整体虚化并压暗一档，面板与文字不受影响 */
.background-layer__frost {
  position: absolute;
  inset: 0;
  -webkit-backdrop-filter: blur(var(--wallpaper-frost-blur));
  backdrop-filter: blur(var(--wallpaper-frost-blur));
  background-color: var(--wallpaper-frost-bg);
}

.background-layer__download {
  position: absolute;
  inset-block-end: var(--m3e-space-8);
  inset-inline-start: 50%;
  display: inline-flex;
  align-items: center;
  gap: var(--m3e-space-2);
  padding: var(--m3e-space-3) var(--m3e-space-6);
  border: 1px solid var(--panel-border);
  border-radius: var(--shape-corner-full);
  background-color: var(--panel-bg-strong);
  color: var(--on-wallpaper);
  font: var(--m3e-type-label-large);
  transform: translateX(-50%);
  pointer-events: auto;
}

@keyframes background-in {
  from {
    opacity: 0;
    transform: scale(1.06);
    filter: blur(0.75rem);
  }
  to {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
}
</style>
