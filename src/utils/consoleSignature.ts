/**
 * 控制台签名：只打印站点名、版本与站点地址（配置了仓库时再带上仓库地址），不打印任何用户数据。
 * 是否调用由 src/config/features.ts 的 consoleSignature 开关决定（见 main.ts）。
 */
import { siteConfig } from "@/config/site";

export function logConsoleSignature(): void {
  const title = "font-size:16px;font-weight:600;color:inherit";
  const content = "font-size:12px;color:inherit;opacity:.7";
  const line = [`v${__APP_VERSION__}`, siteConfig.url.href, siteConfig.repo]
    .filter(Boolean)
    .join(" · ");
  console.info(`%c${siteConfig.name}\n%c${line}`, title, content);
}
