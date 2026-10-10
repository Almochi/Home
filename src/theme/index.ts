/**
 * 主题运行时：把 HCT 调色板写入 CSS 变量，并统一管理明暗、动效与壁纸取色。
 *
 * 约定：
 * - 只有这里可以写 --mc-* / --hue / .dark / .motion-reduced，组件不得自行操作根元素；
 * - 任何一次应用都通过 rAF 合并，拖拽色相滑块时不会逐帧重算 35 个角色；
 * - 系统偏好（prefers-color-scheme / prefers-reduced-motion）变化会实时跟随。
 */
import { reactive, readonly } from "vue";
import { themeDefaults } from "@/config/themeDefaults";
import { normalizeHue, ROLE_TO_CSS, resolveScheme } from "@/theme/colorScheme";
import { loadThemePrefs, saveThemePrefs, type ThemePrefs } from "@/theme/prefs";

interface ThemeState {
  prefs: ThemePrefs;
  isDark: boolean;
  /** 由壁纸推导出的色相（跟随壁纸且取色成功时存在） */
  wallpaperHue: number | null;
  /** 系统是否要求减少动效 */
  systemReducedMotion: boolean;
}

const state = reactive<ThemeState>({
  prefs: loadThemePrefs(),
  isDark: false,
  wallpaperHue: null,
  systemReducedMotion: false,
});

export const themeState = readonly(state) as Readonly<ThemeState>;

const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

/** 当前生效的色相：跟随壁纸且取色成功时优先使用壁纸色相 */
export function activeHue(): number {
  const derived = state.prefs.followWallpaper ? state.wallpaperHue : null;
  return normalizeHue(derived ?? state.prefs.hue);
}

/** 是否处于减少动效状态（系统偏好或用户手动开启） */
export function isMotionReduced(): boolean {
  if (state.prefs.motion === "reduced") return true;
  if (state.prefs.motion === "full") return false;
  return state.systemReducedMotion;
}

function resolveIsDark(): boolean {
  if (state.prefs.mode === "dark") return true;
  if (state.prefs.mode === "light") return false;
  return darkQuery.matches;
}

let frame = 0;
/** 首帧之前的 paint 不比对状态，不渐变 */
let booted = false;
let switchingTimer = 0;

/** 渐变时长：直接读 tokens.css 的 --m3e-duration-medium，避免两处各写一份 */
function modeSwitchMs(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--m3e-duration-medium")
    .trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return 250;
  // 计算值会被规范化：250ms 读回来常是 ".25s"，带 s 结尾的要乘回毫秒
  return raw.endsWith("ms") ? value : value * 1000;
}

/** 应用调色板（rAF 合并，重复调用只保留最后一次） */
function schedule(): void {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    paint();
  });
}

function paint(): void {
  const root = document.documentElement;
  const isDark = resolveIsDark();
  const animate = booted && state.isDark !== isDark && !isMotionReduced();

  const apply = (): void => {
    const scheme = resolveScheme(activeHue(), isDark, state.prefs.style, state.prefs.spec);
    for (const [role, cssVar] of Object.entries(ROLE_TO_CSS)) {
      root.style.setProperty(cssVar, scheme[role as keyof typeof scheme]);
    }
    root.style.setProperty("--hue", String(Math.round(activeHue())));
    root.style.setProperty("--mc-shadow", scheme.shadow);
    root.classList.toggle("dark", isDark);
    root.classList.toggle("motion-reduced", isMotionReduced());
    root.style.colorScheme = isDark ? "dark" : "light";

    // 浏览器 UI（地址栏 / 状态栏）跟随页面底色
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = isDark ? scheme.surface : scheme.surfaceContainerLow;
  };

  if (animate) {
    // 渐变：先挂上 theme-switching 再改变量。两步之间必须强制一次样式计算，
    // 否则浏览器在同一帧里只看得到终值，过渡没有起点，依旧瞬间跳变。
    root.classList.add("theme-switching");
    void root.offsetWidth;
    apply();
    window.clearTimeout(switchingTimer);
    switchingTimer = window.setTimeout(() => {
      root.classList.remove("theme-switching");
    }, modeSwitchMs());
  } else {
    apply();
  }

  state.isDark = isDark;
  booted = true;
}

/** 初始化：首帧前调用一次，之后由系统偏好与用户操作驱动 */
export function initTheme(): void {
  state.systemReducedMotion = motionQuery.matches;
  paint();
  darkQuery.addEventListener("change", schedule);
  motionQuery.addEventListener("change", () => {
    state.systemReducedMotion = motionQuery.matches;
    schedule();
  });
}

/** 更新主题偏好（部分字段），自动持久化并重绘 */
export function updateTheme(patch: Partial<ThemePrefs>): void {
  state.prefs = { ...state.prefs, ...patch, hue: normalizeHue(patch.hue ?? state.prefs.hue) };
  saveThemePrefs({ ...state.prefs });
  schedule();
}

/** 壁纸取色结果；传 null 表示回到配置的种子色相 */
export function setWallpaperHue(hue: number | null): void {
  const next = hue === null ? null : Math.round(normalizeHue(hue));
  if (next === state.wallpaperHue) return;
  state.wallpaperHue = next;
  schedule();
}

/** 恢复默认主题（用于「设置 → 外观」的重置按钮） */
export function resetTheme(): void {
  updateTheme({ ...themeDefaults });
}

export { themeDefaults };
