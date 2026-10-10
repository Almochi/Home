---
version: alpha
name: Home（無名の主页）
description: 一个整屏壁纸的个人引导页，建立在 Material 3 Expressive 设计令牌之上。
colors:
  primary: "oklch(42% 0.16 var(--hue))"
  secondary: "oklch(52% 0.13 calc(var(--hue) + 65))"
  tertiary: "oklch(50% 0.12 calc(var(--hue) - 100))"
  surface: "oklch(96% 0.012 var(--hue))"
  surface-container-low: "oklch(96.5% 0.01 var(--hue))"
  surface-container: "oklch(94% 0.015 var(--hue))"
  surface-container-high: "oklch(92% 0.02 var(--hue))"
  on-surface: "oklch(16% 0.02 var(--hue))"
  on-surface-variant: "oklch(34% 0.03 var(--hue))"
  outline: "oklch(45% 0.03 var(--hue))"
  outline-variant: "oklch(76% 0.02 var(--hue))"
  error: "oklch(57% 0.21 27)"
  on-primary: "oklch(99% 0.02 var(--hue))"
typography:
  display:
    fontFamily: "var(--font-display)"
    fontSize: "var(--m3e-size-logo)"
    fontWeight: 400
  headline:
    fontFamily: "var(--font-sans)"
    fontSize: 1.75rem
    fontWeight: 400
  title:
    fontFamily: "var(--font-sans)"
    fontSize: 1rem
    fontWeight: 500
  body:
    fontFamily: "var(--font-sans)"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-sans)"
    fontSize: 0.875rem
    fontWeight: 500
  digital:
    fontFamily: "var(--font-digital)"
    fontSize: "var(--m3e-size-clock)"
rounded:
  xs: 4px
  s: 8px
  m: 12px
  l: 16px
  xl: 28px
  full: 999px
spacing:
  unit: 4px
  compact: 8px
  control: 12px
  section: 24px
  content: 32px
  page: 40px
components:
  panel:
    backgroundColor: "var(--panel-bg)"
    textColor: "var(--on-surface)"
    rounded: "var(--shape-corner-l)"
    padding: "var(--m3e-space-5)"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "var(--shape-corner-m)"
    padding: "var(--m3e-space-6)"
  chip:
    backgroundColor: "var(--secondary-container)"
    textColor: "var(--on-secondary-container)"
    rounded: "var(--shape-corner-full)"
  sheet:
    backgroundColor: "var(--panel-bg-strong)"
    textColor: "{colors.on-surface}"
    rounded: "var(--shape-corner-xl)"
  snackbar:
    backgroundColor: "var(--inverse-surface)"
    textColor: "var(--inverse-on-surface)"
    rounded: "var(--shape-corner-xs)"
  state-layer:
    backgroundColor: "color-mix(in oklab, var(--m3e-state-color, var(--on-surface)) 8%, transparent)"
---

## Overview

这是一个**引导页**，不是博客：没有文章、没有路由，只有「一屏之内把人和入口交代清楚」。

视觉上它由三件事构成：**壁纸**（页面主角）、**半透明面板**（承载信息）、**动态配色**（跟随壁纸与访问者偏好）。M3E 提供的是交互语法——令牌、状态层、形状契约、动效曲线——而不是一层装饰。

## Colors

配色不是一组固定色板，而是运行时解析出来的语义角色。

- 引擎：`src/theme/colorScheme.ts` 用 `@material/material-color-utilities` 按「种子色相 × 风格 × 规范 × 明暗」解析 35 个角色，写入 `--mc-*`。
- 种子：优先取当前壁纸的主色相（`src/theme/wallpaperHue.ts`），取色失败或用户关闭时回落到 `src/config/theme.ts` 的 `hue`。
- 回退：tokens.css 为每个角色准备了基于 `--hue` 的 oklch 公式，因此首帧、禁用 JS、取色失败都不会掉出同一套色板。
- **Primary** 用于页面身份、链接与进度；**Secondary** 用于选中态与 tonal 控件；**Tertiary** 仅作辅助强调；**Surface 色阶**表达层级；**Error** 只用于失败与需要注意力的情况。

### 图像可读性例外

壁纸是不可控图像，压在它上面的内容必须保证对比度稳定，因此**只有这一类**允许使用固定黑白：

| 令牌 | 用途 |
| --- | --- |
| `--wallpaper-scrim` | 壁纸上的渐变遮罩（形状） |
| `--wallpaper-scrim-opacity` | 遮罩强度：亮色 `0`（不压暗，壁纸按原图明度呈现）／深色 `1` |
| `--on-wallpaper` / `--on-wallpaper-variant` | 直接压在壁纸上的文字与图标（站点标识、社交链接、页脚） |
| `--wallpaper-placeholder` | 壁纸加载前的底色 |
| `--wallpaper-text-shadow` | 壁纸文字投影 |

遮罩的「形状」与「强度」是拆开的：渐变本身在两种模式下相同，压多暗由 `--wallpaper-scrim-opacity` 决定。
这样切换明暗时遮罩能随 `opacity` 平滑淡入淡出，而亮色模式取 `0` 就等于不叠遮罩。
亮色模式下没有遮罩兜底对比度，因此 `--wallpaper-text-shadow` 在亮色下加重一档（`strong` 会被 `drop-shadow()` 引用，只写单层）。

直接压在壁纸上的图标按钮用 `IconButton` 的 `tone="wallpaper"`：固定 `--on-wallpaper` 前景色 + 投影；面板内部保持默认的 `tone="surface"`。

面板内部一律使用 `--on-surface` / `--on-surface-variant`，不允许使用固定色。

## Typography

- 正文与界面：系统字族（`--font-sans`），中文优先 PingFang / 微软雅黑，零外部字体请求。
- 站点标识：自托管 Pacifico（`--font-display`），只出现在 `h1` 与版本号。
- 时钟：自托管 UnidreamLED（`--font-digital`），配 `font-variant-numeric: tabular-nums`。
- 字号只允许取 `--m3e-type-*` / `--m3e-size-*` / `--m3e-icon-size-*`，`design:lint` 会校验。

## Layout

- 顶栏（只放全局操作）+ 主区 + 页脚；主区是两列两行：左列 `hero` 跨两行，右列上为功能卡 `utility`、下为站点链接 `links`。
- `hero` 限宽 30rem 并垂直居中；`< 1024px` 收成单列（hero / utility / links）。
- 站点链接是 2 列（窄屏）/ 3 列（`≥ 768px`）的大卡片网格，卡片 72px 高、图标与名称居中；指针压上去时卡片转玻璃态、整块背景虚化（离开即恢复）；「网站列表」标题移到面板之外，直接压在壁纸上。
- 时钟卡为三行网格：日期贴顶、时钟居中、天气贴底；没有天气行时时钟仍然居中。
- 站点标识（唯一的 `h1`）在主区只出现一次，顶栏不再放第二份。
- `< 768px` 浮层从右侧改为底部面板。
- 页面本身不滚动：`body` 固定，滚动交给 `.shell` 与面板内部；移动端整页可滚动，不再依赖固定像素高度的兜底布局。
- 间距取 4dp 网格；密度在精确指针设备上自动 compact。

## Elevation & Depth

先色阶、后阴影。面板默认用 `--panel-bg`（色阶 + 透明度）与 1px `--panel-border` 分离层级，阴影只用 `--m3e-elevation-*`；不允许玻璃拟态堆叠、发光、嵌套卡片。

唯一被允许的玻璃拟态是「悬停站点卡片」：卡片转 `--card-bg-glass`（1px `--panel-border` 勾边），背景层同时叠一层 `--wallpaper-frost-blur` 的全屏毛玻璃——它表达的是「焦点落在这张卡片上」，不参与页面层级划分，指针离开立即恢复透明。「减少透明度 / 高对比」偏好下虚化归零，只保留 `--wallpaper-frost-bg` 的压暗。

## Layering

`z-index` 只允许取 `--m3e-z-*`：`behind` / `base` / `content` / `sticky` / `skip-link` / `tooltip` / `scrim` / `sheet` / `curtain` / `snackbar`。组件里不允许出现层级字面量（`design:lint` 会失败），浮层之间按语义选令牌，不靠比数值分优先级。

## Shapes

`--shape-corner-xs/s/m/l/xl/full`。控件 12px、面板 16px、浮层 28px、chip/头像/滑块手柄为胶囊。组件不得写死圆角。

## Motion

`--m3e-duration-short/medium/long`（150/250/400ms）与 `--m3e-easing-*`（M3 2025 曲线）。
系统 `prefers-reduced-motion` 或用户在设置里选择「减少动效」时，全局把过渡与动画压到 0.01ms：**保留状态结果、去掉过程**。

## Do's and Don'ts

- **Do** 让「我是谁、现在几点、去哪」在第一屏就能读完。
- **Do** 用语义令牌；新颜色先问「能不能用现有角色表达」。
- **Do** 交互元素挂 `.m3-state-layer`，并保证 disabled / focus / hover / pressed 四态。
- **Do** 关闭的功能真正卸载组件，做到零请求、零 DOM。
- **Do** 所有界面文案走 i18n 词条。
- **Don't** 在组件里写色值、圆角、字号、时长、断点、`z-index`（`pnpm design:lint` 会失败）。
- **Don't** 新增 `!important`；确需覆盖时补 `design-allow: 理由` 注释。
- **Don't** 为壁纸之外的场景使用固定黑白。
- **Don't** 给普通区块套卡片，或用阴影代替层级。
