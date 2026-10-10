<script setup lang="ts">
/** 信息面板：时光胶囊 + 建站时长 + 更新日志 */
import { computed } from "vue";
import Divider from "@/components/atoms/Divider.vue";
import Icon from "@/components/atoms/Icon.vue";
import IconButton from "@/components/atoms/IconButton.vue";
import ProgressIndicator from "@/components/atoms/ProgressIndicator.vue";
import Sheet from "@/components/molecules/Sheet.vue";
import { useTimeCapsule } from "@/composables/useTimeCapsule";
import { changelogConfig } from "@/config/changelog";
import { siteConfig } from "@/config/site";
import { type I18nKey, useI18n } from "@/i18n";
import { appActions, appState } from "@/stores/app";
import type { ChangelogItem } from "@/types/config";

const { t } = useI18n();
const { entries, age } = useTimeCapsule();

/**
 * 变更类型的文案：图标本身表达不了语义，用 title 补上「新增 / 修复」。
 * 显式映射而不是拼键名：新增变更类型时类型检查会直接报错，也不会把数据标识当成词条标识。
 */
const CHANGELOG_LABEL: Record<ChangelogItem["type"], I18nKey> = {
  added: "settings.changelog.added",
  fixed: "settings.changelog.fixed",
};

const changeLabel = (type: ChangelogItem["type"]): string => t(CHANGELOG_LABEL[type]);

/** 模板无法直接访问编译期常量，这里取出一次 */
const appVersion = __APP_VERSION__;

const siteAgeText = computed(() => {
  if (!age.value) return "";
  return t("capsule.site.start", {
    years: age.value.years,
    months: age.value.months,
    days: age.value.days,
  });
});

function close(): void {
  appActions.closePanels();
}

function openRepository(): void {
  if (!siteConfig.repo) return;
  window.open(siteConfig.repo, "_blank", "noopener,noreferrer");
}
</script>

<template>
  <Sheet :open="appState.infoOpen" :title="t('panel.info')" @close="close">
    <section class="info-sheet__section">
      <h3 class="info-sheet__heading">
        <Icon name="hourglass-top" />
        <span>{{ t("capsule.title") }}</span>
      </h3>
      <div class="info-sheet__capsules">
        <ProgressIndicator
          v-for="item in entries"
          :key="item.unit"
          :label="t(item.labelKey)"
          :value="item.percentage"
          :trailing="
            t('capsule.remaining', {
              value: item.remaining,
              unit: item.unit === 'day' ? t('capsule.hours') : t('capsule.days'),
            })
          "
          :aria-label="
            t('a11y.capsule.progress', {
              name: t(item.labelKey),
              percent: Math.round(item.percentage),
            })
          "
        />
      </div>
      <p v-if="siteAgeText && appState.showSiteAge" class="info-sheet__age">{{ siteAgeText }}</p>
    </section>

    <Divider />

    <section class="info-sheet__section">
      <h3 class="info-sheet__heading">
        <Icon name="article" />
        <span>{{ t("settings.changelog") }}</span>
      </h3>
      <ul class="info-sheet__changelog">
        <li v-for="item in changelogConfig.items" :key="item.text" class="info-sheet__change">
          <span :title="changeLabel(item.type)" class="info-sheet__change-icon">
            <Icon :name="item.type === 'added' ? 'check-circle' : 'tune'" />
          </span>
          <span>{{ item.text }}</span>
        </li>
      </ul>
      <div class="info-sheet__footer">
        <span class="info-sheet__version">v{{ appVersion }}</span>
        <IconButton
          v-if="siteConfig.repo"
          icon="brand:github"
          size="small"
          :label="t('settings.repository')"
          @click="openRepository"
        />
      </div>
    </section>
  </Sheet>
</template>

<style scoped>
.info-sheet__section {
  display: flex;
  flex-direction: column;
  gap: var(--m3e-space-4);
  padding-block: var(--m3e-space-5);
}

.info-sheet__heading {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-2);
  font: var(--m3e-type-title-medium);
}

.info-sheet__heading :deep(.m3-icon) {
  color: var(--primary);
  font-size: var(--m3e-icon-size-xl);
}

.info-sheet__capsules {
  display: flex;
  flex-direction: column;
  gap: var(--m3e-space-4);
}

.info-sheet__age {
  font: var(--m3e-type-body-small);
  color: var(--on-surface-variant);
  text-align: center;
}

.info-sheet__changelog {
  display: flex;
  flex-direction: column;
  gap: var(--m3e-space-3);
}

.info-sheet__change {
  display: flex;
  align-items: flex-start;
  gap: var(--m3e-space-2);
  font: var(--m3e-type-body-medium);
  color: var(--on-surface-variant);
}

.info-sheet__change-icon {
  margin-block-start: 0.15rem;
  color: var(--tertiary);
  font-size: var(--m3e-icon-size-lg);
  flex: none;
}

.info-sheet__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-sheet__version {
  font-family: var(--font-display);
  font: var(--m3e-type-title-large);
  color: var(--on-surface);
}
</style>
