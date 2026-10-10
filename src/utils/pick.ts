/**
 * 按类型收窄的取值器：旧数据不会把运行期状态污染成错误类型。
 *
 * 刻意与存储解耦：输入可以来自 localStorage、URL 参数或任何不可信来源，
 * 输出永远是「合法值」。因此这里不做任何 I/O，也不认识任何存储键。
 */

export function pickBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function pickNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/** 只接受白名单内的字符串，其余一律回落到默认值（枚举字段专用） */
export function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}
