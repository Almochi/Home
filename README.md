简体中文 | [English](./README_EN.md)

<div align="center">

# 杏团の主页

**以 Material 3 Expressive 设计令牌实现的个人引导页**

整屏壁纸、动态 HCT 配色，以及一套完全自研的 M3E 组件 —— 无 UI 框架、无后端。

![Vue](https://img.shields.io/badge/Vue-3.5-42B883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Material 3 Expressive](https://img.shields.io/badge/Material%203-Expressive-6750A4)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)

</div>

## 特性

- [x] 整屏壁纸：自托管插画（4 档分辨率 `srcset`）+ 本地图集 + Bing 每日一图 + 随机壁纸 / 二次元，支持下载原图
- [x] 时钟 / 日期 / 实时天气（按访客 IP 定位城市，默认免密钥数据源，可切 Azure Maps）
- [x] 一言、站点链接网格、社交链接、时光胶囊与建站时长
- [x] 音乐播放器：歌单、歌词、进度、音量、循环 / 随机、MediaSession 媒体键
- [x] 动态配色：明暗模式、种子色相、9 种调色板风格、Material 2021/2025、动效偏好
- [x] 壁纸展示模式、离线可用（PWA）、中英双语；减少动效 / 减少透明度 / 高对比全部跟随系统
- [x] 响应式：桌面双栏、窄屏单栏、移动端底部面板

## 快速开始

```bash
# 环境要求：Node.js >= 20.19，pnpm 11
pnpm install
pnpm dev        # http://localhost:3000
pnpm check      # 类型检查 + 设计令牌校验 + Biome
pnpm build      # 构建（先类型检查）
pnpm preview    # 预览构建产物；另开终端跑 pnpm smoke 做冒烟测试
```

## 配置

配置只有一个入口：`src/config` —— 站点信息、资料、主题、天气、音乐、壁纸、开关、断点都在这里，细节见 [`src/config/README.md`](./src/config/README.md)。

- 站点名称 / 作者 / 地址 / 图标 / 建站日期 / 备案号 / 仓库地址：`site.ts`（`repo` 留空则界面上所有仓库入口隐藏）
- 天气数据源与城市、歌单地址与 ID、壁纸源、功能开关：`weather.ts` / `music.ts` / `wallpaper.ts` / `features.ts`
- 站点链接与社交链接：`links/*.json`（`icon` 写本地图标名；新增图标需先登记再跑 `pnpm icons`）

改完 `site.ts` 需要重新构建 —— 标题、描述与图标由构建期注入 `index.html`。

## 部署

- **静态托管 / Vercel / Cloudflare Pages**：构建命令 `pnpm build`，产物目录 `dist`
- **Docker**：`docker build -t home . && docker run -p 12445:12445 -d home`
- 推送 `main` 或发起 PR 时自动执行类型检查、令牌校验、Biome 与构建（`.github/workflows/build.yml`）

## 文档

[`DESIGN.md`](./DESIGN.md) 令牌与视觉规范 · [`docs/m3e-standard.md`](./docs/m3e-standard.md) 令牌表与原子清单 · [`NAMING.md`](./NAMING.md) 命名规范 · [`AGENTS.md`](./AGENTS.md) 协作约定

## 致敬

产品形态与交互原型来自 [imsyy/home](https://github.com/imsyy/home)：整屏壁纸、时钟天气、一言、站点链接、时光胶囊、播放器与设置面板的构成沿自上游，实现全部重写。令牌组织与代码约定参考 [Shirone](https://github.com/LyraVoid/Shirone)；图标来自 [Material Symbols](https://fonts.google.com/icons) 与 [simple-icons](https://simpleicons.org/)；配色算法来自 [material-color-utilities](https://github.com/material-foundation/material-color-utilities)。

## License

[AGPL-3.0](./LICENSE) —— 本项目是 [imsyy/home](https://github.com/imsyy/home)（MIT）的独立重写，不含上游源码；上游版权归其作者所有。
