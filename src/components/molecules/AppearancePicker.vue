<script setup lang="ts">
/**
 * 外观设置：动态配色的全部可调项。
 * 这里只写主题偏好，调色板的计算与落盘由 src/theme 负责。
 */
import { computed } from "vue";
import Button from "@/components/atoms/Button.vue";
import Chip from "@/components/atoms/Chip.vue";
import SegmentedButton from "@/components/atoms/SegmentedButton.vue";
import Slider from "@/components/atoms/Slider.vue";
import Switch from "@/components/atoms/Switch.vue";
import SettingRow from "@/components/molecules/SettingRow.vue";
import { type I18nKey, useI18n } from "@/i18n";
import { features } from "@/config/features";
import { MC_SPECS, MC_STYLES, type McStyle } from "@/theme/colorScheme";
import { resetTheme, themeState, updateTheme } from "@/theme";

const { t } = useI18n();

const prefs = computed(() => themeState.prefs);

const modeOptions = computed(() => [
  { value: "auto", label: t("settings.appearance.mode.auto"), icon: "brightness-auto" },
  { value: "light", label: t("settings.appearance.mode.light"), icon: "light-mode" },
  { value: "dark", label: t("settings.appearance.mode.dark"), icon: "dark-mode" },
]);

const specOptions = computed(() =>
  MC_SPECS.map((spec) => ({ value: spec, label: spec })),
);

const motionOptions = computed(() => [
  { value: "system", label: t("settings.appearance.motion.system") },
  { value: "reduced", label: t("settings.appearance.motion.reduced") },
  { value: "full", label: t("settings.appearance.motion.full") },
]);

/**
 * 风格标签：显式映射而不是拼字符串。
 * 词条键必须全小写点分，而 McStyle 的取值是库里带驼峰的 PaletteStyle id（tonalSpot / fruitSalad），
 * 拼键名会把「数据标识」泄漏成「词条标识」；映射表还能在新增风格时由类型检查报错。
 */
const STYLE_LABEL: Record<McStyle, I18nKey> = {
  tonalSpot: "settings.style.tonal.spot",
  vibrant: "settings.style.vibrant",
  content: "settings.style.content",
  expressive: "settings.style.expressive",
  rainbow: "settings.style.rainbow",
  fruitSalad: "settings.style.fruit.salad",
  monochrome: "settings.style.monochrome",
  neutral: "settings.style.neutral",
  fidelity: "settings.style.fidelity",
};

const styleLabel = (style: McStyle): string => t(STYLE_LABEL[style]);

const hueHint = computed(() => {
  const hue = themeState.wallpaperHue;
  if (prefs.value.followWallpaper && hue !== null) {
    return t("settings.appearance.hue.wallpaper", { hue });
  }
  return t("settings.appearance.hue.custom");
});

function formatHue(value: number): string {
  return `${Math.round(value)}°`;
}
</script>

<template>
  <div class="appearance-picker">
    <SettingRow :label="t('settings.appearance.mode')">
      <SegmentedButton
        :model-value="prefs.mode"
        :options="modeOptions"
        :label="t('settings.appearance.mode')"
        @update:model-value="updateTheme({ mode: $event as typeof prefs.mode })"
      />
    </SettingRow>

    <SettingRow
      v-if="features.wallpaperAutoTheme"
      :label="t('settings.appearance.hue.follow')"
    >
      <Switch
        :model-value="prefs.followWallpaper"
        :label="t('settings.appearance.hue.follow')"
        @update:model-value="updateTheme({ followWallpaper: $event })"
      />
    </SettingRow>

    <SettingRow stack :label="t('settings.appearance.hue')" :hint="hueHint">
      <div class="appearance-picker__hue">
        <Slider
          :model-value="prefs.hue"
          :min="0"
          :max="360"
          :step="1"
          :label="t('settings.appearance.hue')"
          :format="formatHue"
          @update:model-value="updateTheme({ hue: $event, followWallpaper: false })"
        />
        <span class="appearance-picker__hue-value">{{ formatHue(prefs.hue) }}</span>
      </div>
    </SettingRow>

    <SettingRow stack :label="t('settings.appearance.style')">
      <div class="appearance-picker__styles">
        <Chip
          v-for="style in MC_STYLES"
          :key="style"
          :label="styleLabel(style)"
          interactive
          :selected="prefs.style === style"
          @click="updateTheme({ style })"
        />
      </div>
    </SettingRow>

    <SettingRow :label="t('settings.appearance.spec')">
      <SegmentedButton
        :model-value="prefs.spec"
        :options="specOptions"
        :label="t('settings.appearance.spec')"
        @update:model-value="updateTheme({ spec: $event as typeof prefs.spec })"
      />
    </SettingRow>

    <SettingRow :label="t('settings.appearance.motion')">
      <SegmentedButton
        :model-value="prefs.motion"
        :options="motionOptions"
        :label="t('settings.appearance.motion')"
        @update:model-value="updateTheme({ motion: $event as typeof prefs.motion })"
      />
    </SettingRow>

    <SettingRow :label="t('settings.appearance.preview')">
      <div class="appearance-picker__swatches" aria-hidden="true">
        <span class="appearance-picker__swatch appearance-picker__swatch--primary" />
        <span class="appearance-picker__swatch appearance-picker__swatch--secondary" />
        <span class="appearance-picker__swatch appearance-picker__swatch--tertiary" />
        <span class="appearance-picker__swatch appearance-picker__swatch--surface" />
      </div>
      <Button variant="text" icon="refresh" @click="resetTheme">{{ t("settings.appearance.reset") }}</Button>
    </SettingRow>
  </div>
</template>

<style scoped>
.appearance-picker {
  display: flex;
  flex-direction: column;
}

.appearance-picker__hue {
  display: flex;
  align-items: center;
  gap: var(--m3e-space-3);
  inline-size: 100%;
}

.appearance-picker__hue-value {
  inline-size: 3rem;
  text-align: end;
  font: var(--m3e-type-label-large);
  color: var(--on-surface-variant);
  font-variant-numeric: tabular-nums;
}

.appearance-picker__styles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--m3e-space-2);
}

.appearance-picker__swatches {
  display: flex;
  gap: var(--m3e-space-1);
}

.appearance-picker__swatch {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  border-radius: var(--shape-corner-full);
  /* 直接引用令牌：色相改变时无需 JS 重绘即会跟随 */
}

.appearance-picker__swatch--primary {
  background-color: var(--primary);
}

.appearance-picker__swatch--secondary {
  background-color: var(--secondary);
}

.appearance-picker__swatch--tertiary {
  background-color: var(--tertiary);
}

.appearance-picker__swatch--surface {
  background-color: var(--surface-container-high);
  border: 1px solid var(--outline-variant);
}
</style>
