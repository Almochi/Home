/**
 * 语言状态：检测顺序 = 已保存 > 站点配置 > 浏览器语言，持久化键 home:locale。
 * 与主题偏好一样走 src/utils/storage，读写失败（隐私模式）静默回落。
 */
import { ref } from "vue";
import { siteConfig } from "@/config/site";
import { readJson, writeJson } from "@/utils/storage";

export type Locale = "zh-CN" | "en";

export const LOCALES: ReadonlyArray<{ id: Locale; label: string }> = [
  { id: "zh-CN", label: "简体中文" },
  { id: "en", label: "English" },
];

const STORAGE_KEY = "home:locale";

function detectLocale(): Locale {
  const saved = readJson<unknown>(STORAGE_KEY, null);
  if (saved === "zh-CN" || saved === "en") return saved;
  const configured = siteConfig.lang.toLowerCase();
  if (configured.startsWith("en")) return "en";
  if (configured.startsWith("zh")) return "zh-CN";
  return navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

/** 当前语言（响应式）：切换后所有取词条的组件自动重渲染 */
export const locale = ref<Locale>(detectLocale());

export function setLocale(next: Locale): void {
  locale.value = next;
  document.documentElement.lang = next;
  writeJson(STORAGE_KEY, next);
}
