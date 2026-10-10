# 命名规范

> 这份文档回答一个问题：**看到一个名字，能不能立刻知道它在哪一层、是什么东西、该写进哪个文件**。
> 它是 `AGENTS.md` 的补充，冲突时以本文为准；`pnpm design:lint` 是最终裁判。

## 0. 三条总则

1. **一个概念只有一个名字**——文件名、导出名、CSS 块名、词条键四者互相指认，不再各起一套。
2. **名字自带层级**——`use*` 一定住在同名的 `useXxx.ts`（`src/composables/` 或所属域目录），`m3-*` 一定是 Material 3 规范组件，`home:*` 一定是 localStorage 键，`index.ts` 一定是本目录的门面。
3. **不给同一个动作换动词**——天气是 `fetchWeather`（api）→ `useWeather`（composable），歌词是 `fetchLyric` → `parseLrc` → `loadLyricLines`。

## 1. 文件与目录

| 位置 | 规则 | 例 |
| --- | --- | --- |
| 组件 | PascalCase`.vue` | `FooterBar.vue` `HitokotoCard.vue` |
| TS 模块 | camelCase`.ts` | `wallpaperHue.ts` `documentHead.ts` |
| 语言包 | 语言代码 + 同名导出 | `zh.ts` → `zh`、`en.ts` → `en` |
| composable | `useXxx.ts`，且导出同名 `useXxx()` | `usePwa.ts` → `usePwa()` |
| 目录 | 全小写单词 | `components/atoms` `config/links` |
| barrel | 一律叫 `index.ts`，只转发本目录的概念 | `src/player/index.ts` `src/i18n/index.ts` |
| 配置模块 | `src/config/<域>.ts` 导出 `<域>` 或 `<域>Config` | `weather.ts` → `weatherConfig`；`themeDefaults.ts` → `themeDefaults` |

还有一条不写成规则但同样要守的：**文件名说明「是什么领域」，不说明「怎么实现」**。所以是 `documentHead.ts`（文档头）而不是 `meta.ts`（太泛），是 `visitorLocation.ts`（访客位置）而不是 `geoip.ts`（技术名），是 `colorScheme.ts`（配色方案）而不是 `hct.ts`（色彩空间名）。

模块名有两种合法形态，都要求能和导出对上：

1. **同名模块**——文件就是那个东西：`format.ts` → `formatClock` / `formatDuration`，`prefs.ts` → `ThemePrefs` / `loadThemePrefs`，`usePlayer.ts` → `usePlayer()`；
2. **领域模块**——文件是领域名，导出是它的动词与类型：`storage.ts` → `readJson` / `writeJson`，`http.ts` → `fetchJson` / `fetchText`，`music.ts` → `fetchPlaylist` / `fetchLyric`，`translate.ts` → `t`。

`t()` 是唯一一个「短到不指认文件名」的导出：i18n 的通行写法就是它，所以 `translate.ts` → `t` 是刻意保留的例外，不要为了对齐而改成 `translate()`。

## 2. 分层与导出

### `src/api`：请求与归一化

模块名 = 领域名，函数名 = `fetch` + 领域名。**组件不得直接 import 这一层**，一律经 composable。

| 模块 | 导出 |
| --- | --- |
| `http.ts` | `fetchJson` `fetchText` `HttpError` `FetchOptions` |
| `jsonp.ts` | `fetchJsonp`（与 `fetchJson` 同族，不要叫 `jsonp`） |
| `hitokoto.ts` | `Hitokoto` `fetchHitokoto` |
| `weather.ts` | `WeatherSnapshot` `fetchWeather` `resolveWeatherIcon` |
| `visitorLocation.ts` | `VisitorLocation` `fetchVisitorLocation` |
| `music.ts` | `Track` `buildMetingUrl` `parseMetingSong` `fetchPlaylist` `fetchLyric` |

### `src/player`：门面是 `usePlayer.ts`

| 文件 | 导出 | 只做一件事 |
| --- | --- | --- |
| `usePlayer.ts` | `usePlayer()` | 模块级单例状态机 + 原生 Audio |
| `lyrics.ts` | `LyricLine` `parseLrc` `findLyricIndex` `loadLyricLines` | 歌词域：纯解析 + 取回组合 |
| `mediaSession.ts` | `MediaSessionActions` `bindMediaSession` `clearMediaSession` | 系统媒体控制 |
| `index.ts` | 只转发 `usePlayer` | 域门面 |

三个动词的分工不变：`fetchLyric`（api，发一次请求回字符串）→ `parseLrc`（纯函数，LRC 文本 → `LyricLine[]`）→ `loadLyricLines`（取 + 解析，给引擎直接用）。

### `src/stores`：状态带前缀，动作不带

- 状态：`appState` / `themeState` / `snackbarItems`——被模板解构后仍自带语境。
- 动作：`notify` / `notifyError` / `dismiss`——调用点总是 `from "@/stores/snackbar"`，模块名已经给了语境。
- 例外是 `persistState` / `restorePersistedState` / `defaultPersistedState`：它们要和 `PersistedState` 类型同名，保留 `Persisted` 中缀。

### `src/theme`

| 文件 | 只做一件事 |
| --- | --- |
| `colorScheme.ts` | 纯计算：`resolveScheme` / `normalizeHue` / `seedFromHue` + `MC_*` 角色表 |
| `index.ts` | 主题运行时：`initTheme` / `updateTheme` / `resetTheme` / `setWallpaperHue` 改状态，`isMotionReduced` / `activeHue` 只读 |
| `prefs.ts` | 偏好契约与持久化：`ThemePrefs` / `loadThemePrefs` / `saveThemePrefs` |
| `wallpaperHue.ts` | `extractWallpaperHue` |

### `src/i18n`

| 文件 | 只做一件事 |
| --- | --- |
| `locales/zh.ts` | 词条真源，`I18nKey` 由它推导；`en.ts` 用 `Record<I18nKey, string>` 约束 |
| `translate.ts` | 字典 + `t()` 插值 |
| `locale.ts` | 语言检测与持久化：`Locale` / `LOCALES` / `locale` / `setLocale` |
| `useI18n.ts` | 组件内入口 |
| `index.ts` | 域门面，只转发 |

### `src/utils`

一个模块一个动词族：`storage.ts` 只管 `read*` / `write*`，`pick.ts` 只管 `pick*`（值域夹紧，不做任何 I/O），`format.ts` 只管 `format*`。

## 3. 动词表

| 前缀 | 含义 | 现有例子 |
| --- | --- | --- |
| `fetch*` | 发请求并归一化数据 | `fetchJson` `fetchWeather` `fetchVisitorLocation` |
| `load*` | 请求 + 解析，产出可直接用的结果 | `loadThemePrefs` `loadLyricLines` |
| `parse*` | 纯函数：原文 → 结构 | `parseLrc` `parseStartDate` |
| `build*` | 纯函数：拼地址 / 造结构 | `buildMetingUrl` |
| `compute*` | 纯函数：算统计量 | `computeTimeCapsule` `computeSiteAge` |
| `format*` | 纯函数：给人读的字符串 | `formatClock` `formatDuration` |
| `extract*` | 从素材里取特征 | `extractWallpaperHue` |
| `resolve*` | 多个候选里定唯一结果 | `resolveScheme` `resolveStartDate` |
| `pick*` | 从 unknown 安全取值并夹紧范围 | `pickBoolean` `pickNumber` `pickEnum` |
| `read*` / `write*` | 存储读写 | `readJson` / `writeJson` |
| `set*` `toggle*` `open*` `close*` | 改状态 | `setVolume` `toggleShowcase` |
| `is*` / `has*` | 布尔判定 | `isMotionReduced` `hasTracks` |
| `sync*` | 把状态推到外部（DOM / 音频 / 媒体会话） | `syncDocumentHead` `syncPreferences` |
| `bind*` / `clear*` | 挂到外部 API / 清空外部状态 | `bindMediaSession` / `clearMediaSession` |
| `use*` | 组合式函数：必须单独放进同名的 `useXxx.ts` | `useTicker` `useWeather` `usePlayer` `useI18n` |
| `init*` | 一次性初始化 | `initTheme` |

## 4. 布尔与状态

- **布尔字段 = 归属 + 状态**：`wallpaperReady` `playlistReady` `playerPlaying` `settingsOpen` `infoOpen` `playlistOpen` `musicPanelOpen` `showcaseMode` `showSiteAge`
  - 不写 `is` 前缀（`isPlaying` ✗）：字段在 `appState` 下已经带了主语，`is` 是重复的；
  - 不用光秃秃的名词（`showcase` ✗）：读不出这是布尔值。
- **布尔函数用 `is*` / `has*`**：`isMotionReduced()`、`hasTracks`。
- **异步状态只有一份类型**：`src/types/status.ts` 的 `AsyncStatus`（`idle | loading | ready | error`）。播放器、天气、壁纸共用，不再各写一份同构联合。

## 5. CSS

| 规则 | 例 |
| --- | --- |
| 块名 = 文件名 kebab-case | `FooterBar.vue` → `.footer-bar`；`ClockWeather.vue` → `.clock-weather` |
| Material 3 规范组件用 `m3-<规范短名>` | `Button.vue` → `.m3-button`；`Dialog.vue` → `.m3-dialog`；`Sheet.vue` → `.m3-sheet` |
| 元素用 `__`，修饰用 `--` | `.footer-bar__lyric`、`.app-shell__grid--showcase` |
| 状态也是修饰符，不引入 `is-` | `.playlist-dialog__item--active`、`.background-layer--ready` |
| 全局工具类只在 `src/styles/utilities.css` 声明 | `.sr-only` `.text-truncate` `.m3-state-layer` |
| 过渡名 `m3-<动效名>` | 共享的在 `transitions.css`（`m3-fade` `m3-swap`），组件专属的可以留在 scoped（`m3-curtain`） |

好处很直接：模板里出现一个孤零零的 `.links` 时，能立刻知道它属于谁；`grep FooterBar` 能一次找齐样式、模板与文档。
`pnpm design:lint` 会检查每个 `.vue` 的 `<style>` 里的块名是否等于文件名派生值（`m3-*`、全局工具类、Vue 过渡类除外）。

## 6. 词条（i18n）

- 键**全小写点分**，每段只能是 `[a-z][a-z0-9]*`：`settings.appearance.hue.custom`，不是 `hueCustom`。
- 结构 = `<领域>.<分组>.<词>`：`music.loop.one`、`a11y.theme.toggle`、`weather.wind.suffix`、`music.play.failed.next`。
- 中文 `zh.ts` 是真源（语言包文件名就是语言代码，导出同名）；`en.ts` 用 `Record<I18nKey, string>` 约束，缺词条直接编译失败；参数占位符中英同名。
- **不要拼键名**。枚举值（`McStyle` 的 `tonalSpot`）是数据标识，词条键是界面标识，两者不同名时用显式映射表：
  - `AppearancePicker.vue` 的 `STYLE_LABEL: Record<McStyle, I18nKey>`
  - `InfoSheet.vue` 的 `CHANGELOG_LABEL: Record<ChangelogItem["type"], I18nKey>`
  - `utils/capsule.ts` 的 `CAPSULE_LABEL: Record<CapsuleUnit, I18nKey>`

  映射表由 `Record` 约束，新增枚举值时不补标签就编译不过；拼字符串则要等到运行时才发现。
- 全仓库已无 `t(\`...${x}\`)` 动态键，也没有 `as I18nKey` 强转。

## 7. 常量与配置

| 形态 | 规则 | 例 |
| --- | --- | --- |
| `src/config/<域>.ts` 的导出 | `<域>` 或 `<域>Config`，二选一 | `breakpoints.ts` → `breakpoints`；`weather.ts` → `weatherConfig` |
| 模块内「要改就动这里」的原始块 | `<域>Raw`，私有不导出 | `siteRaw` `musicRaw` `weatherRaw` `greetingRaw`；`config/links` 的 `siteRaw` / `socialRaw` |
| 字面量表 / 键名 | SCREAMING_SNAKE | `MC_STYLES` `MC_SPECS` `PERSISTED_KEYS` `THEME_STORAGE_KEY` `DEFAULT_THEME_PREFS` `WALLPAPER_PLACEHOLDERS` |
| 存储键 | `home:<域>` | `home:prefs` `home:theme` `home:locale` |
| 类型 | PascalCase 单数 | `SiteLink` `WallpaperSource` `WeatherSnapshot` |
| 联合类型取值 | 全小写字符串 | `"idle" \| "loading"`；跟随库枚举的 `"tonalSpot"` 例外 |

配置只允许两种写法，因为它们是两件事：**`<域>` 是「文件里直接就是那张表」，`<域>Config` 是「顶部有 `<域>Raw` 原始块 + 归一化派生」**。判断标准就一句：有没有派生逻辑。

## 8. 怎么保证不回退

```bash
pnpm design:lint   # 文件名 / 符号名 / CSS 块名 / 词条键 / 依赖方向 / 设计令牌
pnpm typecheck     # 词条键与配置字段：改错一处就是编译错误
```

`design:lint` 里与命名有关的检查：

1. `.vue` 必须 PascalCase，`src/` 下的 `.ts` 必须 camelCase（语言包也不例外：`zh.ts`）；
2. `use*` 必须与文件同名，且只能住在 `src/composables/` 或**所属域目录**（`src/player/usePlayer.ts`、`src/i18n/useI18n.ts`）；住在 `src/utils` 或 `src/components` 直接报错；
3. `src/config/<域>.ts` 的导出必须是 `<域>` / `<域>Config` / SCREAMING_SNAKE 字面量表三者之一；
4. 每个组件的样式块名必须由文件名派生，或使用 `m3-*` 规范名；
5. 词条键必须全小写点分，且中文词条必须被**完整**引用（带引号边界，`links.open` 不会再被 `links.openNewTab` 掩盖成「已使用」）。
