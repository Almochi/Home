import { createApp } from "vue";
// 样式顺序固定：令牌 → 基础 → 工具 → 过渡；组件样式由 SFC 自行注入
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/utilities.css";
import "@/styles/transitions.css";

import App from "@/App.vue";
import { usePwa } from "@/composables/usePwa";
import { features } from "@/config/features";
import { locale } from "@/i18n";
import { initTheme } from "@/theme";
import { logConsoleSignature } from "@/utils/consoleSignature";
import { syncDocumentHead } from "@/utils/documentHead";

// 1) 文档头与语言：title / description / favicon 与 src/config 保持一致
syncDocumentHead();
document.documentElement.lang = locale.value;

// 2) 主题：挂载前写入 --mc-* 调色板，避免首帧闪烁
initTheme();

createApp(App).mount("#app");

// 3) 离线能力与控制台签名（都可通过功能开关关闭）
usePwa();
if (features.consoleSignature) logConsoleSignature();
