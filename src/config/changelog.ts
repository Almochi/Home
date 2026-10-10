/** 更新日志：属于「站点内容」而不是界面词条，因此放在 config 而非 i18n。 */
import type { ChangelogConfig } from "@/types/config";

export const changelogConfig: ChangelogConfig = {
  items: [
    { type: "added", text: "引入 Material 3 Expressive 设计令牌与 HCT 动态配色" },
    { type: "added", text: "壁纸主色可自动推导为配色种子，支持 9 种调色板风格" },
    { type: "added", text: "明暗模式、减少动效、界面语言可在设置中切换并记住" },
    { type: "added", text: "天气按访客 IP 自动定位城市（可在配置里关掉）" },
    { type: "added", text: "天气改为可切换的数据源：默认免密钥接口，也可切回 Azure Maps 官方接口" },
    { type: "added", text: "链接卡片改为大卡片网格，右栏按「一言 + 时钟 → 网站列表」重组" },
    { type: "fixed", text: "移除 Element Plus / APlayer 等重依赖，改为自研 M3E 原子组件" },
    { type: "fixed", text: "模块按职责重新分家：播放器、状态与持久化、语言包各自独立" },
    { type: "fixed", text: "定时器统一走共享实现，后台标签页不再空转、秒数不再漂移" },
    { type: "fixed", text: "天气与歌单请求补齐超时、取消与失败降级" },
    { type: "fixed", text: "天气接口「查不到城市」时不再显示空白行，改为降级提示" },
    { type: "fixed", text: "移动端不再依赖固定 721px 高度，改为流式布局" },
    { type: "fixed", text: "升级到 Vite 8（Rolldown），移除 sass / terser 等多余依赖" },
    {
      type: "fixed",
      text: "统一命名：组件样式块由文件名派生，词条键改为全小写点分，导出动词各归其位",
    },
  ],
};
