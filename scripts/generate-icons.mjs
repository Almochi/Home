#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
/**
 * 本地图标注册表生成器
 *
 * 输入：devDependencies 中的 @iconify-json/material-symbols 与 @iconify-json/simple-icons
 * 输出：
 *   - src/generated/icons.ts            运行时注册表（内联 SVG，零运行时依赖、零网络请求）
 *   - src/generated/icons.manifest.json 可用图标清单（供 scripts/check-design.mjs 校验配置里的图标名）
 *
 * 规则：
 *   - Material Symbols 优先取「Rounded」变体（与本站圆角形状语言一致），缺失时回落到默认变体；
 *   - 品牌图标取 simple-icons，统一 currentColor，跟随动态配色；
 *   - 任何一个图标名写错都会让脚本失败，避免上线后出现空白图标。
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** 界面图标（Material Symbols，Rounded 优先） */
const UI_ICONS = [
  "ac-unit",
  "air",
  "article",
  "bookmarks",
  "brightness-auto",
  "check",
  "check-circle",
  "close",
  "cloud",
  "dark-mode",
  "download",
  "error",
  "expand-less",
  "expand-more",
  "explore",
  "foggy",
  "format-quote",
  "fullscreen",
  "fullscreen-exit",
  "hourglass-top",
  "hub",
  "image",
  "info",
  "language",
  "light-mode",
  "local-fire-department",
  "mail",
  "monitor-heart",
  "music-note",
  "pause",
  "play-arrow",
  "public",
  "queue-music",
  "rainy",
  "refresh",
  "repeat",
  "schedule",
  "settings",
  "shuffle",
  "skip-next",
  "skip-previous",
  "smart-toy",
  "sunny",
  "thunderstorm",
  "tune",
  "visibility",
  "volume-off",
  "volume-up",
  "wallpaper",
  "warning",
  "weather-snowy",
];

/**
 * 品牌图标（simple-icons）：这一组同时是「用户可选图标面」，
 * 允许保留暂时未被组件引用的条目，方便在 config/links 里直接使用。
 */
const BRAND_ICONS = [
  "bilibili",
  "bluesky",
  "blogger",
  "discord",
  "github",
  "gmail",
  "instagram",
  "mastodon",
  "neteasecloudmusic",
  "qq",
  "rss",
  "telegram",
  "x",
  "youtube",
  "zhihu",
];

const materialSet = require("@iconify-json/material-symbols/icons.json");
const brandSet = require("@iconify-json/simple-icons/icons.json");
const materialPkg = require("@iconify-json/material-symbols/package.json");
const brandPkg = require("@iconify-json/simple-icons/package.json");

/** 解析别名，返回 { body, width, height } */
function readIcon(set, name) {
  const icon =
    set.icons[name] ?? (set.aliases?.[name] ? set.icons[set.aliases[name].parent] : null);
  if (!icon) return null;
  return {
    body: icon.body,
    width: icon.width ?? set.width ?? 24,
    height: icon.height ?? set.height ?? 24,
  };
}

function collect(set, names, { preferRounded = false, label }) {
  const result = {};
  const missing = [];
  const fellBack = [];
  for (const name of names) {
    let icon = preferRounded ? readIcon(set, `${name}-rounded`) : null;
    if (icon) {
      // 略过
    } else {
      if (preferRounded) fellBack.push(name);
      icon = readIcon(set, name);
    }
    if (!icon) {
      missing.push(name);
      continue;
    }
    result[name] = icon;
  }
  if (missing.length > 0) {
    console.error(`[icons] ${label} 中不存在的图标：${missing.join(", ")}`);
    process.exit(1);
  }
  if (fellBack.length > 0) {
    console.warn(`[icons] ${label} 无 Rounded 变体，已回落默认变体：${fellBack.join(", ")}`);
  }
  return result;
}

const material = collect(materialSet, UI_ICONS, { preferRounded: true, label: "material-symbols" });
const brand = collect(brandSet, BRAND_ICONS, { label: "simple-icons" });

/** 校验用户在 config/links/*.json 里写的图标名 */
const linkFiles = ["src/config/links/siteLinks.json", "src/config/links/socialLinks.json"];
const unknown = [];
for (const file of linkFiles) {
  const raw = JSON.parse(readFileSync(resolve(root, file), "utf8"));
  for (const item of raw) {
    if (!item.icon) continue;
    if (/\.(png|jpe?g|svg|webp|gif|avif)$/i.test(item.icon)) {
      unknown.push(`${file} → ${item.icon}（图片路径请写在 img 字段，icon 只接受图标名）`);
      continue;
    }
    const [prefix, name] = item.icon.includes(":") ? item.icon.split(":") : ["brand", item.icon];
    const found = prefix === "ui" ? material[name] : (brand[name] ?? material[name]);
    if (!found) unknown.push(`${file} → ${item.icon}`);
  }
}
if (unknown.length > 0) {
  console.error(`[icons] 配置里使用了未注册的图标：\n  ${unknown.join("\n  ")}`);
  console.error(
    "[icons] 请改用 src/generated/icons.manifest.json 中的名称，或把图标加入本脚本的清单。",
  );
  process.exit(1);
}

const header = `/* eslint-disable */
/**
 * 本文件由 scripts/generate-icons.mjs 自动生成，请勿手动修改。
 * 重新生成：pnpm icons
 * 图标来源：@iconify-json/material-symbols@${materialPkg.version} (Rounded 优先)、
 *           @iconify-json/simple-icons@${brandPkg.version}
 */
export interface IconData {
  /** SVG 内部标记（已含 currentColor） */
  body: string;
  width: number;
  height: number;
}
`;

const serialize = (map) =>
  Object.entries(map)
    .map(
      ([name, icon]) =>
        `  ${JSON.stringify(name)}: { body: ${JSON.stringify(icon.body)}, width: ${icon.width}, height: ${icon.height} },`,
    )
    .join("\n");

const output = `${header}
/** Material Symbols（界面图标） */
export const materialIcons: Record<string, IconData> = {
${serialize(material)}
};

/** simple-icons（品牌图标） */
export const brandIcons: Record<string, IconData> = {
${serialize(brand)}
};
`;

const outDir = resolve(root, "src/generated");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "icons.ts"), output);

writeFileSync(
  resolve(outDir, "icons.manifest.json"),
  `${JSON.stringify(
    {
      generatedBy: "scripts/generate-icons.mjs",
      sources: {
        materialSymbols: materialPkg.version,
        simpleIcons: brandPkg.version,
      },
      material: Object.keys(material),
      brand: Object.keys(brand),
    },
    null,
    2,
  )}\n`,
);

console.log(
  `[icons] 生成完成：Material ${Object.keys(material).length} 个、品牌 ${Object.keys(brand).length} 个 → src/generated/icons.ts`,
);
