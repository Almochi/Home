/**
 * i18n 域对外入口：组件只从这里取 API，不直接依赖内部实现。
 *
 * 分工：translate（词条字典与插值）/ useI18n（组件内入口）/ locale（语言检测与持久化）/
 * locales（词条真源，zh 是唯一真源、I18nKey 由它推导）。
 */
export { LOCALES, type Locale, locale, setLocale } from "@/i18n/locale";
export type { I18nKey } from "@/i18n/locales/zh";
export { t } from "@/i18n/translate";
export { useI18n } from "@/i18n/useI18n";
