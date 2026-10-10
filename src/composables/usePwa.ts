import { registerSW } from "virtual:pwa-register";
import { features } from "@/config/features";
import { t } from "@/i18n";
import { notify } from "@/stores/snackbar";

/** 注册 Service Worker；检测到新版本时用 Snackbar 提示，而不是写 console。 */
export function usePwa(): void {
  if (!("serviceWorker" in navigator)) return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      if (!features.pwaUpdateNotice) return;
      notify(t("snackbar.update.ready"), {
        duration: 0,
        icon: "refresh",
        action: { label: t("snackbar.refresh"), onAction: () => void updateSW(true) },
      });
    },
  });
}
