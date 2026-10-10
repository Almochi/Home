import { onMounted, ref } from "vue";
import { fetchHitokoto } from "@/api/hitokoto";
import { t } from "@/i18n";
import { notifyError } from "@/stores/snackbar";

export function useHitokoto() {
  const text = ref(t("hitokoto.placeholder"));
  const from = ref(t("hitokoto.from"));
  const loading = ref(false);

  async function refresh(): Promise<void> {
    if (loading.value) return;
    loading.value = true;
    try {
      const result = await fetchHitokoto();
      text.value = result.text;
      from.value = result.from || t("hitokoto.from");
    } catch {
      text.value = t("hitokoto.placeholder");
      from.value = t("hitokoto.from");
      notifyError(t("hitokoto.failed"));
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => void refresh());

  return { text, from, loading, refresh };
}
