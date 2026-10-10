<script setup lang="ts">
/**
 * 社交链接：一行图标入口。
 * 提示文案通过原生 title 与 aria-label 提供，不再在页面上渲染低对比度的小字。
 */
import Icon from "@/components/atoms/Icon.vue";
import { features } from "@/config/features";
import { socialLinks } from "@/config/links";
import { useI18n } from "@/i18n";

const { t } = useI18n();
</script>

<template>
  <nav
    v-if="features.socialLinks && socialLinks.length > 0"
    class="social-links"
    :aria-label="t('panel.social')"
  >
    <ul class="social-links__list">
      <li v-for="link in socialLinks" :key="link.name">
        <a
          class="social-links__link m3-state-layer"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('social.open', { name: link.name })"
          :title="link.tip || link.name"
        >
          <img v-if="link.img" class="social-links__image" :src="link.img" :alt="link.name" height="22" />
          <Icon v-else-if="link.icon" :name="link.icon" :size="22" />
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.social-links {
  display: flex;
  align-items: center;
  inline-size: 100%;
  min-block-size: 3rem;
}

.social-links__list {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-1);
}

.social-links__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  border-radius: var(--shape-corner-full);
  color: var(--on-wallpaper-variant);
  --m3e-state-color: var(--on-wallpaper);
  filter: drop-shadow(var(--wallpaper-text-shadow-strong));
  transition: color var(--m3e-duration-short) var(--m3e-easing-standard);
}

.social-links__link:hover {
  color: var(--on-wallpaper);
}

.social-links__image {
  inline-size: 1.375rem;
  block-size: 1.375rem;
  object-fit: contain;
}

@media (max-width: 767px) {
  .social-links {
    justify-content: center;
  }
}
</style>
