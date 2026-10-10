/**
 * 持久化唯一入口：所有 localStorage 读写都必须经过这里。
 *
 * 契约：写入统一为 { version, data } 信封，读取只认这个形状 ——
 * 结构不符、被手工改坏、隐私模式、配额已满，一律静默回落到默认值。
 * 业务层只需要关心「拿到的永远是合法值」，不需要自己写 try/catch。
 *
 * 与存储无关的值域校验（pickBoolean / pickNumber / pickEnum）在 utils/pick。
 */

interface Envelope<T> {
  version?: number;
  data?: T;
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Envelope<T> | null;
    if (!parsed || typeof parsed !== "object" || !("data" in parsed)) return fallback;
    return (parsed.data ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, data: unknown, version = 1): boolean {
  try {
    localStorage.setItem(key, JSON.stringify({ version, data }));
    return true;
  } catch {
    return false;
  }
}
