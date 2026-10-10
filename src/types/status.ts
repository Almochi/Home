/**
 * 异步资源的状态：播放列表 / 天气 / 壁纸三处都要「加载中 / 就绪 / 失败」，
 * 与其各写一份同构的联合类型，不如只留一个真源，组件也能共用同一套分支写法。
 */
export type AsyncStatus = "idle" | "loading" | "ready" | "error";
