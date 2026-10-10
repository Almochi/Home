/**
 * Material 3 动态配色引擎（HCT）
 *
 * 对 Google \`@material/material-color-utilities\` 的薄封装：由「种子色相 × 调色板风格 ×
 * 规范版本 × 明暗」实时解析出全部 M3 颜色角色，供 src/styles/tokens.css 的 --mc-* 使用。
 *
 * 与 Shirone 的做法保持一致：种子只取色相（0-360），色度与明度固定为中等值，
 * 这样任意色相都能得到可用且不过分艳丽的种子色。
 */
import {
  type DynamicColor,
  type DynamicScheme,
  Hct,
  type MaterialDynamicColors,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
} from "@material/material-color-utilities";

/** 调色板风格（对应 MaterialKolor 的 PaletteStyle） */
export const MC_STYLES = [
  "tonalSpot",
  "vibrant",
  "content",
  "expressive",
  "rainbow",
  "fruitSalad",
  "monochrome",
  "neutral",
  "fidelity",
] as const;
export type McStyle = (typeof MC_STYLES)[number];

/** 设计规范版本（对应 ColorSpec.SpecVersion） */
export const MC_SPECS = ["2021", "2025"] as const;
export type McSpec = (typeof MC_SPECS)[number];

/** 需要写入 CSS 变量的颜色角色（顺序即写入顺序，便于 diff） */
export const MC_ROLES = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "inversePrimary",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
  "surface",
  "surfaceDim",
  "surfaceBright",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
  "onSurface",
  "surfaceVariant",
  "onSurfaceVariant",
  "outline",
  "outlineVariant",
  "inverseSurface",
  "inverseOnSurface",
  "shadow",
  "scrim",
  "surfaceTint",
] as const;
export type McRole = (typeof MC_ROLES)[number];

/** 角色 → CSS 变量名（camelCase → --mc-kebab-case） */
export const ROLE_TO_CSS: Record<McRole, string> = Object.fromEntries(
  MC_ROLES.map((role) => [role, `--mc-${role.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`]),
) as Record<McRole, string>;

/** 种子色度与明度：固定中等值，保证任意色相都可用 */
const SEED_CHROMA = 60;
const SEED_TONE = 50;

export type McScheme = Record<McRole, string>;

/** 色相（0-360）→ 种子色 ARGB */
export function seedFromHue(hue: number): number {
  return Hct.from(normalizeHue(hue), SEED_CHROMA, SEED_TONE).toInt();
}

/** 把任意角度折算到 [0, 360) */
export function normalizeHue(hue: number): number {
  if (!Number.isFinite(hue)) return 0;
  return ((hue % 360) + 360) % 360;
}

function buildScheme(style: McStyle, isDark: boolean, seed: number, spec: McSpec): DynamicScheme {
  const hct = Hct.fromInt(seed);
  switch (style) {
    case "content":
      return new SchemeContent(hct, isDark, 0, spec);
    case "expressive":
      return new SchemeExpressive(hct, isDark, 0, spec);
    case "fidelity":
      return new SchemeFidelity(hct, isDark, 0, spec);
    case "fruitSalad":
      return new SchemeFruitSalad(hct, isDark, 0, spec);
    case "monochrome":
      return new SchemeMonochrome(hct, isDark, 0, spec);
    case "neutral":
      return new SchemeNeutral(hct, isDark, 0, spec);
    case "rainbow":
      return new SchemeRainbow(hct, isDark, 0, spec);
    case "vibrant":
      return new SchemeVibrant(hct, isDark, 0, spec);
    // tonalSpot（默认风格）与未知取值都回落到 TonalSpot
    default:
      return new SchemeTonalSpot(hct, isDark, 0, spec);
  }
}

/** 角色 → 解析器。每次调用就地构造，避免共享可变模块状态。 */
function roleResolvers(colors: MaterialDynamicColors): Record<McRole, DynamicColor> {
  return {
    primary: colors.primary(),
    onPrimary: colors.onPrimary(),
    primaryContainer: colors.primaryContainer(),
    onPrimaryContainer: colors.onPrimaryContainer(),
    inversePrimary: colors.inversePrimary(),
    secondary: colors.secondary(),
    onSecondary: colors.onSecondary(),
    secondaryContainer: colors.secondaryContainer(),
    onSecondaryContainer: colors.onSecondaryContainer(),
    tertiary: colors.tertiary(),
    onTertiary: colors.onTertiary(),
    tertiaryContainer: colors.tertiaryContainer(),
    onTertiaryContainer: colors.onTertiaryContainer(),
    error: colors.error(),
    onError: colors.onError(),
    errorContainer: colors.errorContainer(),
    onErrorContainer: colors.onErrorContainer(),
    surface: colors.surface(),
    surfaceDim: colors.surfaceDim(),
    surfaceBright: colors.surfaceBright(),
    surfaceContainerLowest: colors.surfaceContainerLowest(),
    surfaceContainerLow: colors.surfaceContainerLow(),
    surfaceContainer: colors.surfaceContainer(),
    surfaceContainerHigh: colors.surfaceContainerHigh(),
    surfaceContainerHighest: colors.surfaceContainerHighest(),
    onSurface: colors.onSurface(),
    surfaceVariant: colors.surfaceVariant(),
    onSurfaceVariant: colors.onSurfaceVariant(),
    outline: colors.outline(),
    outlineVariant: colors.outlineVariant(),
    inverseSurface: colors.inverseSurface(),
    inverseOnSurface: colors.inverseOnSurface(),
    shadow: colors.shadow(),
    scrim: colors.scrim(),
    surfaceTint: colors.surfaceTint(),
  };
}

function argbToHex(argb: number): string {
  return `#${[16, 8, 0]
    .map((shift) => ((argb >> shift) & 0xff).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** 解析出全部角色的十六进制色值 */
export function resolveScheme(
  hue: number,
  isDark: boolean,
  style: McStyle,
  spec: McSpec,
): McScheme {
  const scheme = buildScheme(style, isDark, seedFromHue(hue), spec);
  const resolvers = roleResolvers(scheme.colors);
  const result = {} as McScheme;
  for (const role of MC_ROLES) {
    result[role] = argbToHex(resolvers[role].getArgb(scheme));
  }
  return result;
}
