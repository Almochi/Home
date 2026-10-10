#!/usr/bin/env node
/**
 * 冒烟测试（pnpm smoke）
 *
 * 用 Playwright 驱动已安装的 Chromium 对构建产物做一次真实浏览器验收：
 * - 收集控制台错误、页面异常与请求失败（网络级失败单独归类，不算 JS 错误）
 * - 校验首屏关键元素、壁纸加载、设置面板、信息面板、明暗切换、色相滑块
 * - 输出桌面与移动端截图，便于人工复核视觉
 *
 * 用法：先起预览服务（pnpm preview 或 vite preview --port 4173），再执行本脚本。
 *   node scripts/smoke.mjs [url]
 */
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = process.argv[2] ?? "http://127.0.0.1:4173/";
const shotDir = resolve(root, "screenshots");

function findChromium() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), ".cache", "ms-playwright");
  if (!existsSync(cache)) return undefined;
  for (const entry of readdirSync(cache)) {
    const candidate = join(cache, entry, "chrome-linux64", "chrome");
    if (existsSync(candidate)) return candidate;
    const legacy = join(cache, entry, "chrome-linux", "chrome");
    if (existsSync(legacy)) return legacy;
  }
  return undefined;
}

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const consoleErrors = [];
const pageErrors = [];
const networkFailures = [];
const IGNORABLE = /Failed to load resource|net::|ERR_|favicon/i;

const executablePath = findChromium();
if (!executablePath) {
  console.error(
    "[smoke] 未找到 Chromium：请设置 CHROME_PATH 或先执行 npx playwright install chromium",
  );
  process.exit(1);
}

mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  /* ----------------------------- 桌面端 ----------------------------- */
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "zh-CN",
  });
  const page = await desktop.newPage();
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (IGNORABLE.test(text)) networkFailures.push(text);
    else consoleErrors.push(text);
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "";
    if (!/ERR_ABORTED/.test(failure)) networkFailures.push(`${request.url()} ${failure}`);
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page
    .waitForSelector(".loading-curtain", { state: "detached", timeout: 20000 })
    .catch(() => {});

  check("加载幕布退场", (await page.locator(".loading-curtain").count()) === 0);
  check("站点标识渲染 h1", (await page.locator("h1").count()) === 1);

  const wallpaper = page.locator(".background-layer__image");
  await wallpaper.waitFor({ state: "attached", timeout: 10000 }).catch(() => {});
  const wallpaperOk = await wallpaper.evaluate((node) => node.complete && node.naturalWidth > 0);
  check("壁纸加载成功", Boolean(wallpaperOk));

  const primary = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--mc-primary").trim(),
  );
  check("HCT 调色板已注入", /^#[0-9a-f]{6}$/i.test(primary), primary);

  // 天气行：数据源直连成功时是真实数据，外部接口不可用时降级为占位文案——两种都算通过
  const weatherRow = page.locator(".clock-weather__weather");
  await weatherRow.waitFor({ state: "attached", timeout: 15000 }).catch(() => {});
  await page
    .waitForFunction(
      () => !document.querySelector(".clock-weather__weather")?.textContent?.includes("天气获取中"),
      undefined,
      {
        timeout: 15000,
      },
    )
    .catch(() => {});
  const weatherText = (await weatherRow.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
  check("天气行渲染", weatherText.length > 0, weatherText);

  await page.screenshot({ path: join(shotDir, "desktop-home.png"), fullPage: false });

  // 设置面板
  await page.getByRole("button", { name: "打开设置" }).click();
  await page.waitForTimeout(400);
  check("设置面板打开", await page.locator(".m3-sheet").isVisible());
  await page.screenshot({ path: join(shotDir, "desktop-settings.png") });

  // 色相滑块 → 调色板随之变化
  const slider = page.getByRole("slider", { name: "种子色相" });
  await slider.focus();
  for (let i = 0; i < 12; i += 1) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const primaryAfter = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--mc-primary").trim(),
  );
  check("色相滑块改变调色板", primaryAfter !== primary, `${primary} → ${primaryAfter}`);

  // 明暗切换
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  // 模式按 跟随系统 → 浅色 → 深色 循环，点两次必定经过「深色」
  const themeButton = page.getByRole("button", { name: /切换明暗模式/ });
  let toggled = false;
  let previous = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  for (let i = 0; i < 2; i += 1) {
    await themeButton.click();
    await page.waitForTimeout(250);
    const current = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    if (current !== previous) toggled = true;
    previous = current;
  }
  check("明暗模式可切换", toggled);

  // 浅色与深色都要保证「压在壁纸上的文字」为固定白色
  const identityColors = [];
  for (let i = 0; i < 2; i += 1) {
    identityColors.push(
      await page
        .locator(".site-identity__label")
        .first()
        .evaluate((node) => getComputedStyle(node).color),
    );
    await page.screenshot({
      path: join(shotDir, i === 0 ? "desktop-mode-a.png" : "desktop-mode-b.png"),
    });
    await themeButton.click();
    await page.waitForTimeout(250);
  }
  check(
    "壁纸上的文字使用固定前景色",
    identityColors.every((color) => color === "rgb(255, 255, 255)"),
    identityColors.join(" / "),
  );

  // 信息面板
  await page.getByRole("button", { name: "打开更多信息" }).click();
  await page.waitForTimeout(400);
  check("信息面板打开", await page.locator(".m3-sheet").isVisible());
  check("时光胶囊有进度条", (await page.locator('[role="progressbar"]').count()) >= 4);
  await page.screenshot({ path: join(shotDir, "desktop-info.png") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 键盘可达性：Tab 能聚焦到顶栏按钮
  await page.keyboard.press("Tab");
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? "");
  check("Tab 可聚焦交互元素", ["A", "BUTTON", "INPUT"].includes(focusedTag), focusedTag);

  // 悬停站点卡片：卡片转玻璃态 + 背景层按需挂一层毛玻璃；指针移开恢复透明
  const firstCard = page.locator(".link-grid__item").first();
  const frost = page.locator(".background-layer__frost");
  await firstCard.hover();
  await page.waitForTimeout(500);
  check("悬停卡片时背景毛玻璃出现", (await frost.count()) === 1);
  const frostFilter = await frost.evaluate((node) => getComputedStyle(node).backdropFilter);
  check("背景毛玻璃真的在虚化", frostFilter.includes("blur"), frostFilter);
  const cardGlass = await firstCard.evaluate((node) => {
    const style = getComputedStyle(node);
    return `${style.backgroundColor} | ${style.backdropFilter}`;
  });
  check(
    "悬停卡片转玻璃态",
    /\/\s*0?\.\d+\)/.test(cardGlass) && cardGlass.includes("blur"),
    cardGlass,
  );
  await page.screenshot({ path: join(shotDir, "desktop-link-frost.png") });
  await page.locator(".links-panel__title").hover();
  await page.waitForTimeout(600);
  check("指针移开后背景恢复透明", (await frost.count()) === 0);

  await desktop.close();

  /* ----------------------------- 移动端 ----------------------------- */
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "zh-CN",
  });
  const mobilePage = await mobile.newPage();
  mobilePage.on("pageerror", (error) => pageErrors.push(`[mobile] ${error.message}`));
  await mobilePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await mobilePage
    .waitForSelector(".loading-curtain", { state: "detached", timeout: 20000 })
    .catch(() => {});
  await mobilePage.waitForTimeout(500);

  const overflow = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  check("移动端无横向溢出", overflow <= 1, `溢出 ${overflow}px`);
  await mobilePage.screenshot({ path: join(shotDir, "mobile-home.png") });

  await mobilePage.getByRole("button", { name: "打开设置" }).click();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: join(shotDir, "mobile-settings.png") });
  check("移动端设置面板可用", await mobilePage.locator(".m3-sheet").isVisible());
  await mobile.close();
} finally {
  await browser.close();
}

/* ----------------------------- 汇总 ----------------------------- */
console.log("");
if (networkFailures.length > 0) {
  console.log(
    `[smoke] 网络级失败 ${networkFailures.length} 条（外部接口不可用时属预期，不算失败）`,
  );
}
if (consoleErrors.length > 0) {
  console.error(`[smoke] 控制台错误 ${consoleErrors.length} 条：`);
  for (const text of consoleErrors.slice(0, 10)) console.error(`  - ${text}`);
}
if (pageErrors.length > 0) {
  console.error(`[smoke] 未捕获异常 ${pageErrors.length} 条：`);
  for (const text of pageErrors.slice(0, 10)) console.error(`  - ${text}`);
}

const failed = results.filter((item) => !item.ok);
if (failed.length > 0 || consoleErrors.length > 0 || pageErrors.length > 0) {
  console.error(
    `\n[smoke] 失败：${failed.length} 项断言未通过，${consoleErrors.length} 条控制台错误，${pageErrors.length} 条异常`,
  );
  process.exit(1);
}
console.log(`[smoke] 通过：${results.length} 项断言全部成功，截图见 screenshots/`);
