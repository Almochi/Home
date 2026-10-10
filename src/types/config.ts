/**
 * 配置层类型：所有 src/config 模块共享，组件只依赖这些结构而不是具体取值。
 */
import type { I18nKey } from "@/i18n";
import type { McSpec, McStyle } from "@/theme/colorScheme";

/* --- 站点 --- */
export interface SiteUrl {
  /** 规范化后的完整地址，如 https://almochi.cn */
  href: string;
  /** 主机名，如 almochi.cn */
  host: string;
  /** 主机名首段，用于大字号标识，如 almochi */
  label: string;
  /** 主机名后缀（含点），如 .top */
  suffix: string;
}

export interface SiteLogo {
  favicon: string;
  avatar: string;
  apple: string;
}

export interface SiteConfig {
  name: string;
  author: string;
  keywords: string;
  description: string;
  lang: string;
  url: SiteUrl;
  logo: SiteLogo;
  /** 建站日期（YYYY-MM-DD / YYYY），未配置为 null */
  startDate: string | null;
  /** 建站年份，未配置为 null */
  startYear: number | null;
  icp: string | null;
  /** 项目仓库地址，未配置为 null（页脚 / 设置 / 信息面板的仓库入口随之整体隐藏） */
  repo: string | null;
}

/* --- 个人资料 --- */
export interface ProfileConfig {
  avatar: string;
  greeting: {
    /** 默认文案 */
    primary: { title: string; text: string };
    /** 右侧面板展开时的文案 */
    alternate: { title: string; text: string };
  };
}

/* --- 链接 --- */
export interface SocialLink {
  name: string;
  tip: string;
  url: string;
  /** 图标名（simple-icons 优先，可用 ui: 前缀指定 Material Symbols） */
  icon?: string;
  /** 自定义图标图片；与 icon 二选一 */
  img?: string;
}

export interface SiteLink {
  name: string;
  link: string;
  icon?: string;
  img?: string;
  /** 特殊行为：music 表示点击后打开播放器而不是跳转 */
  action?: "music";
}

/* --- 壁纸 --- */
export type WallpaperCache = "none" | "day" | "request";

/** 占位符上下文：由 useWallpaper 每次加载时生成一次，src 与 srcset 共用 */
export interface WallpaperContext {
  /** 本地图集的随机序号 */
  random: number;
  /** 请求时间戳，用于打破缓存 */
  stamp: number;
  /** YYYYMMDD，用于按天缓存 */
  day: string;
}

export interface WallpaperSource {
  id: string;
  /** 名称的 i18n key（有类型约束，改错键名会在编译期报错） */
  labelKey: I18nKey;
  kind: "local" | "remote";
  /** 生成最终的图片地址 */
  resolve: (context: WallpaperContext) => string;
  /** 多分辨率清单（"地址 宽度w, ..."）：交给 img 的 srcset，让浏览器按屏幕自己挑 */
  srcset?: (context: WallpaperContext) => string;
  /** 是否允许「下载壁纸」 */
  downloadable: boolean;
  cache: WallpaperCache;
}

export interface WallpaperConfig {
  /** 本地壁纸数量（public/images/background1..N.jpg） */
  localCount: number;
  defaultId: string;
  sources: WallpaperSource[];
  /** 图片加载超时（毫秒），超时回落到本地壁纸 */
  timeoutMs: number;
}

/* --- 天气 --- */
/** 天气数据源：aurora 免密钥开箱即用，azure 需要自备订阅密钥 */
export type WeatherSourceId = "aurora" | "azure";

/** AuroraAPI「天气查询」：数据来自微软天气，免密钥、CORS 全开 */
export interface AuroraWeatherSource {
  endpoint: string;
}

/** Azure Maps「Get Current Conditions」：官方 REST，字段最全但需要订阅密钥 */
export interface AzureWeatherSource {
  endpoint: string;
  apiVersion: string;
  /** 订阅密钥（subscription-key）；留空则该数据源不可用 */
  key: string;
  /** 观测点坐标：Azure 只按坐标查询，不回传城市名 */
  latitude: number;
  longitude: number;
  /** 返回语言（IETF 标记，如 zh-Hans / en-US） */
  language: string;
}

export interface WeatherConfig {
  /** 功能开关打开**且**所选数据源可用（Azure 需要密钥）时才为 true：否则零请求、零 DOM */
  enabled: boolean;
  /** 当前数据源；本文件是唯一的字段映射处，组件不认识任何一方的字段名 */
  source: WeatherSourceId;
  /** 按访客 IP 自动判断城市；定位失败、国外 IP 或关闭该开关时都退回 city */
  autoLocate: boolean;
  /** 定位请求超时（毫秒）：定位源依次尝试，都失败就退回 city */
  locateTimeoutMs: number;
  /** 高德 Web服务 Key：填了就优先用高德「IP 定位」，留空则用内置的免费定位源 */
  geoKey: string;
  /** 兜底城市名：autoLocate 关闭或定位失败时用它查询与展示 */
  city: string;
  /** 同名城市的候选序号（从 1 开始）：接口按关键词返回候选清单，这里选第几个 */
  cityIndex: number;
  timeoutMs: number;
  /** 自动刷新间隔（页面隐藏时不计时） */
  refreshMs: number;
  aurora: AuroraWeatherSource;
  azure: AzureWeatherSource;
}

/* --- 音乐（Meting-API） --- */
export type PlayerLoop = "all" | "one" | "none";
export type PlayerOrder = "list" | "random";

/** Meting 支持的音乐平台 */
export type MetingServer = "netease" | "tencent" | "kugou" | "xiami" | "baidu";
/** Meting 支持的资源类型：歌单 / 单曲 / 专辑 / 歌手 / 关键词搜索 */
export type MetingType = "playlist" | "song" | "album" | "artist" | "search";

export interface MusicConfig {
  /** 歌单 ID 为空时整个播放器不产生任何请求与 DOM */
  enabled: boolean;
  /** Meting 地址模板，占位符：:server / :type / :id / :auth / :r */
  api: string;
  server: MetingServer;
  type: MetingType;
  id: string;
  /** 受保护的 Meting 部署需要的口令，公开实例留空 */
  auth: string;
  timeoutMs: number;
  defaults: {
    volume: number;
    autoplay: boolean;
    loop: PlayerLoop;
    order: PlayerOrder;
    showLyric: boolean;
  };
}

/* --- 主题 --- */
export type ThemeMode = "auto" | "light" | "dark";
export type MotionPreference = "system" | "reduced" | "full";

export interface ThemeDefaults {
  hue: number;
  style: McStyle;
  spec: McSpec;
  mode: ThemeMode;
  motion: MotionPreference;
  followWallpaper: boolean;
}

/* --- 功能开关 --- */
export interface FeatureFlags {
  weather: boolean;
  hitokoto: boolean;
  music: boolean;
  socialLinks: boolean;
  siteLinks: boolean;
  timeCapsule: boolean;
  siteStartDate: boolean;
  /** 底栏整体（版权 / 备案 / 歌词行）；关闭即零 DOM，子开关 footerLyrics 也随之失效 */
  footer: boolean;
  footerLyrics: boolean;
  wallpaperShowcase: boolean;
  pwaUpdateNotice: boolean;
  consoleSignature: boolean;
  linkBackdrop: boolean;
  wallpaperAutoTheme: boolean;
}

/* --- 更新日志 --- */
export interface ChangelogItem {
  type: "added" | "fixed";
  text: string;
}

export interface ChangelogConfig {
  items: ChangelogItem[];
}
