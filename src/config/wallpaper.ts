/**
 * 壁纸源：一张自托管的默认插画（多分辨率）+ 本地图集 + 三个远程图源。
 *
 * 约定：
 * - 远程图源只使用「直接返回/重定向到图片」的接口，不读 JSON —— 浏览器用 img 加载图片
 *   不受 CORS 限制，一旦要走 fetch 读 JSON，就必须自备反向代理；
 * - 默认插画提供 1280 / 2000 / 3000 / 4000 四档，交给 img 的 srcset 让浏览器按屏幕宽度
 *   与像素密度自己挑（手机拿 1280，4K 屏才拿 4000）；
 * - 任何远程图源失败都会回落到 defaultId 指向的本地图源（见 useWallpaper）。
 */
import type { WallpaperConfig } from "@/types/config";

const STAMP_PLACEHOLDER = "{stamp}";
const DAY_PLACEHOLDER = "{day}";
const RANDOM_PLACEHOLDER = "{random}";

/** 默认插画的分辨率档位，对应 public/images/wallpaper/illustration-<宽度>.jpg */
const ILLUSTRATION_WIDTHS = [1280, 2000, 3000, 4000];

const illustration = (width: number): string => `/images/wallpaper/illustration-${width}.jpg`;

/** 远程图源在地址后追加时间戳 / 日期，既打破 CDN 缓存又便于按天复用 */
const withParam = (url: string, name: string, value: string | number): string =>
  `${url}${url.includes("?") ? "&" : "?"}${name}=${value}`;

/**
 * Bing 每日一图地址（bing.biturl.top，format=image 直接重定向到图片，无需读 JSON）。
 * 3840 只有 jpg 有货：要 webp 只能选 1920（约 240 KB），4K 请求 webp 会 404 成 80×80 占位图。
 */
const bingImage = (day: string, resolution: 1920 | 3840, format: "jpg" | "webp"): string =>
  withParam(
    `https://bing.biturl.top/?resolution=${resolution}&image_format=${format}&format=image&index=0&mkt=zh-CN`,
    "t",
    day,
  );

export const wallpaperConfig: WallpaperConfig = {
  // 依据 public/images/backgroundN.jpg 的数量修改
  localCount: 10,
  defaultId: "illustration",
  timeoutMs: 12000,
  sources: [
    {
      id: "illustration",
      labelKey: "settings.wallpaper.illustration",
      kind: "local",
      // 基准地址取中档：不支持 srcset 的环境也能拿到够用的清晰度
      resolve: () => illustration(3000),
      srcset: () =>
        ILLUSTRATION_WIDTHS.map((width) => `${illustration(width)} ${width}w`).join(", "),
      downloadable: true,
      cache: "none",
    },
    {
      id: "local",
      labelKey: "settings.wallpaper.local",
      kind: "local",
      resolve: ({ random }) => `/images/background${random}.jpg`,
      downloadable: true,
      cache: "none",
    },
    {
      id: "bing",
      labelKey: "settings.wallpaper.bing",
      kind: "remote",
      // 1920 的 WebP 约 240 KB，1080p 足够清晰；4K 屏交给 srcset 自己去拿 3840 的 jpg
      resolve: ({ day }) => bingImage(day, 1920, "webp"),
      srcset: ({ day }) =>
        `${bingImage(day, 1920, "webp")} 1920w, ${bingImage(day, 3840, "jpg")} 3840w`,
      downloadable: true,
      cache: "day",
    },
    {
      id: "random",
      labelKey: "settings.wallpaper.random",
      kind: "remote",
      // alcy 随机电脑壁纸（直接返回 WebP，约 400 KB）
      // 原来的 api.vvhan.com 已整域下线（NXDOMAIN），无法再用
      resolve: ({ stamp }) => withParam("https://t.alcy.cc/pc", "t", stamp),
      downloadable: true,
      cache: "request",
    },
    {
      id: "anime",
      labelKey: "settings.wallpaper.anime",
      kind: "remote",
      // MirlKoi（cnmiw）随机横屏：sort 前缀 CDN 表示走反代线路，无需 Referer
      // 其它分区见 https://cnmiw.com/api/（竖屏 mp、精选 top、无色图 iw233）
      resolve: ({ stamp }) => withParam("https://api.cnmiw.com/api.php?sort=CDNpc", "t", stamp),
      // 二次元图源多为他人作品，不提供「下载壁纸」入口
      downloadable: false,
      cache: "request",
    },
  ],
};

/** 供配置文档与校验脚本使用：所有占位符必须被 resolve 消费 */
export const WALLPAPER_PLACEHOLDERS = [STAMP_PLACEHOLDER, DAY_PLACEHOLDER, RANDOM_PLACEHOLDER];
