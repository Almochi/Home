/**
 * 天气数据源：默认走 AuroraAPI「天气查询」（数据来自微软天气，免密钥），
 * 也可以切回 Azure Maps「Get Current Conditions」（官方接口，字段最全但要订阅密钥）。
 *
 * - 只有「功能开关打开 + 所选数据源可用」才会发请求，其余情况连定时器都不起；
 * - 开了 autoLocate 会额外向 IP 定位服务发一次请求（见 src/api/visitorLocation.ts），关掉则完全不发；
 * - 两个数据源的字段映射都写在 src/api/weather.ts，组件只认归一化后的 WeatherSnapshot；
 * - Azure 的订阅密钥就写在下面的 weatherRaw 里。前端产物无论如何都藏不住它（VITE_* 时代同样
 *   会被打包成明文），所以这里不再假装它是秘密：请用 SAS Token，或在 Azure 门户把密钥
 *   限制到本站域名（见 src/config/README.md 的「天气」一节）。
 */
import { features } from "@/config/features";
import type { WeatherConfig, WeatherSourceId } from "@/types/config";

/** 要改天气，只动这里 */
const weatherRaw = {
  /** 数据源：aurora 免密钥开箱即用；azure 需要自己填订阅密钥 */
  source: "aurora",
  /**
   * 按访客 IP 自动判断城市（默认开）。定位在首屏之后单独发一次请求，只在「天气开着」时才发；
   * 定位失败或访客在国外（天气源只认中国城市）就退回下面的 city。不想暴露访客 IP 时关掉它。
   */
  autoLocate: true,
  /** 定位源的超时（毫秒）：一个源 5 秒，失败自动换下一个 */
  locateTimeoutMs: 5000,
  /**
   * 高德开放平台「Web服务」Key（注意不是 Web端 JS API）。留空就用内置的免费定位源
   * （mir6 → vore.top）；填了则高德排第一，定位更准也更稳，免费额度每日 5000 次。
   * 申请：https://console.amap.com/dev/key/app
   */
  geoKey: "",
  /** 兜底城市名（中文即可）。aurora 直接把它当查询词，接口返回的「郑州市」会覆盖展示名 */
  city: "郑州",
  /**
   * 同名城市的候选序号（从 1 开始）。这个接口是两步协议：先不带 b 访问一次会拿到候选
   * 清单，带上 b 才返回天气。b=1 即「第一个匹配」，绝大多数城市够用；要精确到区县时
   * 在浏览器里打开 `https://api.andeer.top/API/daygas.php?msg=郑州` 看清单再改这里。
   */
  cityIndex: 1,
  aurora: {
    /** AuroraAPI「天气查询」，免密钥、CORS 全开：https://api.andeer.top/api_details.php?id=19 */
    endpoint: "https://api.andeer.top/API/daygas.php",
  },
  azure: {
    /** 服务主机名：主权云可改成对应的 Azure Maps 终结点 */
    endpoint: "https://atlas.microsoft.com",
    apiVersion: "1.1",
    /** 订阅密钥；留空则只有 aurora 可用 */
    key: "",
    /** 观测点坐标：Azure 只按坐标查询，不回传城市名 */
    latitude: 34.7466,
    longitude: 113.6253,
    /** 返回语言（IETF 标记）：zh-Hans | en-US | ja-JP ... */
    language: "zh-Hans",
  },
} as const;

/** 所选数据源在当前配置下是否可用：Azure 必须有密钥，Aurora 开箱即用 */
const usable = (id: WeatherSourceId): boolean =>
  id !== "azure" || weatherRaw.azure.key.trim().length > 0;

export const weatherConfig: WeatherConfig = {
  ...weatherRaw,
  enabled: features.weather && usable(weatherRaw.source),
  timeoutMs: 8000,
  /** 自动刷新间隔：页面隐藏时不计时 */
  refreshMs: 30 * 60 * 1000,
};
