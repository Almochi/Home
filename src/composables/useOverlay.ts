/**
 * 浮层行为：焦点陷阱、Esc 关闭、打开时接管焦点、关闭后归还焦点。
 * Dialog 与 Sheet 共用这一份实现，保证键盘行为一致。
 */
import { nextTick, onBeforeUnmount, type Ref, watch } from "vue";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface OverlayOptions {
  /** 浮层容器 */
  container: Ref<HTMLElement | null>;
  /** 是否打开 */
  active: Ref<boolean>;
  /** Esc / 遮罩点击时的关闭回调 */
  onClose: () => void;
}

export function useOverlay({ container, active, onClose }: OverlayOptions): void {
  let lastFocused: HTMLElement | null = null;

  function focusables(): HTMLElement[] {
    const root = container.value;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (node) => !node.hasAttribute("hidden") && node.offsetParent !== null,
    );
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const nodes = focusables();
    if (nodes.length === 0) {
      event.preventDefault();
      container.value?.focus();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const current = document.activeElement as HTMLElement | null;

    if (event.shiftKey && (current === first || !container.value?.contains(current))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  watch(active, async (open) => {
    if (open) {
      lastFocused = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleKeydown, true);
      await nextTick();
      const [firstFocusable] = focusables();
      (firstFocusable ?? container.value)?.focus();
    } else {
      document.removeEventListener("keydown", handleKeydown, true);
      lastFocused?.focus?.();
      lastFocused = null;
    }
  });

  onBeforeUnmount(() => document.removeEventListener("keydown", handleKeydown, true));
}
