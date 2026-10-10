# M3E 标准 —— 本项目的 Material 3 Expressive 实现

> 适用版本：Vue 3.5 + Vite 8.3（Rolldown 打包 + oxc 压缩）+ TypeScript 6 API（`typescript` 别名到 `@typescript/typescript6`，供 `vue-tsc` 使用）+ `@material/material-color-utilities@0.4`。
> 样式全部为纯 CSS（`<style scoped>`，无 Sass 等预处理器）。
> 目标：解释「令牌 → 原子 → 组合」这条链路，以及如何安全地扩展它。

## 1. 设计原则

1. **动态配色（HCT）**：颜色由种子色相 × 风格 × 规范 × 明暗实时解析，而不是写死色板。
2. **令牌驱动**：组件只引用语义令牌，不出现具体数值。
3. **原子化**：UI 由 `src/components/atoms` 下的原子组合而成，交互统一挂 `.m3-state-layer`。
4. **站点风格优先**：与 M3 官方默认冲突时以本站契约为准（例如按钮圆角取 12px 而非胶囊）。

## 2. 链路

```
src/config/theme.ts（默认色相 / 风格 / 规范 / 明暗）
        │
        ▼
src/theme/hct.ts        HCT 引擎：resolveScheme(hue, isDark, style, spec)
        │                → 35 个角色 hex
        ▼
src/theme/index.ts      写入 :root 的 --mc-*，并管理 .dark / .motion-reduced
        │                （rAF 合并；偏好经 prefs.ts 走 utils/storage 的
        │                 { version, data } 信封读写 home:theme）
        ▼
src/styles/tokens.css   --mc-* → 语义令牌（--primary、--surface-container-low …），
                        并为每项准备 oklch 回退，保证首帧一致
        │
        ▼
atoms / molecules / organisms / layout
```

壁纸取色：`src/theme/wallpaperHue.ts` 把图片缩到 24×24，逐像素转 HCT，按
`色度 × 明度接近 50` 加权做 15° 直方图，再对峰值桶做圆周平均；失败返回 `null`。

## 3. 令牌

### 3.1 颜色角色

引擎解析 `MC_ROLES`（35 个）为 `--mc-<kebab-case>`；tokens.css 再映射成语义别名：

| 族 | 令牌 |
| --- | --- |
| primary | `--primary` `--on-primary` `--primary-container` `--on-primary-container` `--inverse-primary` |
| secondary | `--secondary` `--on-secondary` `--secondary-container` `--on-secondary-container` |
| tertiary | `--tertiary` `--on-tertiary` `--tertiary-container` `--on-tertiary-container` |
| surface | `--surface` `--surface-dim` `--surface-bright` `--surface-container-lowest/low/…/highest` `--on-surface` `--on-surface-variant` `--surface-variant` `--inverse-surface` `--inverse-on-surface` |
| outline | `--outline` `--outline-variant` |
| error | `--error` `--on-error` `--error-container` `--on-error-container` |

语义别名：

| 令牌 | 含义 |
| --- | --- |
| `--page-bg` / `--card-bg` / `--float-panel-bg` | 页面 / 卡片 / 浮层底色 |
| `--panel-bg` / `--panel-bg-hover` / `--panel-bg-strong` | 壁纸上的半透明面板（另含 `--panel-border` / `--panel-blur` / `--panel-shadow`） |
| `--btn-regular-bg` / `--btn-plain-bg-hover` / `--float-control-bg` | 控件层级渐升 |
| `--line-divider` / `--line-color` / `--meta-divider` | 分隔线 |
| `--scrollbar-bg` / `--selection-bg` | 滚动条与选区 |
| `--wallpaper-*` | 壁纸可读性例外（见 DESIGN.md） |

### 3.2 形状 / 间距 / 密度

| 类别 | 令牌 |
| --- | --- |
| 形状 | `--shape-corner-xs` 4 / `s` 8 / `m` 12 / `l` 16 / `xl` 28 / `full` 999 |
| 间距 | `--m3e-space-1..6 / 8 / 10`（4dp 网格） |
| 密度 | `--m3e-density`：精确指针设备自动 `-1`（compact） |

### 3.3 字体阶梯

`--m3e-type-label-small/medium/large`、`--m3e-type-body-small/medium/large`、
`--m3e-type-title-small/medium/large`、`--m3e-type-headline-small/medium` 均为 font 简写，
用法：`font: var(--m3e-type-body-medium)`。

展示型字号单独登记：`--m3e-size-logo` / `--m3e-size-logo-sm` / `--m3e-size-clock` / `--m3e-size-quote` / `--m3e-size-capsule`；
图标尺寸：`--m3e-icon-size-xs..2xl`。组件不得出现其他字号字面量。

### 3.4 动效与高度

| 令牌 | 值 |
| --- | --- |
| `--m3e-duration-short/medium/long` | 150 / 250 / 400 ms |
| `--m3e-duration-ambient-*` | 7 / 10 / 13 s（仅装饰性循环） |
| `--m3e-easing-standard/emphasized/emphasized-decelerate/emphasized-accelerate` | M3 2025 曲线 |
| `--m3e-elevation-0..5` | 低透明度多层阴影，叠在 `--mc-shadow` 上 |

### 3.5 状态层

`.m3-state-layer`（`src/styles/utilities.css`）：

- 叠加色 `--m3e-state-color`（默认 `--on-surface`），透明度 hover 8% / focus 10% / pressed 12%；
- `:focus-visible` 描边 `--m3e-focus-outline`（默认 `--primary`），offset 2px；
- `[disabled]` / `[aria-disabled=true]`：`pointer-events: none` + `opacity: .38`。

### 3.6 层级

`z-index` 只取 `--m3e-z-*`：`behind` / `base` / `content` / `sticky` / `skip-link` / `tooltip` / `scrim` / `sheet` / `curtain` / `snackbar`。
组件不得写层级字面量（`design:lint` 校验），浮层按语义选令牌，不靠数值大小排优先级。

## 4. 原子清单

清单是单一真源：`src/components/atoms/manifest.json`（`design:lint` 会校验它与文件一一对应）。

| 分类 | 原子 |
| --- | --- |
| action | Button（filled/tonal/elevated/outlined/text）、IconButton、Chip |
| selection | Switch、Slider、SegmentedButton |
| display | Icon、Surface（panel/card/sunken）、Divider |
| feedback | ProgressIndicator、LoadingIndicator |
| overlay | Tooltip |

Dialog / Sheet 与 Snackbar 不在这一层：它们依赖 `useOverlay`、i18n 或全局提示条队列，原子层必须保持无状态，因此落在 `src/components/molecules`（`Dialog.vue` / `Sheet.vue` / `SnackbarHost.vue`，提示条条目只在 `SnackbarHost` 一处渲染）。

约定：

- 图标按钮必须提供 `label`（成为 `aria-label`），图标本身 `aria-hidden`；
- 直接压在壁纸上的图标按钮用 `tone="wallpaper"`（固定前景 + 投影），面板内保持默认 `tone="surface"`；
- 开关类控件使用原生语义（`role="switch"` / `input[type=range]` / `role="radiogroup"`），键盘行为不自行实现；
- 浮层统一走 `useOverlay`，圆角 `--shape-corner-xl`；
- 提示条队列在 `stores/snackbar`（`snackbarItems` / `notify` / `notifyError` / `dismiss`），宿主 `SnackbarHost` 只在 App 根部挂一次。动作不带模块前缀，模块名本身已经给了语境。

## 5. 扩展方式

1. 新组件先判断层级：只吃 props 与令牌 → atoms；需要组合原子 → molecules；需要编排状态 → organisms。
   命名同步定好：文件名 PascalCase、样式块由文件名派生（`FooBar.vue` → `.foo-bar`）、M3 规范组件用 `m3-*`，新增词条键全小写点分 —— 见 `NAMING.md`，`pnpm design:lint` 会检查。
2. 需要新颜色角色：先在 `MC_ROLES` 里加，再在 tokens.css 映射语义名与 oklch 回退。
3. 需要新图标：加入 `scripts/generate-icons.mjs` 清单 → `pnpm icons`。
4. 需要新字号/间距：优先复用现有阶梯；确实缺失时在 tokens.css 集中新增，并在本文件登记。
5. 收尾：`pnpm check` + `pnpm smoke`，并在 `screenshots/` 留下明暗两套截图。
