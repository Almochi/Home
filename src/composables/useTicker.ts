/**
 * 对齐定时器：全站按「周期」共享定时器，替代各处手写的 setInterval / setTimeout。
 *
 * 三个必须守住的点：
 * 1. 对齐：1000ms 的定时器长期运行会漂移，导致秒数跳变；这里每次重算到下一个整刻度；
 * 2. 停摆：页面隐藏时清除定时器，回到前台立刻补一次，后台标签页零空转；
 * 3. 共享：同一周期只保留一个定时器与一份 now，多订阅者各自引用计数。
 */
import { onBeforeUnmount, onMounted, type Ref, ref } from "vue";

interface Ticker {
  now: Ref<Date>;
  timer: number;
  subscribers: number;
}

const tickers = new Map<number, Ticker>();

function stop(ticker: Ticker): void {
  if (ticker.timer) window.clearTimeout(ticker.timer);
  ticker.timer = 0;
}

function schedule(ticker: Ticker, periodMs: number): void {
  stop(ticker);
  ticker.timer = window.setTimeout(
    () => {
      ticker.now.value = new Date();
      schedule(ticker, periodMs);
    },
    periodMs - (Date.now() % periodMs) + 4,
  );
}

function handleVisibility(): void {
  for (const [period, ticker] of tickers) {
    if (document.hidden) {
      stop(ticker);
    } else if (ticker.subscribers > 0) {
      ticker.now.value = new Date();
      schedule(ticker, period);
    }
  }
}

document.addEventListener("visibilitychange", handleVisibility);

/**
 * 订阅某个周期的「当前时间」；最后一个订阅者卸载时定时器自动停止。
 * enabled 为 false 时完全不订阅 —— 功能开关关闭即零负担，不留空转定时器。
 */
export function useTicker(periodMs: number, enabled = true): { now: Ref<Date> } {
  let ticker = tickers.get(periodMs);
  if (!ticker) {
    ticker = { now: ref(new Date()), timer: 0, subscribers: 0 };
    tickers.set(periodMs, ticker);
  }
  const current = ticker;

  onMounted(() => {
    if (!enabled) return;
    current.subscribers += 1;
    if (current.subscribers === 1 && !document.hidden) schedule(current, periodMs);
  });

  onBeforeUnmount(() => {
    if (!enabled) return;
    current.subscribers = Math.max(0, current.subscribers - 1);
    if (current.subscribers === 0) stop(current);
  });

  return { now: current.now };
}
