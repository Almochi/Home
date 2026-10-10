<script setup lang="ts">
/** 页脚：版权 / 备案 / 正在播放的歌词行 */
import Icon from "@/components/atoms/Icon.vue";
import { features } from "@/config/features";
import { siteConfig } from "@/config/site";
import { useI18n } from "@/i18n";
import { appState } from "@/stores/app";

const { t } = useI18n();
const currentYear = new Date().getFullYear();
const showLyric = (): boolean =>
  features.footerLyrics && appState.playerLyrics && appState.playerPlaying;
</script>

<template>
  <footer class="footer-bar" :class="{ 'footer-bar--blurred': appState.footerBackdrop }">
    <Transition name="m3-swap" mode="out-in">
      <p v-if="showLyric()" key="lyric" class="footer-bar__lyric">
        <Icon name="music-note" class="footer-bar__lyric-icon" />
        <span class="text-truncate">{{ appState.lyric }}</span>
        <Icon name="music-note" class="footer-bar__lyric-icon" />
      </p>
      <p v-else key="power" class="footer-bar__power">
        <span>
          &copy;
          <span v-if="siteConfig.startYear && siteConfig.startYear < currentYear">
            {{ siteConfig.startYear }}–
          </span>
          {{ currentYear }}
          <a :href="siteConfig.url.href" target="_blank" rel="noopener noreferrer">
            {{ siteConfig.author }}
          </a>
        </span>
        <template v-if="siteConfig.repo">
          <span class="footer-bar__separator" aria-hidden="true">&amp;</span>
          <span>
            {{ t("footer.credit") }}
            <a :href="siteConfig.repo" target="_blank" rel="noopener noreferrer">
              {{ siteConfig.author }}
            </a>
          </span>
        </template>
        <template v-if="siteConfig.icp">
          <span class="footer-bar__separator" aria-hidden="true">&amp;</span>
          <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">
            {{ siteConfig.icp }}
          </a>
        </template>
      </p>
    </Transition>
  </footer>
</template>

<style scoped>
.footer-bar {
  inline-size: 100%;
  padding-block: var(--m3e-space-3);
  text-align: center;
  font: var(--m3e-type-body-small);
  color: var(--on-wallpaper-variant);
}

.footer-bar--blurred {
  background-color: color-mix(in oklab, var(--scrim) 28%, transparent);
  -webkit-backdrop-filter: blur(var(--panel-blur));
  backdrop-filter: blur(var(--panel-blur));
}

.footer-bar__power {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--m3e-space-2);
  padding-inline: var(--m3e-space-4);
}

.footer-bar__separator {
  opacity: 0.6;
}

.footer-bar__lyric {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--m3e-space-3);
  min-block-size: 1.5rem;
  padding-inline: var(--m3e-space-4);
}

.footer-bar__lyric span {
  max-inline-size: min(48rem, 70vw);
}

.footer-bar__lyric-icon {
  opacity: 0.7;
}

.footer-bar a {
  color: var(--on-wallpaper);
  text-decoration: underline;
  text-decoration-color: color-mix(in oklab, var(--on-wallpaper) 40%, transparent);
  text-underline-offset: 0.2em;
}

@media (max-width: 479px) {
  .footer-bar__separator {
    display: none;
  }
}
</style>
