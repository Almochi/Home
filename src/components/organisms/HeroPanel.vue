<script setup lang="ts">
/** 左栏：站点标识 + 简介卡片 + 社交链接（三块之间留出足够呼吸感） */
import GreetingCard from "@/components/molecules/GreetingCard.vue";
import SiteIdentity from "@/components/molecules/SiteIdentity.vue";
import SocialLinks from "@/components/molecules/SocialLinks.vue";
import { appActions, appState } from "@/stores/app";

function toggleInfo(): void {
  if (appState.infoOpen) appActions.closePanels();
  else appActions.openInfo();
}
</script>

<template>
  <section class="hero-panel" aria-labelledby="site-identity">
    <div id="site-identity">
      <SiteIdentity />
    </div>
    <GreetingCard :expanded="appState.infoOpen" @toggle="toggleInfo" />
    <SocialLinks />
  </section>
</template>

<style scoped>
.hero-panel {
  display: flex;
  flex-direction: column;
  gap: var(--m3e-space-8);
  min-inline-size: 0;
}

@media (max-width: 767px) {
  .hero-panel {
    gap: var(--m3e-space-6);
  }
}
</style>
