/**
 * 功能开关：关闭即「零负担」——不产生网络请求、不输出 DOM、不进入主包体积。
 * 组件必须用 v-if / <component :is> 真正卸载，而不是 v-show。
 */
import type { FeatureFlags } from "@/types/config";

export const features: FeatureFlags = {
  /** 天气（需要网络，失败时展示占位文案） */
  weather: true,
  /** 一言 */
  hitokoto: true,
  /** 音乐播放器（仍需 src/config/music.ts 里的歌单 ID 才会真正启用） */
  music: true,
  socialLinks: true,
  siteLinks: true,
  timeCapsule: true,
  /** 建站日期统计（依赖 src/config/site.ts 的建站日期） */
  siteStartDate: true,
  /** 底栏整体（版权 / 备案 / 歌词行）；false 时 FooterBar 不挂载、不输出任何 DOM */
  footer: false,
  /** 底栏滚动歌词（依赖 footer） */
  footerLyrics: true,
  /** 壁纸展示模式（隐藏全部面板，仅看壁纸） */
  wallpaperShowcase: true,
  /** 检测到新版本时提示刷新 */
  pwaUpdateNotice: true,
  /** 控制台签名 */
  consoleSignature: true,
  /** 指针压在站点卡片上时把整块背景虚化（触屏没有 hover 语义，等于天然关闭） */
  linkBackdrop: true,
  /** 用壁纸主色刷新动态配色 */
  wallpaperAutoTheme: true,
};
