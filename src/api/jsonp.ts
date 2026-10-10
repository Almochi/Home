/**
 * 最小 JSONP 实现：Meting-API 在部分音源上会返回 @module@callback@callbackFn@url 形式，
 * 需要浏览器端再发一次 JSONP 才能拿到真实播放地址。
 * 只用于这一条兼容路径，超时与清理都在这里完成。
 */
const CALLBACK_PREFIX = "__homeJsonp";

let seed = 0;

export function fetchJsonp<T>(
  url: string,
  options: { timeoutMs?: number; callbackParam?: string } = {},
): Promise<T> {
  const { timeoutMs = 10_000, callbackParam = "callback" } = options;
  return new Promise<T>((resolve, reject) => {
    seed += 1;
    const callbackName = `${CALLBACK_PREFIX}${seed}`;
    const target = new URL(url, window.location.origin);
    target.searchParams.set(callbackParam, callbackName);

    const script = document.createElement("script");
    const cleanup = () => {
      window.clearTimeout(timer);
      script.remove();
      delete (window as unknown as Record<string, unknown>)[callbackName];
    };
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("JSONP 请求超时"));
    }, timeoutMs);

    (window as unknown as Record<string, unknown>)[callbackName] = (payload: T) => {
      cleanup();
      resolve(payload);
    };
    script.src = target.toString();
    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP 请求失败"));
    };
    document.head.append(script);
  });
}
