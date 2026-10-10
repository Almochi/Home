/**
 * 提示条（M3 Snackbar）队列：全局单例，最多同时展示 3 条。
 *
 * 取代原先散落各处的 ElMessage 调用，统一入口、统一动效与无障碍语义。
 * 放在 stores 而不是 composables：它是与组件生命周期无关的全局服务，
 * 播放器、壁纸、PWA 等模块都可以直接调用，不需要经过组件。
 */
import { ref } from "vue";

export type SnackbarVariant = "default" | "error";

export interface SnackbarAction {
  label: string;
  onAction?: () => void;
}

export interface SnackbarItem {
  id: number;
  message: string;
  variant: SnackbarVariant;
  icon?: string;
  /** 毫秒；0 表示常驻（需要用户处理，例如「有新版本」） */
  duration: number;
  action?: SnackbarAction;
}

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 3200;

/** 当前展示中的提示条（渲染层只读） */
export const snackbarItems = ref<SnackbarItem[]>([]);
let seed = 0;

export function dismiss(id: number): void {
  snackbarItems.value = snackbarItems.value.filter((item) => item.id !== id);
}

export function notify(
  message: string,
  options: Partial<Omit<SnackbarItem, "id" | "message">> = {},
): number {
  seed += 1;
  const id = seed;
  const item: SnackbarItem = {
    id,
    message,
    variant: options.variant ?? "default",
    icon: options.icon,
    duration: options.duration ?? DEFAULT_DURATION,
    action: options.action,
  };
  snackbarItems.value = [...snackbarItems.value, item].slice(-MAX_VISIBLE);
  if (item.duration > 0) {
    window.setTimeout(() => dismiss(id), item.duration);
  }
  return id;
}

/** 失败提示的统一写法：红色 + 错误图标 */
export function notifyError(message: string): number {
  return notify(message, { variant: "error", icon: "error", duration: 4000 });
}
