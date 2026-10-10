/**
 * 播放器域对外入口：组件只从这里取 API，不直接依赖内部实现。
 *
 * 内部分工：usePlayer（单例状态机与原生 Audio）/ lyrics（LRC 解析 + 歌词拉取）/
 * mediaSession（系统媒体控制）。
 */

export { usePlayer } from "@/player/usePlayer";
