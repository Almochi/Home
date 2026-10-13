/**
 * 站点身份：全站唯一的一份站点信息，构建期（vite.config 注入 index.html）与运行时共用。
 *
 * 这个文件刻意不 import 任何模块（只带一个类型），因为它也会被 vite.config 直接读取，
 * 而配置文件里解析不了 "@/" 别名。要改站点信息，只动下面的 siteRaw 常量。
 */
import type { SiteConfig } from "@/types/config";

const siteRaw = {
  name: "杏团の主页",
  author: "杏团",
  keywords: "杏团,Almochi,个人主页",
  description: "杏团的个人主页",
  /** 站点地址：裸域名即可，协议会自动补全。本站发布在 GitHub Pages，主机是 www.almochi.cn */
  url: "www.almochi.cn",
  /** 界面默认语言（IETF 标记）：zh-CN | en */
  lang: "zh-CN",
  logo: {
    /** 矢量图标：头像与 favicon 共用同一份，现代浏览器按任意尺寸渲染都清晰 */
    favicon: "/images/logo.svg",
    avatar: "/images/logo.svg",
    /** iOS 不认 SVG 图标，这个必须留 PNG（180×180，由 src 的同一份 SVG 渲染而来） */
    apple: "/images/icon/apple-touch-icon.png",
  },
  /** 建站日期（YYYY-MM-DD 或 YYYY），留空则不显示 */
  startDate: "2026-10-10",
  /** 备案号，留空则不显示；填了会显示在页脚（如 "京ICP备00000000号-1"） */
  icp: "",
  /**
   * 项目仓库地址（如 https://github.com/<你>/home）：留空则页脚、设置面板、信息面板里的
   * 仓库入口整体不渲染。上游致敬写在 README 里，不占界面位置。
   */
  repo: "https://github.com/Almochi/Home",
} as const;

/** 地址规范化：almochi.cn / //almochi.cn / https://almochi.cn 都接受 */
function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("//")) return `https:${value}`;
  return `https://${value}`;
}

/** 取出主机名（不含协议与路径） */
function hostOf(url: string): string {
  try {
    return new URL(normalizeUrl(url)).host;
  } catch {
    return normalizeUrl(url)
      .replace(/^https?:\/\//, "")
      .split("/")[0] as string;
  }
}

/** 首段 + 后缀：almochi.cn → { label: "almochi", suffix: ".cn" } */
function splitHost(host: string): { label: string; suffix: string } {
  const index = host.indexOf(".");
  if (index < 1) return { label: host, suffix: "" };
  return { label: host.slice(0, index), suffix: host.slice(index) };
}

/** 显示用主机名：去掉 www. 前缀，www.almochi.cn 在页面上依旧显示为 almochi.cn */
function displayHost(host: string): string {
  return host.startsWith("www.") ? host.slice(4) : host;
}

/** 归一化建站日期；与 utils/capsule 的 parseStartDate 同名但不同职责，这里解析的是配置原文 */
function resolveStartDate(value: string): { startDate: string | null; startYear: number | null } {
  if (!value) return { startDate: null, startYear: null };
  const year = Number.parseInt(value.slice(0, 4), 10);
  return { startDate: value, startYear: Number.isFinite(year) ? year : null };
}

const host = hostOf(siteRaw.url);
const { label, suffix } = splitHost(displayHost(host));
const { startDate, startYear } = resolveStartDate(siteRaw.startDate);

export const siteConfig: SiteConfig = {
  name: siteRaw.name,
  author: siteRaw.author,
  keywords: siteRaw.keywords,
  description: siteRaw.description,
  lang: siteRaw.lang,
  url: { href: normalizeUrl(siteRaw.url), host, label, suffix },
  logo: { ...siteRaw.logo },
  startDate,
  startYear,
  icp: siteRaw.icp || null,
  repo: siteRaw.repo.trim() || null,
};
