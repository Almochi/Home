/**
 * 天气：两个数据源，归一化成同一个 WeatherSnapshot。
 *
 * 边界与职责：
 * - 只做一件事——把云端响应归一化成 WeatherSnapshot，组件不认识任何一方的字段名；
 * - 数据源由 weatherConfig.source 选择，这里是唯一的字段映射处；
 * - 图标优先用 Azure 的 iconCode，Aurora 不返回编码时退回现象文案判断；
 * - 数据源不可用（enabled=false）时直接返回 null，不发任何请求。
 *
 * 数据源：
 * - aurora  AuroraAPI「天气查询」 https://api.andeer.top/api_details.php?id=19
 *           数据来自微软天气，免密钥、CORS 全开；键名是中文，两步协议见 parseAurora；
 * - azure   Azure Maps「Get Current Conditions」
 *           https://learn.microsoft.com/rest/api/maps/weather/get-current-conditions
 */
import { fetchJson } from "@/api/http";
import type { WeatherConfig, WeatherSourceId } from "@/types/config";

export interface WeatherSnapshot {
  /** 展示用的地点名：接口回传优先，其次取配置 */
  city: string;
  /** 天气现象文案 */
  condition: string;
  /** Azure 图标编码；Aurora 不返回，留给文案判断 */
  iconCode?: number;
  /** 已格式化温度：Aurora 是当日区间（18～29℃），Azure 是当前值（18℃） */
  temperature: string;
  /** 风向描述，如「西北风」/「NW」 */
  windDirection: string;
  /** 风速描述，如「2级」/「3.6 km/h」 */
  windSpeed: string;
  /** 空气质量文案，如「优」；Azure 的当前天气不含该字段，留空 */
  air: string;
}

/**
 * Azure 天气图标编码 → 本地图标名。
 * 编码表见 https://learn.microsoft.com/azure/azure-maps/weather-services-concepts
 * 1-30 为白天 / 通用图形，31-44 为特殊与夜间图形。
 */
const ICON_BY_CODE = new Map<number, string>([
  [1, "sunny"],
  [2, "sunny"],
  [3, "sunny"],
  [4, "cloud"],
  [5, "cloud"],
  [6, "cloud"],
  [7, "cloud"],
  [8, "cloud"],
  [11, "foggy"],
  [12, "rainy"],
  [13, "rainy"],
  [14, "rainy"],
  [15, "thunderstorm"],
  [16, "thunderstorm"],
  [17, "thunderstorm"],
  [18, "rainy"],
  [19, "weather-snowy"],
  [20, "weather-snowy"],
  [21, "weather-snowy"],
  [22, "weather-snowy"],
  [23, "weather-snowy"],
  [24, "weather-snowy"],
  [25, "weather-snowy"],
  [26, "weather-snowy"],
  [27, "weather-snowy"],
  [28, "weather-snowy"],
  [29, "weather-snowy"],
  [30, "weather-snowy"],
  [31, "local-fire-department"],
  [32, "ac-unit"],
  [33, "air"],
  [34, "sunny"],
  [35, "sunny"],
  [36, "cloud"],
  [37, "cloud"],
  [38, "cloud"],
  [39, "rainy"],
  [40, "rainy"],
  [41, "thunderstorm"],
  [42, "thunderstorm"],
  [43, "weather-snowy"],
  [44, "weather-snowy"],
]);

/** 未知编码时的兜底：按现象文案猜一次（中文现象名与英文 phrase 都覆盖），全不匹配则为多云 */
function iconByPhrase(condition: string): string {
  const value = condition.toLowerCase();
  if (/雷|thunder/.test(value)) return "thunderstorm";
  if (/雹|hail/.test(value)) return "thunderstorm";
  if (/雪|冰|snow|sleet|ice|flurr/.test(value)) return "weather-snowy";
  if (/雨|rain|shower/.test(value)) return "rainy";
  if (/雾|霾|沙|尘|fog|haze|mist|sand|dust/.test(value)) return "foggy";
  if (/风|wind/.test(value)) return "air";
  if (/晴|clear|sun/.test(value)) return "sunny";
  return "cloud";
}

/** 天气现象（图标编码优先）→ 本地图标名：从编码与描述两个候选里定下唯一结果 */
export function resolveWeatherIcon(iconCode?: number, condition = ""): string {
  if (typeof iconCode === "number" && ICON_BY_CODE.has(iconCode)) {
    return ICON_BY_CODE.get(iconCode) as string;
  }
  return iconByPhrase(condition);
}

/** 去掉两端空白；接口把缺失值给成 null / ""，统一收敛成空串 */
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/* ------------------------------- AuroraAPI ------------------------------- */

/** 接口原样返回的中文字段；城市查不到时每个字段都是 null，温度固定是「～℃」 */
interface AuroraRow {
  城市?: string | null;
  天气?: string | null;
  温度?: string | null;
  风度?: string | null;
  空气质量?: string | null;
}

interface AuroraResponse {
  success?: boolean;
  code?: number;
  msg?: string;
  /** 文档写的是数组，实测命中和未命中都返回单个对象，两种都接住 */
  data?: AuroraRow | AuroraRow[] | string | null;
}

/**
 * 「西北风-2级」→ 风向「西北风」+ 风速「2级」；也见过「微风」「-」这类没有风级的返回，
 * 解析不出来就整体留空，由组件决定显示哪几段。
 */
function splitWind(value: string): { direction: string; speed: string } {
  const [direction = "", speed = ""] = value.split("-").map((part) => part.trim());
  return { direction, speed };
}

/**
 * 城市查不到时接口照样返回 HTTP 200 + success:true，只是字段全为 null。
 * 这种响应必须抛错，否则界面会显示一行空白——城市和现象同时为空就是没查到。
 */
function parseAurora(payload: AuroraResponse, query: string): WeatherSnapshot {
  const raw = Array.isArray(payload.data) ? payload.data[0] : payload.data;
  const row: AuroraRow = raw && typeof raw === "object" ? raw : {};
  const city = text(row.城市);
  const condition = text(row.天气);
  if (!city && !condition) throw new Error("天气接口未返回该城市的数据");
  const wind = splitWind(text(row.风度));
  return {
    city: city || query,
    condition,
    temperature: text(row.温度),
    windDirection: wind.direction,
    windSpeed: wind.speed,
    air: text(row.空气质量),
  };
}

async function loadAurora(
  config: WeatherConfig,
  city: string,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const payload = await fetchJson<AuroraResponse>(config.aurora.endpoint, {
    query: { msg: city, b: config.cityIndex },
    timeoutMs: config.timeoutMs,
    signal,
  });
  return parseAurora(payload, city);
}

/* -------------------------------- Azure --------------------------------- */

interface AzureMeasure {
  value?: number;
  unit?: string;
}

interface AzureCurrentConditions {
  phrase?: string;
  iconCode?: number;
  temperature?: AzureMeasure;
  wind?: {
    direction?: { localizedDescription?: string };
    speed?: AzureMeasure;
  };
}

interface AzureWeatherResponse {
  results?: AzureCurrentConditions[];
}

function formatMeasure(measure: AzureMeasure | undefined, digits = 0): string {
  if (!measure || !Number.isFinite(measure.value)) return "";
  const value = (measure.value as number).toFixed(digits);
  return measure.unit ? `${value} ${measure.unit}` : value;
}

function parseAzure(payload: AzureWeatherResponse, city: string): WeatherSnapshot {
  const current = payload.results?.[0];
  if (!current) throw new Error("Azure Maps 未返回天气数据");
  const degrees = current.temperature?.value;
  return {
    city,
    condition: current.phrase ?? "",
    iconCode: current.iconCode,
    temperature: Number.isFinite(degrees) ? `${Math.round(degrees as number)}℃` : "",
    windDirection: current.wind?.direction?.localizedDescription ?? "",
    windSpeed: formatMeasure(current.wind?.speed, 1),
    air: "",
  };
}

async function loadAzure(
  config: WeatherConfig,
  city: string,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const payload = await fetchJson<AzureWeatherResponse>(
    `${config.azure.endpoint}/weather/currentConditions/json`,
    {
      query: {
        "api-version": config.azure.apiVersion,
        query: `${config.azure.latitude},${config.azure.longitude}`,
        unit: "metric",
        details: "true",
        language: config.azure.language,
        "subscription-key": config.azure.key,
      },
      timeoutMs: config.timeoutMs,
      signal,
    },
  );
  return parseAzure(payload, city);
}

/* ------------------------------- 数据源注册表 ------------------------------ */

type WeatherLoader = (
  config: WeatherConfig,
  city: string,
  signal?: AbortSignal,
) => Promise<WeatherSnapshot>;

/** 新增数据源时在这里加一项，并在 types/config.ts 的 WeatherSourceId 里登记（漏了会编译失败） */
const LOADERS: Record<WeatherSourceId, WeatherLoader> = {
  aurora: loadAurora,
  azure: loadAzure,
};

/**
 * 查一次天气。city 由调用方决定：开了自动定位就是 IP 定位结果，否则是配置里的兜底城市
 * （组件不自己拼城市名，定位与回落都发生在 useWeather）。
 */
export async function fetchWeather(
  config: WeatherConfig,
  city: string,
  signal?: AbortSignal,
): Promise<WeatherSnapshot | null> {
  if (!config.enabled) return null;
  return LOADERS[config.source](config, city, signal);
}
