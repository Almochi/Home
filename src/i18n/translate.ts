/**
 * 词条字典与 {placeholder} 插值：i18n 唯一的翻译实现。
 *
 * 不引入 i18n 库的理由与 Shirone 一致——本项目只需要「键值 + 插值」；
 * 语言检测与持久化在 locale.ts，词条真源在 locales/zh.ts。
 */
import { type Locale, locale } from "@/i18n/locale";
import { en } from "@/i18n/locales/en";
import { type I18nKey, zh } from "@/i18n/locales/zh";

const dictionaries: Record<Locale, Record<I18nKey, string>> = { "zh-CN": zh, en };

/** 翻译：缺失词条回落到中文，再回落到键名本身（便于开发期发现漏配） */
export function t(key: I18nKey, params?: Record<string, string | number>): string {
  const template = dictionaries[locale.value][key] || zh[key] || key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
