简体中文 | [English](./README_EN.md)

<div align="center">

# 杏团の主页

**一个以 Material 3 Expressive 设计令牌实现的个人引导页**

整屏壁纸、动态 HCT 配色、可自适应的明暗与动效偏好，以及一套完全自研的 M3E 组件。

![Vue](https://img.shields.io/badge/Vue-3.5-42B883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Material 3 Expressive](https://img.shields.io/badge/Material%203-Expressive-6750A4)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)

</div>

## ✦ 这是什么

一个没有路由、没有后端的单页引导页，所有状态都在浏览器里。三条主线撑起整个项目：

- **设计令牌**：颜色、圆角、字号、动效、层级、间距全部收敛到 `src/styles/tokens.css`，组件里不出现色值与 `!important`；
- **配置层**：站点身份、凭据、行为、外观只有一个入口 —— `src/config`，全仓库禁止 `import.meta.env`；
- **自研原子组件**：Button / IconButton / Chip / Switch / Slider / SegmentedButton / Progress / Loading / Tooltip / Surface / Divider / Icon 共 12 个，没有 UI 框架。

依赖只有 `vue` 与 `@material/material-color-utilities`；构建产物 JS ≈ 88 KB gzip（配色引擎 18 KB 单独分包）、CSS ≈ 9 KB gzip。

## ✦ 功能

- [x] 整屏壁纸：自托管默认插画（4 档分辨率 `srcset`）+ 本地图集 + Bing 每日一图 + 随机壁纸 + 随机二次元，支持下载原图
- [x] 壁纸展示模式（隐藏所有面板，`Esc` 退出）
- [x] 时钟 / 日期 / 实时天气（按访客 IP 自动定位城市；默认免密钥数据源，可切 Azure Maps；数据源不可用时整行退场）
- [x] 一言（点击换一句）
- [x] 站点链接网格与社交链接
- [x] 时光胶囊（今日 / 本周 / 本月 / 本年进度）与建站时长
- [x] 音乐播放器：歌单、歌词、进度、音量、循环/随机、MediaSession 媒体键
- [x] 动态配色设置：明暗模式、种子色相、9 种调色板风格、Material 2021/2025、动效偏好
- [x] 离线可用（PWA）与新版本提示
- [x] 响应式：桌面双栏、窄屏单栏，移动端底部面板

## ✦ 实现要点

### 设计令牌与配色

- 颜色角色由 `@material/material-color-utilities` 按「种子色相 × 调色板风格 × 规范版本 × 明暗」实时解析出 **35 个角色**，写入 `--mc-*`；样式层同时给出基于 `--hue` 的 oklch 回退，无 JS 时首帧也不闪白。
- **跟随壁纸取色**：把当前壁纸缩到 24×24 后逐像素转 HCT，按感知色度加权取主色相作为种子色；跨域污染或图片过灰时自动回落配置色相。
- 任何一次调色板应用都经 `requestAnimationFrame` 合并，拖拽色相滑块不会逐帧重算 35 个角色；「减少动效」下不播放明暗过渡。

### 组件、图标与命名

- 组件分层为 `atoms → molecules → organisms → layout`，低层不得 import 高层；组件不得直接 import `@/api`（经 composable 取数）。
- 图标由 `scripts/generate-icons.mjs` 从 `@iconify-json` 抽取 Material Symbols（Rounded 优先）与 simple-icons，生成内联 SVG 注册表：零运行时依赖、零外部请求、写错图标名会在校验阶段失败。
- 文件、导出、CSS 块名、词条键四者互相指认：composable 只能住 `src/composables` 且与文件同名（`usePwa.ts` → `usePwa()`），组件样式块名由文件名派生（`FooterBar.vue` → `.footer-bar`，M3 规范组件用 `m3-*`），词条键全小写点分。完整规则见 [`NAMING.md`](./NAMING.md)。

### 配置、状态与持久化

- 站点身份、凭据、行为、外观全部有类型地写在 `src/config`，每个模块顶部是「要改就动这里」的常量；`index.html` 的标题 / 描述 / 图标由 `vite.config.ts` 读取同一份配置在构建期注入。
- 所有 `localStorage` 读写走 `src/utils/storage.ts`（`{ version, data }` 信封，结构不符就回落默认值），键名统一在 `home:` 命名空间：`home:prefs` / `home:theme` / `home:locale`；运行期状态（浮层开关、播放进度）永不落盘。
- 偏好按白名单逐字段校验后恢复：类型不符、越界、被手工改坏的值一律回落默认值。

### 天气与壁纸

- 天气默认走 **AuroraAPI**（微软天气数据、免密钥、两步协议），备选是 **Azure Maps** 官方接口（订阅密钥写在 `src/config/weather.ts`）；字段映射只在 `src/api/weather.ts`，数据源不可用时完全不发请求，天气行也不显示。
- 城市按访客 IP 自动定位（`autoLocate`，默认开）：填了高德 Web服务 Key 就优先用高德，否则用中文定位源；只认中国 IP 与市级名称，失败或关掉开关都回落配置里的兜底城市，定位结果整场会话只取一次。
- 壁纸图源都选「直接返回图片」的接口：`<img>` 跨域加载不受 CORS 限制，静态站点不需要转发；远程图源失败自动回落到默认插画并给出提示条。
- 壁纸体积大且按需切换，因此不进 PWA 预缓存，改由运行时图片缓存按需命中。

### 播放器

- 自研状态机而非引入播放器库：歌词、循环、随机、进度、音量、MediaSession 全部可控，样式完全走令牌。
- 歌单地址是**模板 + 占位符**（`:server` / `:type` / `:id` / `:auth` / `:r`），换实例只改一行；解析要求「有名字 + 有播放地址」、按 id 去重、时长兼容秒与毫秒。
- 首屏不请求歌单：只有打开播放器、点播放，或用户显式开启「自动播放」时才拉取。
- 定时器只保留一处实现：所有周期任务订阅 `useTicker`（对齐整刻度、页面隐藏停摆、按周期共享），后台标签页不空转、秒数不漂移。

### 可访问性与 i18n

- 语义化标签、唯一的 `h1`、跳转到主内容、浮层焦点陷阱与焦点归还、`focus-visible` 描边、状态层；`prefers-reduced-motion` / `prefers-reduced-transparency` / `prefers-contrast` 全部跟随系统。
- 界面文案全部走词条（简体中文 / English）：`src/i18n/locales/zh.ts` 是词条真源并推导 `I18nKey`，`en.ts` 由 `Record<I18nKey, string>` 约束，缺词条直接编译失败；参数化文案保持 `{placeholder}` 同名。

### 工程化

- `pnpm typecheck`（vue-tsc 严格模式）、`pnpm design:lint`（令牌、断点、命名、依赖方向、原子清单、图标名、词条、配置入口）、`pnpm lint`（Biome）、`pnpm smoke`（Playwright 冒烟 + 截图）。
- Vite 8（Rolldown 打包 + oxc 压缩），配色引擎单独分包；样式全是纯 CSS，无预处理器。
- TypeScript 走官方双装方案：`typescript` 别名到 `@typescript/typescript6`（6 的 JS API 线，`vue-tsc` 依赖它），因为 TS 7.0 没有编程接口。

## ✦ 快速开始

```bash
# 环境要求：Node.js >= 20.19，pnpm 11
pnpm install

# 开发（默认 http://localhost:3000）
pnpm dev

# 类型检查 + 设计令牌校验 + 代码检查
pnpm check

# 构建（先类型检查，再打包）
pnpm build

# 预览构建产物并跑冒烟测试（截图输出到 screenshots/，不入库）
pnpm preview
pnpm smoke
```

## ✦ 配置

配置只有一个入口：`src/config`。站点信息、凭据、行为、外观都在里面，每个模块顶部都有一段「要改就动这里」的常量；细节见 [`src/config/README.md`](./src/config/README.md)。

| 文件 | 用途 |
| --- | --- |
| `src/config/site.ts` | 站点名称、作者、关键词、简介、地址、语言、图标、建站日期、备案号、仓库地址 |
| `src/config/profile.ts` | 头像与两套简介文案（默认 / 展开更多信息时） |
| `src/config/theme.ts` | 动态配色出厂默认值（种子色相、调色板风格、规范版本、明暗模式） |
| `src/config/weather.ts` | 天气数据源（免密钥的 aurora / 自备密钥的 azure）、查询城市与序号、刷新间隔、定位开关 |
| `src/config/music.ts` | Meting-API 地址与歌单参数（歌单 ID 留空则整个播放器不加载） |
| `src/config/wallpaper.ts` | 壁纸源与缓存策略 |
| `src/config/features.ts` | 功能开关（关闭即零负担：不请求、不渲染、不进主包） |
| `src/config/links/siteLinks.json` | 站点链接（`icon` 为本地图标名，也可写 `img` 用图片） |
| `src/config/links/socialLinks.json` | 社交链接（同上，`tip` 会作为悬停提示） |
| `src/config/breakpoints.ts` | 响应式断点唯一来源 |
| `src/config/changelog.ts` | 「设置 → 更新日志」的内容 |

`site.ts` 的 `repo` 留空时，页脚、设置面板、信息面板与控制台签名里的仓库入口会整体隐藏；填上仓库地址即全部生效。改完 `site.ts` 需要重新构建：标题 / 描述 / 图标由构建期注入 `index.html`，运行时再由 `src/utils/documentHead.ts` 同步一次。

## ✦ 目录结构

```
src/
├─ config/        唯一配置入口（站点 / 资料 / 主题 / 开关 / 天气 / 音乐 / 壁纸 / 断点 / 更新日志）
├─ types/         配置与领域类型
├─ theme/         colorScheme(HCT 引擎) / index(运行时) / prefs(偏好契约) / wallpaperHue(取色)
├─ styles/        令牌层 → 基础层 → 工具层 → 过渡层（纯 CSS，无预处理器）
├─ i18n/          locales(zh 真源、en) / translate(词典与 t) / locale(语言状态) / useI18n / index(域门面)
├─ api/           请求层（超时、取消、JSONP 兼容、数据归一化）
├─ player/        播放器域：usePlayer(单例状态机) / lyrics(解析与拉取) / mediaSession
├─ composables/   useTicker(对齐定时器) / useClock / useWallpaper / useWeather / useHitokoto / useTimeCapsule / useOverlay / usePwa
├─ stores/        app(状态) / persist(持久化白名单) / snackbar(提示条队列)
├─ utils/         storage(持久化) / pick(值域夹紧) / format / capsule / documentHead / consoleSignature
├─ components/
│  ├─ atoms/      12 个 M3E 原子（见 atoms/manifest.json）
│  ├─ molecules/  身份、时钟天气、一言、播放控制、链接网格、设置项、Dialog/Sheet、提示条宿主
│  ├─ organisms/  壁纸层、加载幕布、面板、设置/信息面板、播放列表、页脚
│  └─ layout/     AppShell（顶栏 + 两列栅格 + 页脚）
├─ generated/     图标注册表（由脚本生成，勿手改）
├─ App.vue        组装布局、绑定全局监听
└─ main.ts        文档头、主题、挂载、PWA
```

## ✦ 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm preview` | 开发 / 构建 / 预览 |
| `pnpm typecheck` | `vue-tsc` 严格类型检查 |
| `pnpm design:lint` | 设计令牌与命名校验（色值、圆角、时长、字号、层级、断点、文件名、符号名、CSS 块名、依赖方向、原子清单、图标名、词条键、配置入口） |
| `pnpm lint` / `pnpm format` | Biome 检查 / 格式化 |
| `pnpm icons` | 重新生成 `src/generated/icons.ts` |
| `pnpm smoke` | Playwright 冒烟测试并输出截图 |
| `pnpm check` | 上述检查的合集 |

## ✦ 部署

- **静态托管 / Vercel / Cloudflare Pages**：构建命令 `pnpm build`，产物目录 `dist`；站点信息直接改 `src/config/site.ts` 后重新构建，不需要平台侧环境变量。
- **Docker**：

  ```bash
  docker build -t home .
  docker run -p 12445:12445 -d home
  ```

- **GitHub Actions**：推向 `main` 或发起 PR 时自动执行类型检查 / 令牌校验 / Biome / 构建，并上传 `dist` 产物（见 `.github/workflows/build.yml`）。

## ✦ 已知取舍

- **不引入 CSS 框架**：页面规模小，令牌 + scoped 样式更可控，也避免「框架类名与令牌两套写法」。
- **不使用状态库**：只有一份全局状态，`reactive` + 显式持久化契约即可，且能避免把运行期状态写进 localStorage。
- **不引入 CSS 预处理器**：样式全是纯 CSS，令牌已经承担了变量与复用，少一层构建依赖。
- **播放器自研而非引入 APlayer**：歌词、循环、随机、MediaSession 行为可控，样式全部走令牌。
- **站点链接用网格而非轮播**：任意条数都不会溢出，少一层运行时依赖与手势冲突。
- **定时器只保留一处实现**：所有周期任务订阅 `useTicker`，后台标签页不空转，秒数不漂移。
- **不替换系统指针、不拦右键**：替掉系统指针会丢掉「鼠标现在在哪」「系统手势提示」，右键菜单则是浏览器原生能力，两者都不再提供开关。
- **配置不放在 `.env`**：`VITE_*` 一样会被打包成明文，「密钥走环境变量」只是错觉。统一进 `src/config` 后只有一处要改、有类型、能被 lint 约束，`vite.config.ts` 也能读同一份站点信息。
- **悬停站点卡片时把背景虚化**：卡片自己转玻璃态，背景层按需挂一层毛玻璃（`v-if` 挂载），指针离开立即恢复透明；「减少透明度 / 高对比」下虚化归零，只留压暗一档。
- **天气有两个可切换的数据源**：默认 AuroraAPI（免密钥、两步协议），备选 Azure Maps（订阅密钥在前端产物里等同于公开，建议在门户限制来源域名或改用 SAS Token）。
- **PWA 预缓存不含壁纸**：壁纸体积大且按需切换，改由运行时图片缓存命中。
- **截图不入库**：`screenshots/` 是 `pnpm smoke` 的产物，已在 `.gitignore` 中；README 不依赖截图。

## ✦ 致敬

- **上游作者 [imsyy](https://github.com/imsyy)**：本项目的产品形态与交互原型来自 [imsyy/home](https://github.com/imsyy/home) —— 整屏壁纸、时钟与天气、一言、站点链接、时光胶囊、播放器与设置面板的构成沿自上游。上游作者已说明该仓库不再新增功能，这份重写算是一次致敬：形态保留，实现全部换掉。上游以 MIT 发布，本项目不含任何上游源码，许可采用 AGPL-3.0。
- **设计体系 [Shirone](https://github.com/LyraVoid/Shirone)**：Material 3 Expressive 的令牌组织方式与代码约定参考自它。
- **图标**：[Material Symbols](https://fonts.google.com/icons) 与 [simple-icons](https://simpleicons.org/)。
- **配色算法**：[material-color-utilities](https://github.com/material-foundation/material-color-utilities)。

## License

[AGPL-3.0](./LICENSE) —— 本项目是 [imsyy/home](https://github.com/imsyy/home)（MIT）的独立重写，不含上游源码；上游版权归其作者所有。
