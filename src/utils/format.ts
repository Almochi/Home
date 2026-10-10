/**
 * 显示格式化：时钟、时长、日期分片。
 *
 * 全部是纯函数，不依赖响应式状态，因此时钟、播放器、更新日志可以共用同一套口径。
 * 日期不维护中英双份星期表，而是交给 Intl —— 语言切换即生效。
 */

/** 两位补零（时钟与播放器进度共用） */
export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** 24 小时制时钟，等宽数字由字体负责 */
export function formatClock(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/** 秒 → mm:ss（播放器进度用） */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  return `${pad2(minutes)}:${pad2(Math.floor(seconds % 60))}`;
}

export interface DateParts {
  year: string;
  month: string;
  day: string;
  weekday: string;
}

/** 拆分日期，交给模板按语言拼装（中文「2025 年 08 月 12 日 星期二」/ 英文「08/12/2025 · Tuesday」） */
export function formatDateParts(date: Date, locale: string): DateParts {
  const parts = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    weekday: read("weekday"),
  };
}
