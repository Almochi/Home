/**
 * 主题偏好：结构定义 + 持久化契约
 *
 * 存储键 home:theme 与 index.html 的首帧引导脚本共享，字段名不可随意改动；
 * 读写统一走 src/utils/storage（{ version, data } 信封），首帧脚本解包后再用。
 */
import { themeDefaults } from "@/config/themeDefaults";
import { MC_SPECS, MC_STYLES, type McSpec, type McStyle, normalizeHue } from "@/theme/colorScheme";
import type { MotionPreference, ThemeMode } from "@/types/config";
import { pickBoolean, pickEnum, pickNumber } from "@/utils/pick";
import { readJson, writeJson } from "@/utils/storage";

export const THEME_STORAGE_KEY = "home:theme";

export type { MotionPreference, ThemeMode };

export interface ThemePrefs {
  /** 种子色相 0-360 */
  hue: number;
  /** 调色板风格 */
  style: McStyle;
  /** 设计规范版本 */
  spec: McSpec;
  /** 明暗模式 */
  mode: ThemeMode;
  /** 动效偏好 */
  motion: MotionPreference;
  /** 是否跟随壁纸取色 */
  followWallpaper: boolean;
}

export const DEFAULT_THEME_PREFS: ThemePrefs = {
  hue: themeDefaults.hue,
  style: themeDefaults.style,
  spec: themeDefaults.spec,
  mode: themeDefaults.mode,
  motion: themeDefaults.motion,
  followWallpaper: themeDefaults.followWallpaper,
};

const MODES: readonly ThemeMode[] = ["auto", "light", "dark"];
const MOTIONS: readonly MotionPreference[] = ["system", "reduced", "full"];

/** 读取并校验持久化的主题偏好（损坏或越界一律回落到默认值） */
export function loadThemePrefs(): ThemePrefs {
  const saved = readJson<Partial<ThemePrefs>>(THEME_STORAGE_KEY, {});
  return {
    hue: normalizeHue(pickNumber(saved.hue, DEFAULT_THEME_PREFS.hue, 0, 360)),
    style: pickEnum(saved.style, MC_STYLES, DEFAULT_THEME_PREFS.style),
    spec: pickEnum(saved.spec, MC_SPECS, DEFAULT_THEME_PREFS.spec),
    mode: pickEnum(saved.mode, MODES, DEFAULT_THEME_PREFS.mode),
    motion: pickEnum(saved.motion, MOTIONS, DEFAULT_THEME_PREFS.motion),
    followWallpaper: pickBoolean(saved.followWallpaper, DEFAULT_THEME_PREFS.followWallpaper),
  };
}

export function saveThemePrefs(prefs: ThemePrefs): void {
  writeJson(THEME_STORAGE_KEY, prefs);
}
