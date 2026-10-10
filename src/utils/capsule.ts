/**
 * 时间统计：时光胶囊（年 / 月 / 周 / 日的进度）与建站时长。
 *
 * 口径说明（旧实现这里最容易出错）：
 * - 时光胶囊按「已过去的完整单位 + 当前单位内的进度」计算，周以周一为起点，
 *   不再使用 (passed + 6) % 7 这种把起点和进度混在一起写法；
 * - 建站时长按自然年月日退位，天数不足时向上一月借位；
 * - 全部纯函数，便于在 30 秒定时器之外复用与单测。
 */
import type { I18nKey } from "@/i18n/locales/zh";

export type CapsuleUnit = "day" | "week" | "month" | "year";

export interface CapsuleEntry {
  unit: CapsuleUnit;
  /** 单位名称的 i18n key */
  labelKey: I18nKey;
  /** 单位总量（天 / 小时） */
  total: number;
  /** 已过整数（展示用） */
  passed: number;
  /** 剩余整数（展示用） */
  remaining: number;
  /** 精确百分比 0-100 */
  percentage: number;
}

export interface SiteAge {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

const MS_PER_DAY = 86_400_000;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;

const CAPSULE_LABEL: Record<CapsuleUnit, I18nKey> = {
  day: "capsule.day",
  week: "capsule.week",
  month: "capsule.month",
  year: "capsule.year",
};

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // 周一为一周起点：getDay() 周日为 0，需要映射到 6
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function entry(unit: CapsuleUnit, total: number, passedExact: number): CapsuleEntry {
  const clamped = Math.min(total, Math.max(0, passedExact));
  const passed = Math.floor(clamped);
  return {
    unit,
    labelKey: CAPSULE_LABEL[unit],
    total,
    passed,
    remaining: Math.max(0, total - passed),
    percentage: Number(((clamped / total) * 100).toFixed(2)),
  };
}

/** 一天、一周、一月、一年的进度（单位：天；「今日」以小时计） */
export function computeTimeCapsule(date: Date): CapsuleEntry[] {
  const hoursPassed = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const dayFraction = hoursPassed / HOURS_PER_DAY;

  const weekStart = startOfWeek(date);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const daysInYear = Math.round(
    (new Date(date.getFullYear() + 1, 0, 1).getTime() -
      new Date(date.getFullYear(), 0, 1).getTime()) /
      MS_PER_DAY,
  );

  return [
    entry("day", HOURS_PER_DAY, hoursPassed),
    entry("week", DAYS_PER_WEEK, (date.getTime() - weekStart.getTime()) / MS_PER_DAY),
    entry("month", daysInMonth, date.getDate() - 1 + dayFraction),
    entry("year", daysInYear, dayOfYear(date) - 1 + dayFraction),
  ];
}

/** 建站时长：按自然年月日退位，days 为负数时向上一月借位 */
export function computeSiteAge(start: Date, now: Date): SiteAge {
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalDays: Math.max(0, Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY)),
  };
}

/** 解析 YYYY-MM-DD 或 YYYY，失败返回 null */
export function parseStartDate(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), month ? Number(month) - 1 : 0, day ? Number(day) : 1);
  return Number.isNaN(date.getTime()) ? null : date;
}
