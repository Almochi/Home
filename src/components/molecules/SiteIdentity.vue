<script setup lang="ts">
/**
 * 站点标识：头像 + 大字号域名（Pacifico），是页面唯一的 h1。
 *
 * 页面里只出现一次（左栏顶部）。顶栏不放第二份：同一屏里两块一样的标识
 * 看起来像重复渲染，而且会让 h1 语义变得含糊。
 */
import { siteConfig } from "@/config/site";
</script>

<template>
  <div class="site-identity">
    <img
      class="site-identity__avatar"
      :src="siteConfig.logo.avatar"
      :alt="siteConfig.name"
      width="112"
      height="112"
      decoding="async"
    />
    <h1 class="site-identity__name">
      <span class="site-identity__label">{{ siteConfig.url.label }}</span>
      <span class="site-identity__suffix">{{ siteConfig.url.suffix }}</span>
    </h1>
  </div>
</template>

<style scoped>
.site-identity {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-5);
  min-inline-size: 0;
}

.site-identity__avatar {
  inline-size: 7rem;
  block-size: 7rem;
  border-radius: var(--shape-corner-full);
  object-fit: cover;
  flex: none;
  box-shadow: var(--m3e-elevation-2);
}

.site-identity__name {
  display: flex;
  align-items: baseline;
  min-inline-size: 0;
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 1.05;
  /* 直接压在壁纸上：必须用固定的壁纸前景色，否则浅色模式下会深色压深色 */
  color: var(--on-wallpaper);
  text-shadow: var(--wallpaper-text-shadow);
}

.site-identity__label {
  font-size: var(--m3e-size-logo);
  overflow: hidden;
  text-overflow: ellipsis;
}

.site-identity__suffix {
  font-size: var(--m3e-size-logo-sm);
  color: var(--on-wallpaper-variant);
}

@media (max-width: 767px) {
  .site-identity__avatar {
    inline-size: 5rem;
    block-size: 5rem;
  }
}
</style>
