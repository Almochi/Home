<script setup lang="ts">
/**
 * 站点链接网格：取代原先的 Swiper 分页。
 *
 * 布局意图（对齐参考稿的卡片格局）：不是一排小胶囊，而是 2-3 列的大卡片，
 * 图标与名称居中、每张卡等高等宽；网格天然适配任意条数，
 * 少一层运行时依赖，也不会在窄屏出现滑动冲突。
 */
import Icon from "@/components/atoms/Icon.vue";
import { features } from "@/config/features";
import { siteLinks } from "@/config/links";
import { useI18n } from "@/i18n";
import { appActions } from "@/stores/app";

const emit = defineEmits<{ playMusic: [] }>();

const { t } = useI18n();

/** 触屏没有 hover 语义：点一下就会留下「虚化中」的状态，干脆不参与 */
const hoverCapable = window.matchMedia("(hover: hover)").matches;

/**
 * 「音乐」是站内动作：打开本地播放器，而不是跳到外部站点 —— 所以要拦掉默认跳转，
 * 否则点一次会既开播放器又开一个新标签页。
 */
function handleClick(event: MouseEvent, link: (typeof siteLinks)[number]): void {
  if (link.action !== "music") return;
  event.preventDefault();
  emit("playMusic");
}

/**
 * 指针进出整块网格时让背景层把壁纸虚化掉。
 * 挂在整个 <ul> 而不是每张卡片上：卡片之间 12px 的缝隙不会让毛玻璃反复开关。
 */
function setBackdropFrosted(value: boolean): void {
  if (features.linkBackdrop && hoverCapable) appActions.setLinkHovered(value);
}
</script>

<template>
  <ul
    v-if="siteLinks.length > 0"
    class="link-grid"
    @pointerenter="setBackdropFrosted(true)"
    @pointerleave="setBackdropFrosted(false)"
  >
    <li v-for="link in siteLinks" :key="link.name" class="link-grid__cell">
      <a
        class="link-grid__item m3-state-layer"
        :href="link.link"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t('links.new.tab', { name: link.name })"
        @click="handleClick($event, link)"
      >
        <span class="link-grid__icon">
          <img v-if="link.img" :src="link.img" :alt="link.name" width="24" height="24" />
          <Icon v-else-if="link.icon" :name="link.icon" />
        </span>
        <span class="link-grid__name text-truncate">{{ link.name }}</span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.link-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--m3e-space-3);
  inline-size: 100%;
}

.link-grid__cell {
  display: flex;
  min-inline-size: 0;
}

.link-grid__item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--m3e-space-2);
  inline-size: 100%;
  block-size: 4.5rem;
  padding-inline: var(--m3e-space-3);
  /* 静息态留一条透明边框：悬停换成玻璃时不会跳一格 */
  border: 1px solid transparent;
  border-radius: var(--shape-corner-m);
  background-color: var(--card-bg);
  color: var(--on-surface);
  text-decoration: none;
  overflow: hidden;
  transition:
    background-color var(--m3e-duration-medium) var(--m3e-easing-standard),
    border-color var(--m3e-duration-medium) var(--m3e-easing-standard);
}

/* 悬停 / 键盘聚焦：卡片自己变成一块玻璃，透出被虚化的背景 */
.link-grid__item:hover,
.link-grid__item:focus-visible {
  border-color: var(--panel-border);
  background-color: var(--card-bg-glass);
  -webkit-backdrop-filter: blur(calc(var(--panel-blur) * 0.6)) saturate(1.3);
  backdrop-filter: blur(calc(var(--panel-blur) * 0.6)) saturate(1.3);
}

.link-grid__icon {
  display: inline-flex;
  flex: none;
  color: var(--primary);
  font-size: var(--m3e-icon-size-2xl);
}

.link-grid__name {
  min-inline-size: 0;
  font: var(--m3e-type-title-small);
}

@media (min-width: 768px) {
  .link-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
