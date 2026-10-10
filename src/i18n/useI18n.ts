/**
 * 组件内的语言入口：读取 locale.value，因此语言切换会自动重渲染。
 */
import { LOCALES, locale, setLocale } from "@/i18n/locale";
import { t } from "@/i18n/translate";

export function useI18n() {
  return { t, locale, setLocale, locales: LOCALES };
}
