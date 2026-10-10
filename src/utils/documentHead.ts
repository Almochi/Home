/**
 * 文档头同步：index.html 里的占位符负责「无 JS 时也可读」，这里负责
 * 「运行时以 src/config 为准」，两者共用同一份配置。
 */
import { siteConfig } from "@/config/site";

function upsertMeta(key: "name" | "property", value: string, content: string): void {
  let node = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(key, value);
    document.head.append(node);
  }
  node.content = content;
}

function upsertLink(rel: string, href: string): void {
  let node = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement("link");
    node.rel = rel;
    document.head.append(node);
  }
  node.href = href;
}

/** 把 src/config/site.ts 的站点身份写进 <title> / <meta> / <link> */
export function syncDocumentHead(): void {
  document.title = siteConfig.name;
  upsertMeta("name", "description", siteConfig.description);
  upsertMeta("name", "keywords", siteConfig.keywords);
  upsertMeta("name", "author", siteConfig.author);
  upsertMeta("property", "og:title", siteConfig.name);
  upsertMeta("property", "og:description", siteConfig.description);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:url", siteConfig.url.href);

  upsertLink("icon", siteConfig.logo.favicon);
  upsertLink("apple-touch-icon", siteConfig.logo.apple);
  upsertLink("bookmark", siteConfig.logo.apple);
}
