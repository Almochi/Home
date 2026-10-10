import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { siteConfig } from "./src/config/site";

/** PWA 图标尺寸，对应 public/images/icon/<size>.png */
const ICON_SIZES = [48, 72, 96, 128, 144, 192, 512];

/**
 * PWA 的 theme_color 只能是静态值：这里取默认种子色相（315）下暗色 surface 容器色。
 * 修改 src/config/theme.ts 的默认色相后，请同步此常量与 index.html 的首帧背景。
 */
const PWA_THEME_COLOR = "#17121b";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

/**
 * 把站点身份写进 index.html：占位符负责「无 JS 时也可读」，运行时再由 src/utils/documentHead.ts
 * 同步一次。两者共用 src/config/site.ts 这一份配置，站点信息不再有第二个入口。
 */
function siteHead(): Plugin {
  return {
    name: "home:site-head",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const values: Record<string, string> = {
          "%SITE_NAME%": siteConfig.name,
          "%SITE_DES%": siteConfig.description,
          "%SITE_KEYWORDS%": siteConfig.keywords,
          "%SITE_AUTHOR%": siteConfig.author,
          "%SITE_LANG%": siteConfig.lang,
          "%SITE_LOGO%": siteConfig.logo.favicon,
          "%SITE_APPLE_LOGO%": siteConfig.logo.apple,
        };
        return Object.entries(values).reduce(
          (out, [token, value]) => out.replaceAll(token, value),
          html,
        );
      },
    },
  };
}

export default defineConfig({
  // 版本号注入：组件里可以直接用 __APP_VERSION__，无需引入 package.json
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    siteHead(),
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      // 由 src/main.ts 通过 virtual:pwa-register 显式注册，便于把「有新版本」交给 M3E Snackbar
      injectRegister: null,
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,ttf,woff2,jpg,webp}"],
        // 壁纸体积大且按需切换：不放进 precache（否则首次安装要下几 MB），
        // 改由下面的 runtimeCaching 图片规则按需缓存
        globIgnores: ["**/images/wallpaper/**", "**/images/background*.jpg"],
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css|woff2?|ttf)$/,
            handler: "CacheFirst",
            options: { cacheName: "static-assets" },
          },
          {
            urlPattern: /\.(?:png|jpe?g|svg|gif|webp|avif)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-assets",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: siteConfig.name,
        short_name: siteConfig.name,
        description: siteConfig.description,
        lang: siteConfig.lang,
        display: "standalone",
        start_url: "/",
        scope: "/",
        theme_color: PWA_THEME_COLOR,
        background_color: PWA_THEME_COLOR,
        icons: ICON_SIZES.map((size) => ({
          src: `/images/icon/${size}.png`,
          sizes: `${size}x${size}`,
          type: "image/png",
        })),
      },
    }),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  build: {
    target: "es2022",
    cssTarget: "chrome111",
    // Vite 8 默认使用 Rolldown 自带的 oxc 压缩器：比 terser 快一个数量级，
    // 且同样支持「去掉调试输出」，因此不再需要额外的 terser 依赖。
    minify: "oxc",
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // 配色引擎只在主题初始化时用到一次，单独分包避免拖慢首屏关键路径
        advancedChunks: {
          groups: [{ name: "color-engine", test: /material-color-utilities/ }],
        },
        minify: { compress: { dropConsole: true, dropDebugger: true } },
      },
    },
  },
});
