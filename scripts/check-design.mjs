#!/usr/bin/env node
/**
 * 设计令牌校验（pnpm design:lint）
 *
 * 把 DESIGN.md 的「不要硬编码」从口头约定变成可执行的检查：
 *
 * 1. 令牌化：.vue 的 <style> 与内联 style 中不得出现
 *    - 硬编码颜色（#hex / rgb() / rgba() / hsl()）
 *    - 硬编码圆角（border-radius 必须取 --shape-corner-*）
 *    - 硬编码动效时长（必须取 --m3e-duration-*）
 *    - 硬编码字号（必须取 --m3e-type-* / --m3e-size-* / --m3e-icon-size-*）
 *    - 硬编码层级（z-index 必须取 --m3e-z-*）
 *    - 未声明理由的 !important
 * 2. 断点：@media 的像素值必须来自 src/config/breakpoints.ts
 * 3. 清单：atoms/manifest.json 与实际文件一一对应
 * 4. 图标：配置与模板中出现的图标名必须已注册（含 typo 检查）
 * 5. 命名：.vue 必须是 PascalCase，.ts 必须是 camelCase（语言包用 BCP 47 标签）
 * 6. 符号命名：use* 必须与文件同名（src/composables 或所属域）；config 导出必须指认文件名；
 *    .vue 的样式块必须由文件名派生
 *    （Material 3 规范组件用 m3- 前缀；元素 __ / 修饰 -- 只在块名之下派生）
 * 7. 依赖方向：原子只依赖令牌与生成物；组件不得反向依赖；组件不直接发请求
 * 8. 词条：键必须全小写点分；中文词条必须被引用，且中英占位符必须同名
 * 9. 配置入口：配置只允许来自 src/config，禁止 import.meta.env
 *
 * 例外写法（必须写明理由，便于评审）：
 *   /* design-allow: 图像遮罩需要固定黑色以保证对比度 *\/
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ALLOW = /design-allow:\s*\S/;

/** 令牌层自身当然会出现具体数值：其余文件必须走令牌 */
const FILE_ALLOWLIST = new Set([
  "src/styles/tokens.css",
  "src/styles/base.css",
  "src/styles/utilities.css",
  "src/theme/colorScheme.ts",
  "src/theme/wallpaperHue.ts",
]);

for (const rel of FILE_ALLOWLIST) {
  if (!existsSync(resolve(root, rel))) {
    console.error(`[design] 令牌允许清单引用了不存在的文件：${rel}`);
    process.exit(1);
  }
}

const IGNORED_DIRS = new Set(["node_modules", "dist", ".git"]);

function walk(dir) {
  const result = [];
  for (const name of readdirSync(dir)) {
    if (IGNORED_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result;
}

const files = [...walk(resolve(root, "src")), ...walk(resolve(root, "scripts"))];
const violations = [];
const report = (file, line, message) => violations.push({ file, line, message });

/** 用空格替换注释，保持行号不变，避免注释里的示例被误判 */
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/(^|\s)\/\/[^\n]*/g, (match) => match.replace(/[^\n]/g, " "));
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}

function isAllowed(source, index) {
  const lines = source.split("\n");
  const line = lineOf(source, index);
  return ALLOW.test(lines[line - 1] ?? "") || ALLOW.test(lines[line - 2] ?? "");
}

/* -------------------------------------------------------------------------- */
/* 规则实现                                                                    */
/* -------------------------------------------------------------------------- */
const ALLOWED_RADIUS = /^(?:var\(--shape-corner-[a-z]+\)|var\(--radius-[a-z]+\)|inherit|0|50%)$/;
const ALLOWED_FONT_SIZE = /^(?:var\(--m3e-(?:type|size|icon-size)-[\w-]+\)|inherit|100%)$/;

const RULES = [
  {
    // 颜色字面量
    pattern: /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g,
    message: (value) =>
      `硬编码颜色 "${value}"：请改用语义令牌（--primary / --on-surface / --surface-* 等）`,
  },
  {
    // 圆角
    pattern: /border-radius:\s*([^;]+);/g,
    capture: true,
    validate: (value) =>
      value
        .trim()
        .split(/\s+/)
        .every((part) => ALLOWED_RADIUS.test(part)),
    message: (value) => `硬编码圆角 "${value}"：请使用 --shape-corner-xs/s/m/l/xl/full`,
  },
  {
    // 字号
    pattern: /font-size:\s*([^;]+);/g,
    capture: true,
    validate: (value) => ALLOWED_FONT_SIZE.test(value.trim()),
    message: (value) =>
      `硬编码字号 "${value}"：请使用 --m3e-type-* / --m3e-size-* / --m3e-icon-size-*`,
  },
  {
    // 动效时长
    pattern: /\b\d+(?:\.\d+)?m?s\b/g,
    validate: (value) => value === "0s" || value === "0ms",
    message: (value) => `硬编码动效时长 "${value}"：请使用 --m3e-duration-short/medium/long`,
  },
  {
    // 层级：浮层之间不应互相攀比数值，统一取 --m3e-z-*
    pattern: /z-index:\s*([^;]+);/g,
    capture: true,
    validate: (value) => /^var\(--m3e-z-[a-z-]+\)$/.test(value.trim()),
    message: (value) => `硬编码层级 "${value}"：请使用 --m3e-z-* 令牌（src/styles/tokens.css）`,
  },
  {
    pattern: /!important/g,
    message: () => "出现 !important：请先检查层叠顺序，确需覆盖时补 design-allow 注释",
  },
];

/** 取出 <style> 段与内联 style 属性 */
function styleSegments(source) {
  const segments = [];
  const block = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let match = block.exec(source);
  while (match) {
    segments.push({ code: match[1], start: lineOf(source, match.index) });
    match = block.exec(source);
  }
  const inline = /style="([^"]*)"/g;
  match = inline.exec(source);
  while (match) {
    segments.push({ code: match[1], start: lineOf(source, match.index) });
    match = inline.exec(source);
  }
  return segments;
}

function checkSegment(rel, code, startLine) {
  const cleaned = stripComments(code);
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let match = rule.pattern.exec(cleaned);
    while (match) {
      const value = rule.capture ? match[1] : match[0];
      const violated = rule.validate ? !rule.validate(value) : true;
      const absolute = startLine + lineOf(cleaned, match.index) - 1;
      if (violated && !isAllowed(code, match.index)) {
        report(rel, absolute, rule.message(value.trim()));
      }
      match = rule.pattern.exec(cleaned);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* 1 + 2：组件样式、断点                                                        */
/* -------------------------------------------------------------------------- */
const breakpointSource = readFileSync(resolve(root, "src/config/breakpoints.ts"), "utf8");
const breakpointValues = [...breakpointSource.matchAll(/^\s*\w+:\s*(\d+),/gm)].map((m) =>
  Number(m[1]),
);
const allowedBreakpoints = new Set(breakpointValues.flatMap((value) => [value, value - 1]));
if (allowedBreakpoints.size === 0) {
  console.error("[design] 未能从 src/config/breakpoints.ts 解析断点，请检查文件格式。");
  process.exit(1);
}

for (const file of files) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const ext = extname(file);
  if (![".vue", ".css", ".ts", ".mjs"].includes(ext)) continue;
  const source = readFileSync(file, "utf8");

  if (ext === ".vue" && !FILE_ALLOWLIST.has(rel)) {
    for (const segment of styleSegments(source)) {
      checkSegment(rel, segment.code, segment.start);
    }
  }

  if (ext === ".css" && !FILE_ALLOWLIST.has(rel)) {
    checkSegment(rel, source, 1);
  }

  if (ext === ".vue" || ext === ".css") {
    const media = /@media[^{]*?\((?:min|max)-width:\s*(\d+)px\)/g;
    let match = media.exec(source);
    while (match) {
      const value = Number(match[1]);
      if (!allowedBreakpoints.has(value) && !isAllowed(source, match.index)) {
        report(
          rel,
          lineOf(source, match.index),
          `断点 ${value}px 未登记；可用值：${[...allowedBreakpoints].sort((a, b) => a - b).join(", ")}`,
        );
      }
      match = media.exec(source);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* 3：原子清单                                                                  */
/* -------------------------------------------------------------------------- */
const atomsDir = resolve(root, "src/components/atoms");
const manifest = JSON.parse(readFileSync(join(atomsDir, "manifest.json"), "utf8"));
const declared = new Set(manifest.atoms.map((atom) => atom.file));
const actual = readdirSync(atomsDir).filter((name) => name.endsWith(".vue"));
for (const name of actual) {
  if (!declared.has(name)) report("src/components/atoms/manifest.json", 1, `原子 ${name} 未登记`);
}
for (const name of declared) {
  if (!actual.includes(name))
    report("src/components/atoms/manifest.json", 1, `manifest 中的 ${name} 不存在`);
}

/* -------------------------------------------------------------------------- */
/* 4：图标名                                                                    */
/* -------------------------------------------------------------------------- */
const iconManifest = JSON.parse(
  readFileSync(resolve(root, "src/generated/icons.manifest.json"), "utf8"),
);
const knownIcons = new Set([...iconManifest.material, ...iconManifest.brand]);
const isDynamic = (name) => /[:{}()$]/.test(name);

function checkIconName(name, file, line) {
  if (isDynamic(name)) return;
  const [, bare] = name.includes(":") ? name.split(":") : ["", name];
  if (!knownIcons.has(bare)) {
    report(
      file,
      line,
      `图标 "${name}" 未注册；请加入 scripts/generate-icons.mjs 后运行 pnpm icons`,
    );
  }
}

for (const file of files) {
  const rel = relative(root, file).replaceAll("\\", "/");
  if (!/\.(vue|ts|json)$/.test(rel)) continue;
  const source = readFileSync(file, "utf8");
  // 只看静态写法 icon="..."，动态绑定 :icon="x" 交给运行时兜底
  const attr = /(?<![:\w-])icon="([^"]+)"/g;
  let match = attr.exec(source);
  while (match) {
    checkIconName(match[1], rel, lineOf(source, match.index));
    match = attr.exec(source);
  }
  if (rel.startsWith("src/config/")) {
    const jsonIcon = /"icon":\s*"([^"]+)"/g;
    match = jsonIcon.exec(source);
    while (match) {
      if (/\.(png|jpe?g|svg|webp|gif|avif)$/i.test(match[1])) {
        report(
          rel,
          lineOf(source, match.index),
          `"icon" 里出现图片路径 "${match[1]}"：图片请写在 "img" 字段`,
        );
      } else {
        checkIconName(match[1], rel, lineOf(source, match.index));
      }
      match = jsonIcon.exec(source);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* 5：文件命名（大小写与风格只有一种写法）                                        */
/* -------------------------------------------------------------------------- */
const NAME_RULES = [
  {
    test: (rel) => rel.endsWith(".vue"),
    pattern: /^[A-Z][A-Za-z0-9]*\.vue$/,
    hint: "组件文件名必须是 PascalCase（如 LinkGrid.vue）",
  },
  {
    test: (rel) => rel.startsWith("src/") && rel.endsWith(".ts"),
    pattern: /^[a-z][A-Za-z0-9]*\.ts$/,
    hint: "TS 模块文件名必须是 camelCase（如 wallpaperHue.ts / zh.ts），禁止 kebab-case / snake_case",
  },
];

for (const file of files) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const rule = NAME_RULES.find((item) => item.test(rel));
  if (rule && !rule.pattern.test(rel.split("/").pop())) {
    report(rel, 1, `命名不合规："${rel.split("/").pop()}" —— ${rule.hint}`);
  }
}

/* -------------------------------------------------------------------------- */
/* 6：符号命名（文件 ↔ 导出 ↔ 类名，只有一种写法）                                */
/* -------------------------------------------------------------------------- */

/** Vue <Transition> 生成的类（m3-curtain-leave-active）属于动效，不是组件块 */
const TRANSITION_SUFFIX = /-(?:enter|leave|appear)(?:-(?:active|from|to))?$|-move$/;
const baseClass = (name) => name.split("__")[0].split("--")[0];
const toKebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** 样式层声明的全局工具类（sr-only / text-truncate / m3-state-layer…），组件引用它们不算「自己的块」 */
const GLOBAL_CLASSES = new Set();
for (const rel of ["src/styles/utilities.css", "src/styles/transitions.css"]) {
  const css = readFileSync(resolve(root, rel), "utf8");
  for (const match of css.matchAll(/\.([a-zA-Z][\w-]*)/g)) GLOBAL_CLASSES.add(baseClass(match[1]));
}

for (const file of files) {
  const rel = relative(root, file).replaceAll("\\", "/");
  if (!/\.(vue|ts)$/.test(rel)) continue;
  const source = readFileSync(file, "utf8");
  const name = rel.split("/").pop();

  // use* 是响应式门面：必须与文件同名，且只能住在 src/composables 或所属域目录
  for (const match of stripComments(source).matchAll(
    /export\s+(?:async\s+)?function\s+(use[A-Z]\w*)/g,
  )) {
    const dir = rel.slice(0, rel.lastIndexOf("/"));
    const composable = match[1];
    if (name === `${composable}.ts` && dir !== "src/utils" && dir !== "src/components") continue;
    report(
      rel,
      lineOf(source, match.index),
      dir === "src/utils" || dir === "src/components"
        ? `composable "${composable}" 不能住在 ${dir}：请改成 src/composables/${composable}.ts`
        : `文件名与导出不一致：${rel} 里的 "${composable}" 必须单独放进 ${composable}.ts`,
    );
  }

  // 配置模块：<域>.ts 只能导出 <域> / <域>Config，或 SCREAMING_SNAKE 字面量表
  if (/^src\/config\/[^/]+\.ts$/.test(rel)) {
    const stem = name.slice(0, -3);
    for (const match of stripComments(source).matchAll(
      /^export\s+(?:const|function|class|interface|type)\s+([A-Za-z_$][\w$]*)/gm,
    )) {
      const symbol = match[1];
      if (symbol === stem || symbol === `${stem}Config` || /^[A-Z][A-Z0-9_]*$/.test(symbol)) {
        continue;
      }
      report(
        rel,
        lineOf(source, match.index),
        `配置模块导出 "${symbol}" 与文件名不符：${name} 只能导出 ${stem} / ${stem}Config，或 SCREAMING_SNAKE 字面量表`,
      );
    }
  }
  if (rel.startsWith("src/composables/") && rel.endsWith(".ts")) {
    const expected = name.slice(0, -3);
    if (!new RegExp(`export\\s+(?:async\\s+)?function\\s+${expected}\\b`).test(source)) {
      report(rel, 1, `文件名与导出不一致：src/composables/${name} 必须导出 ${expected}()`);
    }
  }

  // 组件的样式块名必须由文件名派生；Material 3 规范组件用 m3- 前缀
  if (!rel.startsWith("src/components/") || !rel.endsWith(".vue")) continue;
  const style = /<style[^>]*>([\s\S]*?)<\/style>/.exec(source);
  if (!style) continue;
  const expected = toKebab(name.slice(0, -4));
  const foreign = new Set();
  for (const match of style[1].matchAll(/\.([a-zA-Z][\w-]*)/g)) {
    const base = baseClass(match[1].replace(TRANSITION_SUFFIX, ""));
    if (base.startsWith("m3-") || GLOBAL_CLASSES.has(base) || base === expected) continue;
    foreign.add(base);
  }
  for (const block of foreign) {
    const at = style.index + style[1].indexOf(`.${block}`);
    report(
      rel,
      lineOf(source, at),
      `块名 ".${block}" 与文件名不符：${name} 只能用 .${expected}（元素 __x、修饰 --x）或 m3-* 规范名`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* 7：依赖方向（atoms → molecules → organisms → layout，禁止反向依赖）            */
/* -------------------------------------------------------------------------- */
const LAYER_RULES = [
  {
    name: "atoms",
    test: (rel) => rel.startsWith("src/components/atoms/"),
    allowed: [/^vue$/, /^@\/components\/atoms(\/|$)/, /^@\/generated(\/|$)/],
    hint: "原子只允许依赖 vue、同级原子与 src/generated；需要 composable/store 请下沉到 molecules",
  },
  {
    name: "molecules",
    test: (rel) => rel.startsWith("src/components/molecules/"),
    allowed: [
      /^vue$/,
      /^@\/components\/(atoms|molecules)(\/|$)/,
      /^@\/(composables|stores|config|i18n|utils|types|theme|player|generated)(\/|$)/,
    ],
    hint: "分子不得依赖 organisms / layout",
  },
  {
    name: "organisms",
    test: (rel) => rel.startsWith("src/components/organisms/"),
    allowed: [
      /^vue$/,
      /^@\/components\/(atoms|molecules|organisms)(\/|$)/,
      /^@\/(composables|stores|config|i18n|utils|types|theme|player|generated|api)(\/|$)/,
    ],
    hint: "有机体不得依赖 layout 与根组件",
  },
  {
    name: "layout",
    test: (rel) => rel.startsWith("src/components/layout/"),
    allowed: [
      /^vue$/,
      /^@\/components(\/|$)/,
      /^@\/(composables|stores|config|i18n|utils|types|theme|player|generated)(\/|$)/,
    ],
    hint: "布局层只负责骨架与栅格",
  },
  {
    // 数据 / 状态 / 领域层不得反向依赖组件：请求与状态不经过视图
    name: "非 UI 层",
    test: (rel) =>
      /^src\/(api|composables|config|i18n|player|stores|theme|types|utils)\//.test(rel),
    forbidden: [/^@\/components(\/|$)/],
    hint: "数据 / 状态 / 配置 / 工具层不得反向依赖组件",
  },
  {
    // 组件要发请求必须先经过 composable：便于统一超时、取消与降级
    name: "组件层",
    test: (rel) => rel.startsWith("src/components/"),
    forbidden: [/^@\/api(\/|$)/],
    hint: "组件不得直接依赖 src/api，请通过 composable 暴露的接口获取数据",
  },
];

const IMPORT_PATTERN = /(?:from\s+|import\()\s*["']([^"']+)["']/g;

for (const file of files) {
  const rel = relative(root, file).replaceAll("\\", "/");
  if (!/\.(vue|ts)$/.test(rel)) continue;
  const source = readFileSync(file, "utf8");
  for (const rule of LAYER_RULES) {
    if (!rule.test(rel)) continue;
    const cleaned = stripComments(source);
    IMPORT_PATTERN.lastIndex = 0;
    let match = IMPORT_PATTERN.exec(cleaned);
    while (match) {
      const specifier = match[1];
      const allowed = rule.allowed
        ? rule.allowed.some((pattern) => pattern.test(specifier))
        : !rule.forbidden.some((pattern) => pattern.test(specifier));
      if (!allowed) {
        report(rel, lineOf(cleaned, match.index), `依赖越界："${specifier}" —— ${rule.hint}`);
      }
      match = IMPORT_PATTERN.exec(cleaned);
    }
    break;
  }
}

/* -------------------------------------------------------------------------- */
/* 8：词条（键全小写点分；中文是真源：不许留死词条，占位符必须中英同名）          */
/* -------------------------------------------------------------------------- */
const ENTRY_PATTERN = /^\s*"([^"]+)":\s*"((?:[^"\\]|\\.)*)",\s*$/gm;

function readEntries(rel) {
  const source = readFileSync(resolve(root, rel), "utf8");
  const entries = new Map();
  ENTRY_PATTERN.lastIndex = 0;
  let match = ENTRY_PATTERN.exec(source);
  while (match) {
    entries.set(match[1], match[2]);
    match = ENTRY_PATTERN.exec(source);
  }
  return entries;
}

const zhEntries = readEntries("src/i18n/locales/zh.ts");
if (zhEntries.size === 0) {
  console.error("[design] 未能解析 src/i18n/locales/zh.ts 的词条，请检查文件格式。");
  process.exit(1);
}
const enEntries = readEntries("src/i18n/locales/en.ts");

/** 词条键必须是全小写点分：settings.appearance.hue.custom，而不是 hueCustom */
for (const key of zhEntries.keys()) {
  if (key.split(".").every((segment) => /^[a-z][a-z0-9]*$/.test(segment))) continue;
  report(
    "src/i18n/locales/zh.ts",
    1,
    `词条键 "${key}" 必须全小写点分（每段只允许 [a-z][a-z0-9]*，多词请再分层）`,
  );
}

const placeholders = (value) =>
  [...value.matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(",");

for (const [key, value] of zhEntries) {
  if (!enEntries.has(key)) {
    report("src/i18n/locales/en.ts", 1, `缺少词条 "${key}"`);
    continue;
  }
  if (placeholders(value) !== placeholders(enEntries.get(key))) {
    report(
      "src/i18n/locales/en.ts",
      1,
      `词条 "${key}" 的占位符与中文不一致（中文：${placeholders(value) || "无"}）`,
    );
  }
}

const textCorpus = files
  .map((file) => relative(root, file).replaceAll("\\", "/"))
  .filter((rel) => /\.(vue|ts|json)$/.test(rel) && !rel.startsWith("src/i18n/locales/"))
  .map((rel) => readFileSync(resolve(root, rel), "utf8"))
  .join("\n");

/** 模板字符串的起始标记：写成常量，避免校验脚本自身出现嵌套模板 */
const TEMPLATE_MARK = "${";

/** 支持 t(`settings.style.${id}`) 这类拼接：出现「前缀 + ${」即视为被引用 */
function isDynamicallyUsed(key) {
  const parts = key.split(".");
  for (let i = parts.length - 1; i >= 1; i -= 1) {
    const prefix = parts.slice(0, i).join(".");
    // 拼接写法：`settings.style.${id}` 或 "settings.style." + id
    if (textCorpus.includes(`${prefix}.${TEMPLATE_MARK}`)) return true;
    if (textCorpus.includes(`${prefix}." +`) || textCorpus.includes(`${prefix}.' +`)) return true;
  }
  return false;
}

/**
 * 词条是否被引用：必须出现完整的键名（带引号边界）。
 * 早期实现用裸 includes，links.open 会被 links.openNewTab 这种「前缀相同的长键」掩盖成已引用，
 * 于是死词条永远查不出来。这里要求键名两侧是引号或反引号。
 */
function isLiterallyUsed(key) {
  return (
    textCorpus.includes(`"${key}"`) ||
    textCorpus.includes(`'${key}'`) ||
    textCorpus.includes(`\`${key}\``)
  );
}

const deadKeys = [...zhEntries.keys()].filter(
  (key) => !isLiterallyUsed(key) && !isDynamicallyUsed(key),
);
if (deadKeys.length > 0) {
  report("src/i18n/locales/zh.ts", 1, `以下词条没有被任何地方引用，请删除：${deadKeys.join(", ")}`);
}

/* -------------------------------------------------------------------------- */
/* 9：配置入口（只有 src/config 一处，全仓库禁止 import.meta.env）                */
/* -------------------------------------------------------------------------- */
for (const file of files) {
  const rel = relative(root, file).replaceAll("\\", "/");
  if (!rel.startsWith("src/") || !/\.(vue|ts)$/.test(rel)) continue;
  const source = stripComments(readFileSync(file, "utf8"));
  const match = /import\.meta\.env/.exec(source);
  if (match) {
    report(
      rel,
      lineOf(source, match.index),
      "配置只有一个入口：请写进 src/config，不要读 import.meta.env（构建期由 vite.config 读取同一份配置）",
    );
  }
}

/* -------------------------------------------------------------------------- */
/* 输出                                                                        */
/* -------------------------------------------------------------------------- */
const corpus = files
  .filter((file) => /\.(vue|ts|json)$/.test(file))
  // 生成物自身包含全部图标名，必须排除，否则「未引用」提示永远为空
  .filter((file) => !relative(root, file).replaceAll("\\", "/").startsWith("src/generated/"))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
// 品牌图标是用户可选面，允许保留未引用条目；只提示未被引用的 Material 图标
const unused = iconManifest.material.filter((name) => !corpus.includes(name));
if (unused.length > 0) {
  console.log(
    `[design] 提示：Material 图标已注册但未被引用，可从 scripts/generate-icons.mjs 移除 → ${unused.join(", ")}`,
  );
}

if (violations.length > 0) {
  console.error(`\n[design] 发现 ${violations.length} 处违反设计令牌约定：\n`);
  for (const item of violations) {
    console.error(`  ${item.file}:${item.line}  ${item.message}`);
  }
  console.error(
    "\n规则见 DESIGN.md「Do's and Don'ts」与 NAMING.md（命名），确需例外时补 design-allow 注释。\n",
  );
  process.exit(1);
}

console.log(
  `[design] 通过：颜色、圆角、动效、字号、层级、断点、文件名、符号名、依赖方向、原子清单、图标名、${zhEntries.size} 条词条均合规。`,
);
