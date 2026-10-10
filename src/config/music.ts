/**
 * 播放器：Meting-API。歌单 ID 留空时整体不加载（零请求、零 DOM、零主包体积）。
 *
 * 地址是**模板**，占位符由 src/api/music.ts 的 buildMetingUrl 替换：
 *   :server  平台（netease / tencent / kugou / xiami / baidu）
 *   :type    资源类型（playlist / song / album / artist / search）
 *   :id      歌单 / 单曲 / 专辑 / 歌手 ID
 *   :auth    受保护部署的口令，公开实例留空
 *   :r       时间戳，用来打破缓存（歌单更新后不至于一直拿到旧的）
 *
 * 换实例只改这一行模板，例如自建 Meting-API 通常是
 *   "https://your-domain/api?server=:server&type=:type&id=:id&auth=:auth"
 *
 * 默认实例选 injahow：实测返回 CORS \`*\` 且歌单可直接播放；
 * 原先的 api-meting.imsyy.top 已经没有 A 记录，meting.qjqq.cn 返回 521。
 */
import { features } from "@/config/features";
import type { MusicConfig } from "@/types/config";

/** 要换歌单，只动这里 */
const musicRaw = {
  api: "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&r=:r",
  server: "netease",
  type: "playlist",
  id: "9379831714",
  auth: "",
} as const;

export const musicConfig: MusicConfig = {
  enabled: features.music && musicRaw.id.length > 0,
  ...musicRaw,
  timeoutMs: 12000,
  defaults: {
    volume: 0.7,
    autoplay: false,
    loop: "all",
    order: "list",
    showLyric: true,
  },
};
