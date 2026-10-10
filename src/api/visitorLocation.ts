/**
 * 访客定位：IP → 中国城市名，交给天气模块当查询词。
 *
 * 边界与职责：
 * - 只做一件事——判断「访客在哪个城市」，不认识任何天气字段（那是 src/api/weather.ts 的事）；
 * - 多个源按顺序试，第一个给出「中国 IP + 市级名称」的胜出，全部失败返回 null；
 * - 只认中国 IP：天气数据源是中文服务，国外的州 / 市名它查不到，这种情况由调用方回落到
 *   配置城市（见 useWeather）；定位失败一律返回 null 而不抛错——定位只是锦上添花，
 *   不该让天气整行消失。
 *
 * 三个源的实测情况（2026-09，同一出口 IP）：
 * - restapi.amap.com/v3/ip  高德官方（旧版用的就是它），响应带 Access-Control-Allow-Origin: *，
 *   需要免费的 Web服务 Key、每日 5000 次；填了 weatherRaw.geoKey 才启用，并排在第一位；
 * - api.mir6.com/api/ip     0.5-1.6s，字段最全（province / city / districts / isp）；
 * - api.vore.top/api/IPdata 1.0-4.1s，且出现过一次 >15s 无响应，所以排在最后当备胎。
 *
 * 只回显 IP、既没有地理信息也没有 CORS 的不要接：ddns.oray.com/checkip（text/html）、
 * ip.3322.net（text/plain）、ipw.cn 系列（本地与 AliDNS 都查不到 A 记录）。
 */
import { fetchJson } from "@/api/http";
import type { WeatherConfig } from "@/types/config";

export interface VisitorLocation {
  /** 城市名，如「丹东市」——可以直接当天气接口的查询词（带「市」也能匹配上） */
  city: string;
  /** 省级名称，如「辽宁省」 */
  region: string;
  /** 命中的源 id，排查用 */
  source: string;
}

interface ParsedLocation {
  region: string;
  city: string;
}

interface GeoSource {
  id: string;
  url: string;
  /** 需要密钥的源（高德）靠它把 key 交给 query，其余源返回 undefined */
  query?: (config: WeatherConfig) => Record<string, string>;
  /** 解析不出来（结构变了 / 不是中国 IP）就返回 null，换下一个源 */
  parse: (payload: unknown) => ParsedLocation | null;
}

/** 防御式取值：响应结构由第三方决定，任何一层都可能是 undefined */
function pick(payload: unknown, ...path: string[]): unknown {
  let current: unknown = payload;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/** 免费源：新增时在这里加一项即可，数组顺序就是尝试顺序 */
const FREE_SOURCES: GeoSource[] = [
  {
    id: "mir6",
    url: "https://api.mir6.com/api/ip?type=json",
    parse: (payload) => {
      if (pick(payload, "data", "countryCode") !== "CN") return null;
      return {
        region: text(pick(payload, "data", "province")),
        city: text(pick(payload, "data", "city")),
      };
    },
  },
  {
    id: "vore",
    url: "https://api.vore.top/api/IPdata",
    parse: (payload) => {
      if (pick(payload, "ipinfo", "cnip") !== true) return null;
      return {
        region: text(pick(payload, "ipdata", "info1")),
        city: text(pick(payload, "ipdata", "info2")),
      };
    },
  },
];

/**
 * 高德「IP 定位」：填了 Web服务 Key 才生成，生成后排在所有免费源前面。
 * 直辖市（北京 / 上海…）与国外 IP 的 city 可能是空数组，这时退回 province——
 * 天气接口认「北京市」这种写法。
 */
function amapSource(key: string): GeoSource | null {
  if (!key.trim()) return null;
  return {
    id: "amap",
    url: "https://restapi.amap.com/v3/ip",
    query: (config) => ({ key: config.geoKey }),
    parse: (payload) => {
      if (pick(payload, "status") !== "1") return null;
      const region = text(pick(payload, "province"));
      return { region, city: text(pick(payload, "city")) || region };
    },
  };
}

/**
 * 定位访客所在城市；全部源都失败时返回 null，由调用方回落到配置城市。
 * 请求超时由 http.ts 保证；主动取消（AbortError）继续往外抛，避免把「取消」记成「定位失败」。
 */
export async function fetchVisitorLocation(
  config: WeatherConfig,
  signal?: AbortSignal,
): Promise<VisitorLocation | null> {
  const amap = amapSource(config.geoKey);
  const sources = amap ? [amap, ...FREE_SOURCES] : FREE_SOURCES;

  for (const source of sources) {
    try {
      const payload = await fetchJson<unknown>(source.url, {
        query: source.query?.(config),
        timeoutMs: config.locateTimeoutMs,
        signal,
      });
      const parsed = source.parse(payload);
      if (parsed?.city) return { city: parsed.city, region: parsed.region, source: source.id };
    } catch (error) {
      if ((error as Error).name === "AbortError") throw error;
      // 换下一个源；全失败由调用方回落配置城市
    }
  }
  return null;
}
