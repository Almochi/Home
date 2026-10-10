/**
 * 网络请求基建：超时、取消、JSON 解析与错误归一化。
 * 所有外部请求都必须经过这里，禁止在组件里裸用 fetch。
 */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    readonly url = "",
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface FetchOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  /** 追加到请求上的额外参数 */
  query?: Record<string, string | number>;
  headers?: Record<string, string>;
}

function buildUrl(url: string, query?: Record<string, string | number>): string {
  if (!query) return url;
  const target = new URL(url, window.location.origin);
  for (const [key, value] of Object.entries(query)) target.searchParams.set(key, String(value));
  return target.toString();
}

/** 带超时的 fetch + JSON 解析；超时与外部取消都会抛出 AbortError */
export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { timeoutMs = 10_000, signal, query, headers } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(
    () => controller.abort(new DOMException("timeout", "TimeoutError")),
    timeoutMs,
  );
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    const finalUrl = buildUrl(url, query);
    const response = await fetch(finalUrl, { signal: controller.signal, headers });
    if (!response.ok) {
      throw new HttpError(`请求失败（HTTP ${response.status}）`, response.status, finalUrl);
    }
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/** 带超时的纯文本请求（歌词文件用） */
export async function fetchText(url: string, options: FetchOptions = {}): Promise<string> {
  const { timeoutMs = 10_000, signal } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(
    () => controller.abort(new DOMException("timeout", "TimeoutError")),
    timeoutMs,
  );
  signal?.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok)
      throw new HttpError(`请求失败（HTTP ${response.status}）`, response.status, url);
    return await response.text();
  } finally {
    window.clearTimeout(timer);
  }
}
