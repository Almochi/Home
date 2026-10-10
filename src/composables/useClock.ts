/**
 * 秒级时钟：全站共享（实现见 useTicker），组件卸载即释放订阅。
 * 时钟只关心「现在几点」，所有格式化交给 src/utils/format。
 */
import type { Ref } from "vue";
import { useTicker } from "@/composables/useTicker";

const SECOND_MS = 1000;

export function useClock(): { now: Ref<Date> } {
  return useTicker(SECOND_MS);
}
