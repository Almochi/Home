<script setup lang="ts">
/**
 * 播放器引擎宿主：不渲染任何可见内容，只负责
 * 1) 把偏好同步到音频元素；2) 卸载时释放资源。
 *
 * 歌单**不在首屏拉取**：只有用户在设置里显式开启「自动播放」，或者打开播放器 /
 * 点播放（见 engine.toggle、PlaylistDialog）时才请求第三方接口。
 */
import { onBeforeUnmount, watch } from "vue";
import { musicConfig } from "@/config/music";
import { usePlayer } from "@/player";
import { appState } from "@/stores/app";

const { ensurePlaylist, syncPreferences, dispose } = usePlayer();

// 开启自动播放是用户的显式选择：这种情况首屏就加载歌单
if (musicConfig.enabled && appState.playerAutoplay) void ensurePlaylist();

watch(
  () => [appState.playerVolume, appState.playerLoop] as const,
  () => syncPreferences(),
);

onBeforeUnmount(dispose);
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
