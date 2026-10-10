/**
 * 链接数据：图标名统一走本地图标注册表（brand 优先，`ui:` 前缀指定 Material Symbols），
 * 图片请写在 `img` 字段。这里只负责过滤无效条目 ——
 * 图标名是否正确由 `pnpm icons` 与 `pnpm design:lint` 校验（写错会直接失败）。
 */
import siteRaw from "@/config/links/siteLinks.json";
import socialRaw from "@/config/links/socialLinks.json";
import type { SiteLink, SocialLink } from "@/types/config";

function isUsable(link: { name?: string }): boolean {
  return typeof link.name === "string" && link.name.trim().length > 0;
}

export const socialLinks: SocialLink[] = (socialRaw as SocialLink[]).filter(
  (link) => isUsable(link) && Boolean(link.url),
);

export const siteLinks: SiteLink[] = (siteRaw as SiteLink[]).filter(
  (link) => isUsable(link) && Boolean(link.link),
);
