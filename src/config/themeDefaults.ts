/** 动态配色的出厂默认值，用户可在「设置 → 外观」中即时调整并被记住。 */
import type { ThemeDefaults } from "@/types/config";

export const themeDefaults: ThemeDefaults = {
  /** 种子色相 0-360（配合壁纸取色时只是取不到主色时的回落值） */
  hue: 315,
  /** 调色板风格，可选值见 src/theme/colorScheme.ts 的 MC_STYLES */
  style: "tonalSpot",
  /** Material 规范版本：2021 | 2025 */
  spec: "2025",
  /** 明暗模式：auto | light | dark */
  mode: "auto",
  motion: "system",
  /** 默认跟随壁纸取色，取色失败时自动回落到 hue */
  followWallpaper: true,
};
