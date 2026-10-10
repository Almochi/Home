<script setup lang="ts">
/**
 * 简介卡片：默认展示主文案，展开信息面板时切换到备用文案。
 * 整卡是可点击按钮（aria-expanded 表达状态），内部不再嵌套其他控件。
 */
import { computed } from "vue";
import Icon from "@/components/atoms/Icon.vue";
import Surface from "@/components/atoms/Surface.vue";
import { profileConfig } from "@/config/profile";
import { useI18n } from "@/i18n";

const props = defineProps<{ expanded: boolean }>();
defineEmits<{ toggle: [] }>();

const { t } = useI18n();

const content = computed(() =>
  props.expanded ? profileConfig.greeting.alternate : profileConfig.greeting.primary,
);
</script>

<template>
  <Surface class="greeting-card" variant="panel" as="div">
    <button
      class="greeting-card__button m3-state-layer"
      type="button"
      :aria-expanded="expanded"
      :aria-label="expanded ? t('a11y.greeting.collapse') : t('a11y.greeting.expand')"
      @click="$emit('toggle')"
    >
      <span class="greeting-card__quote" aria-hidden="true">
        <Icon name="format-quote" />
      </span>
      <Transition name="m3-swap" mode="out-in">
        <span :key="content.title + content.text" class="greeting-card__text">
          <span class="greeting-card__title">{{ content.title }}</span>
          <span class="greeting-card__body">{{ content.text }}</span>
        </span>
      </Transition>
      <Icon :name="expanded ? 'expand-less' : 'expand-more'" class="greeting-card__indicator" />
    </button>
  </Surface>
</template>

<style scoped>
.greeting-card {
  inline-size: 100%;
}

.greeting-card__button {
  display: flex;
  align-items: flex-start;
  gap: var(--m3e-space-3);
  inline-size: 100%;
  /* 与右栏功能卡同一量级的高度，左栏三块叠起来才与右栏平衡 */
  min-block-size: 9rem;
  padding: var(--m3e-space-5);
  border: 0;
  border-radius: inherit;
  background-color: transparent;
  color: inherit;
  text-align: start;
  cursor: pointer;
}

.greeting-card__quote {
  display: inline-flex;
  color: var(--primary);
  font-size: var(--m3e-icon-size-2xl);
  flex: none;
}

.greeting-card__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--m3e-space-2);
  min-inline-size: 0;
}

/* 顺序要紧：先取字体令牌，再用展示字族覆盖 family，否则 Pacifico 会被简写重置掉 */
.greeting-card__title {
  font: var(--m3e-type-title-medium);
  font-family: var(--font-display);
  font-size: var(--m3e-size-greeting);
  color: var(--primary);
}

.greeting-card__body {
  font: var(--m3e-type-body-large);
  color: var(--on-surface-variant);
}

.greeting-card__indicator {
  color: var(--on-surface-variant);
  flex: none;
}
</style>
