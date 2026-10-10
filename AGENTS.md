# 协作者与 AI 助手约定（Home / 引导页）

## 概览

这是一个 Vue 3 + Vite 8（Rolldown）+ TypeScript 的单页引导页，视觉与代码约定来自 Shirone 的 Material 3 Expressive 体系。
没有路由、没有后端，所有状态都在浏览器内；「设计令牌 + 配置层 + 自研原子组件」是三条主线。

改代码前请连同 `NAMING.md`（文件 / 导出 / CSS 块 / 词条键的命名规范）与 `DESIGN.md`（视觉与令牌）一起读。

## 必须遵守

- **令牌优先**：颜色、圆角、字号、动效时长、间距只能引用 `src/styles/tokens.css` 中的令牌；断点只能取 `src/config/breakpoints.ts` 中的值。提交前跑 `pnpm design:lint`，它是硬性门禁。
- **不新增 `!important`**：确需覆盖时写 `/* design-allow: 理由 */`，并说明层叠关系。
- **固定黑白仅限壁纸可读性**：见 `DESIGN.md` 的「图像可读性例外」。
- **配置只有一个入口**：站点身份、凭据、行为、外观一律进 `src/config`（每个模块顶部都有「要改就动这里」的常量）。全仓库禁止 `import.meta.env`，由 `design:lint` 强制；构建期由 `vite.config.ts` 直接读 `src/config/site.ts` 注入 `index.html`。
- **文案必须走 i18n**：`src/i18n/locales/zh.ts` 是词条真源，`I18nKey` 由它推导；`en.ts` 用 `Record<I18nKey, string>` 约束，缺词条会编译失败。参数化文案保持 `{placeholder}` 同名。
- **零负担开关**：`src/config/features.ts` 中关闭的功能必须零网络请求、零 DOM、零主包体积（用 `v-if` 真正卸载；重实现用动态 `import()`）。
- **依赖方向**：`atoms → molecules → organisms → layout`，低层不得 import 高层。
  - atoms 只能依赖 vue、同级原子与 `src/generated`（需要 composable / store 时下沉到 molecules）；
  - molecules 可以使用 composables 与 store，但不拥有面板级状态；
  - organisms 负责业务编排（浮层开关、面板组合）；
  - layout 只负责骨架与栅格；
  - 组件不得直接 import `@/api`（经 composable 暴露数据）；`api/config/i18n/player/stores/theme/types/utils` 不得反向 import 组件。
  这条规则由 `pnpm design:lint` 强制，越界会直接失败。
- **层级与命名**：`z-index` 只能取 `--m3e-z-*` 令牌；组件文件用 PascalCase，TS 模块用 camelCase，语言包用语言代码且导出同名（`zh.ts` → `zh`）。
  文件、导出、CSS 块名、词条键四者必须互相指认：composable 只能住 `src/composables` 且与文件同名（`usePwa.ts` → `usePwa()`），组件样式块名由文件名派生（`FooterBar.vue` → `.footer-bar`，M3 规范组件用 `m3-*`），词条键全小写点分（`settings.appearance.hue.custom`）。完整规则与动词表见 `NAMING.md`，由 `pnpm design:lint` 强制。
- **持久化只有一个入口**：所有 `localStorage` 读写走 `src/utils/storage.ts`（`{ version, data }` 信封，结构不符就回落默认值）。键名统一在 `home:` 命名空间：`home:prefs`（设置项）/ `home:theme`（主题）/ `home:locale`（语言）。
- **新增原子必须登记** `src/components/atoms/manifest.json`，否则 `design:lint` 失败。
- **图标**：先在 `scripts/generate-icons.mjs` 的清单里加名字，再跑 `pnpm icons`；配置里写错图标名会让校验失败（这是刻意的）。
- **浮层行为**：Dialog / Sheet 必须走 `useOverlay`（焦点陷阱、Esc、焦点归还），不要各自实现。
- **请求**：一律经过 `src/api/http.ts`（带超时与取消）；失败必须降级为提示条或占位文案，不允许未捕获异常。
- **定时器**：只有 `src/composables/useTicker.ts` 可以直接创建定时器（对齐整刻度、页面隐藏停摆、按周期共享）；其它地方一律订阅它。
- **动效**：使用 `--m3e-duration-*` 与 `--m3e-easing-*`；任何新动画都要在「减少动效」下仍然可用。
- **指针**：不替换系统指针、不拦右键，也不写跟随指针的 JS 动画；悬停反馈一律交给 CSS 的 `:hover` / `:focus-visible`。

## 目录职责

| 路径 | 职责 |
| --- | --- |
| `src/config` | 唯一配置入口（含 README）：站点 / 资料 / 主题 / 开关 / 天气 / 音乐 / 壁纸 / 断点 / 更新日志 |
| `src/theme` | `colorScheme.ts` 配色方案与角色表、`index.ts` 主题运行时、`prefs.ts` 偏好契约、`wallpaperHue.ts` 壁纸取色 |
| `src/styles` | 令牌 → 基础 → 工具 → 过渡（纯 CSS，无预处理器） |
| `src/composables` | `useTicker` 对齐定时器、时钟（`useClock`）、壁纸、天气、一言、时光胶囊、浮层、PWA（`usePwa`） |
| `src/player` | 播放器域：`usePlayer` 单例状态机 / `lyrics`（LRC 解析 + 拉取）/ `mediaSession` |
| `src/stores` | `app.ts` 状态与动作、`persist.ts` 持久化契约（白名单 + 防抖）、`snackbar.ts` 提示条队列 |
| `src/api` | 外部请求与数据归一化：`http` / `jsonp` / `hitokoto` / `weather` / `visitorLocation` / `music` |
| `src/i18n` | `locales/zh.ts` 词条真源、`translate.ts` 词典与 `t()`、`locale.ts` 语言状态、`useI18n.ts` 组件入口 |
| `src/utils` | storage（持久化） / pick（值域夹紧） / format（格式化） / capsule（时间统计） / documentHead（文档头） / consoleSignature（控制台签名） |
| `src/types` | 跨层共享的结构：`config.ts` 配置类型、`status.ts` 异步状态 `AsyncStatus` |
| `src/components` | atoms（12 个，见 manifest）/ molecules / organisms / layout |
| `src/generated` | 脚本生成物，禁止手改 |

## 验证

```bash
pnpm typecheck     # vue-tsc 严格模式，必须 0 错误
pnpm design:lint   # 令牌（颜色/圆角/字号/动效/层级）、断点、命名、依赖方向、原子清单、图标名、词条、配置入口校验
pnpm lint          # Biome
pnpm build         # 类型检查 + 打包
pnpm preview &     # 起预览
pnpm smoke         # Playwright 冒烟 + 截图（断言、控制台错误、移动端溢出）
```

改动 UI 时请附上 `screenshots/` 里的桌面与移动端截图对比，并说明浅色/深色两种模式都检查过。

## 已知取舍

- 不引入 CSS 框架：页面规模小，令牌 + scoped 样式更可控，也避免「框架类名与令牌两套写法」。
- 不使用状态库：只有一份全局状态，`reactive` + 显式持久化契约即可，且能避免把运行期状态写进 localStorage。
- 播放器自研而非引入 APlayer：歌词、循环、随机、MediaSession 行为可控，样式全部走令牌。
- 站点链接用网格而非轮播：任意条数都不会溢出，少一层运行时依赖与手势冲突。
- 不引入 CSS 预处理器：样式全是纯 CSS，令牌已经承担了变量与复用，少一层构建依赖。
- 定时器只保留一处实现：所有周期任务订阅 `useTicker`，后台标签页不空转，秒数不漂移。
- 指针不替换系统指针、不拦右键：替掉系统指针会丢掉「鼠标现在在哪」「系统手势提示」，右键菜单则是浏览器原生能力，两者都不再提供开关。
- 悬停站点卡片时把背景虚化：卡片自己转玻璃态（`--card-bg-glass`），背景层按需挂一层 `--wallpaper-frost-blur` 毛玻璃（`appState.linkHovered` 驱动、`v-if` 挂载），指针离开立即恢复透明；「减少透明度 / 高对比」下虚化归零，只留压暗一档。
- 配置不放在 `.env`：`VITE_*` 一样会被打包成明文，「密钥走环境变量」只是错觉。统一进 `src/config` 后只有一处要改、有类型、能被 lint 约束，`vite.config.ts` 也能读同一份站点信息。
- 天气城市按访客 IP 定位（`src/api/visitorLocation.ts`，填了高德 Web服务 Key 就优先用高德，否则 mir6 → vore.top；只认中国 IP），定位结果整场会话只取一次，失败 / 国外 IP / 关开关都回落 `src/config/weather.ts` 里的兜底城市；关掉 `autoLocate` 后定位请求数为 0。
- 天气有两个可切换的数据源：默认走 AuroraAPI（微软天气数据、免密钥、两步协议），备选是 Azure Maps 官方接口（订阅密钥写在 `src/config/weather.ts`，前端产物等同于公开，建议在门户限制来源域名或改用 SAS Token）。字段映射只在 `src/api/weather.ts`，数据源不可用时完全不发请求，天气行也不显示。
- TypeScript 用官方双装方案：`typescript` 别名到 `@typescript/typescript6`（6 的 JS API 线，`vue-tsc` 依赖它），因为 TS 7.0 没有编程接口（计划 7.1）；`tsconfig` 不再使用已弃用的 `baseUrl`。
