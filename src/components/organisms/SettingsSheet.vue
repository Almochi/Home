<script setup lang="ts">
/** 设置面板：壁纸 / 外观 / 播放器 / 其他，四段式；关闭的功能段不渲染（零负担） */
import { computed } from "vue";
import Button from "@/components/atoms/Button.vue";
import Divider from "@/components/atoms/Divider.vue";
import SegmentedButton from "@/components/atoms/SegmentedButton.vue";
import Sheet from "@/components/molecules/Sheet.vue";
import Slider from "@/components/atoms/Slider.vue";
import Switch from "@/components/atoms/Switch.vue";
import AppearancePicker from "@/components/molecules/AppearancePicker.vue";
import SettingRow from "@/components/molecules/SettingRow.vue";
import WallpaperPicker from "@/components/molecules/WallpaperPicker.vue";
import { features } from "@/config/features";
import { musicConfig } from "@/config/music";
import { siteConfig } from "@/config/site";
import { LOCALES, type Locale, useI18n } from "@/i18n";
import type { PlayerLoop } from "@/types/config";
import { appActions, appState } from "@/stores/app";

const { t, locale, setLocale } = useI18n();

/** 模板无法直接访问编译期常量，这里取出一次 */
const appVersion = __APP_VERSION__;

const localeOptions = computed(() =>
  LOCALES.map((item) => ({ value: item.id, label: item.label })),
);

const loopOptions = computed(() => [
  { value: "all", label: t("music.loop.all") },
  { value: "one", label: t("music.loop.one") },
  { value: "none", label: t("music.loop.none") },
]);

function formatVolume(value: number): string {
  return `${Math.round(value * 100)}%`;
}
</script>

<template>
  <Sheet :open="appState.settingsOpen" :title="t('settings.title')" @close="appActions.closePanels()">
    <section class="settings-sheet__section">
      <h3 class="settings-sheet__heading">{{ t("settings.tab.wallpaper") }}</h3>
      <WallpaperPicker />
    </section>

    <Divider />

    <section class="settings-sheet__section">
      <h3 class="settings-sheet__heading">{{ t("settings.tab.appearance") }}</h3>
      <AppearancePicker />
    </section>

    <template v-if="musicConfig.enabled">
      <Divider />
      <section class="settings-sheet__section">
        <h3 class="settings-sheet__heading">{{ t("settings.tab.player") }}</h3>
        <SettingRow :label="t('settings.player.autoplay')">
          <Switch
            v-model="appState.playerAutoplay"
            :label="t('settings.player.autoplay')"
          />
        </SettingRow>
        <SettingRow :label="t('settings.player.shuffle')">
          <Switch
            :model-value="appState.playerOrder === 'random'"
            :label="t('settings.player.shuffle')"
            @update:model-value="appState.playerOrder = $event ? 'random' : 'list'"
          />
        </SettingRow>
        <SettingRow :label="t('settings.player.loop')">
          <SegmentedButton
            :model-value="appState.playerLoop"
            :options="loopOptions"
            :label="t('settings.player.loop')"
            @update:model-value="appState.playerLoop = $event as PlayerLoop"
          />
        </SettingRow>
        <SettingRow stack :label="t('settings.player.volume')">
          <Slider
            :model-value="appState.playerVolume"
            :min="0"
            :max="1"
            :step="0.01"
            :label="t('settings.player.volume')"
            :format="formatVolume"
            @update:model-value="appActions.setVolume($event)"
          />
        </SettingRow>
      </section>
    </template>

    <Divider />

    <section class="settings-sheet__section">
      <h3 class="settings-sheet__heading">{{ t("settings.tab.other") }}</h3>
      <SettingRow :label="t('settings.other.language')">
        <SegmentedButton
          :model-value="locale"
          :options="localeOptions"
          :label="t('settings.other.language')"
          @update:model-value="setLocale($event as Locale)"
        />
      </SettingRow>
      <SettingRow v-if="features.siteStartDate" :label="t('settings.other.site.start')">
        <Switch v-model="appState.showSiteAge" :label="t('settings.other.site.start')" />
      </SettingRow>
      <SettingRow v-if="features.footer" :label="t('settings.other.footer.backdrop')">
        <Switch v-model="appState.footerBackdrop" :label="t('settings.other.footer.backdrop')" />
      </SettingRow>
      <SettingRow v-if="features.linkBackdrop" :label="t('settings.other.link.backdrop')">
        <Switch v-model="appState.linkBackdrop" :label="t('settings.other.link.backdrop')" />
      </SettingRow>
      <SettingRow
        v-if="features.footer && features.footerLyrics && musicConfig.enabled"
        :label="t('settings.player.lyric')"
      >
        <Switch v-model="appState.playerLyrics" :label="t('settings.player.lyric')" />
      </SettingRow>
      <div class="settings-sheet__footer">
        <span class="settings-sheet__version">v{{ appVersion }}</span>
        <Button
          v-if="siteConfig.repo"
          variant="text"
          icon="brand:github"
          :href="siteConfig.repo ?? undefined"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t("settings.repository") }}
        </Button>
      </div>
    </section>
  </Sheet>
</template>

<style scoped>
.settings-sheet__section {
  display: flex;
  flex-direction: column;
  gap: var(--m3e-space-2);
  padding-block: var(--m3e-space-4);
}

.settings-sheet__heading {
  font: var(--m3e-type-title-small);
  color: var(--primary);
  padding-block-end: var(--m3e-space-1);
}

.settings-sheet__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--m3e-space-3);
  padding-block-start: var(--m3e-space-4);
}

.settings-sheet__version {
  font-family: var(--font-display);
  font-size: var(--m3e-type-title-medium);
  color: var(--on-surface-variant);
}
</style>
