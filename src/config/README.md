# 配置层（src/config）

> 这里是全站**唯一**的配置入口：站点身份、第三方凭据、行为与外观都在这一层。
> 全仓库禁止 `import.meta.env`（`pnpm design:lint` 强制），配置不放在 `.env` —— 前端产物
> 藏不住任何东西，分成两层只会多出「密钥是安全的」这种错觉。

## 分层

| 文件 | 职责 | 用户是否需要改 |
| --- | --- | --- |
| `site.ts` | 站点名称/作者/关键词/简介/地址/语言/图标/建站日期/备案 | **是** |
| `profile.ts` | 头像与两套简介文案（默认 / 展开更多信息时） | **是** |
| `links/` | 社交链接与站点链接（JSON，可视化编辑即可） | **是** |
| `wallpaper.ts` | 壁纸图源、缓存策略、是否允许下载 | 是 |
| `weather.ts` | 天气数据源（免密钥的 aurora / 自备密钥的 azure）、查询城市与序号、超时与刷新间隔 | 视情况 |
| `music.ts` | Meting-API 地址模板与歌单参数、播放器默认偏好 | 视情况 |
| `theme.ts` | 动态配色默认值（色相 / 风格 / 规范 / 明暗） | 视情况 |
| `features.ts` | 功能开关，关闭即零负担 | 是 |
| `breakpoints.ts` | 响应式断点唯一来源 | 否 |
| `changelog.ts` | 「设置 → 更新日志」的内容 | 是 |

每个模块顶部都有一段「要改就动这里」的常量，改完不需要动别处。
命名遵循 `NAMING.md`：可编辑的配置对象一律 camelCase（`siteConfig` / `weatherConfig` / `features` / `breakpoints`），
只有「一改就要同步改代码」的字面量表才用 SCREAMING_SNAKE（`MC_STYLES` / `PERSISTED_KEYS` / `DEFAULT_THEME_PREFS` / `WALLPAPER_PLACEHOLDERS`）。

## 配置怎么被用

- **构建期**：`vite.config.ts` 直接 `import` `site.ts`，把标题 / 描述 / 关键词 / 图标 / 语言注入
  `index.html`（占位符是 `%SITE_*`），并填进 PWA manifest。所以改完站点信息要重新构建。
- **运行期**：组件只从各自的 config 模块取值，再由 `src/utils/documentHead.ts` 同步一次文档头。
- **类型**：结构定义在 `src/types/config.ts`，写错字段会在 `pnpm typecheck` 阶段失败。

## 零负担规则

`features.ts` 中的开关为 `false` 时必须满足：

1. 不产生任何网络请求；
2. 不输出任何 DOM（组件用 `v-if` 卸载，而不是 `v-show` 隐藏）；
3. 不进入主包（重量级实现用动态 `import()`，如播放器）。

关闭 `footer`（底栏）时，`FooterBar` 整体不挂载：不输出版权 / 备案 / 歌词行任何 DOM，设置面板里的
「底栏背景模糊」与「歌词显示在底栏」两行也会一起隐藏，子开关 `footerLyrics` 随之失效；
换到需要底栏的站点时把 `footer` 改回 `true` 即可整套恢复，无需改任何组件代码。

## 壁纸源

出厂配置一共五项，顺序即设置面板里的顺序，第一项是默认项（`defaultId`）：

| id | 名称 | 说明 |
| --- | --- | --- |
| `illustration` | 默认插画 | 自托管在 `public/images/wallpaper/`，提供 1280 / 2000 / 3000 / 4000 四档，用 `srcset` 让浏览器自己挑 |
| `local` | 本地图集 | `public/images/background1..N.jpg`（`localCount` 决定 N），每次随机一张 |
| `bing` | 每日一图 | `bing.biturl.top`，`format=image` 直接重定向到当天的 Bing 壁纸；1920 的 WebP 约 240 KB，4K 屏由 `srcset` 去拿 3840 的 JPG（**3840 没有 WebP**，请求它会 404 成 80×80 占位图） |
| `random` | 随机壁纸 | alcy 的 `t.alcy.cc/pc`，直接返回 WebP（约 400 KB） |
| `anime` | 随机二次元 | MirlKoi（[`cnmiw.com/api`](https://cnmiw.com/api/)）随机横屏，`sort=CDNpc` 走反代线路，单张 1.6–9.7 MB（官方不提供尺寸参数） |

远程图源有一条硬性约定：**只能使用「直接返回或重定向到图片」的接口**。用 `<img>` 加载跨域图片不受 CORS 限制，但一旦要 `fetch` 读 JSON（包括微软官方的 `HPImageArchive.aspx`、MirlKoi 的 `type=json`）就会被 CORS 拦下，届时就只能自备反向代理。MirlKoi 的 `sort` 前缀 `CDN` 表示走反代线路、无需 Referer，普通线路会因为缺少 `https://weibo.com/` 这个 Referer 而返回 403。

任何远程图源加载失败都会自动回落到 `defaultId` 指向的本地图源（见 `useWallpaper`），并在界面上给一条提示。

### 新增一个壁纸源

在 `wallpaper.ts` 的 `sources` 里追加一项即可，UI 会自动出现对应选项：

```ts
{
  id: "my-source",
  labelKey: "settings.wallpaper.mySource", // 需要同时在 src/i18n/locales/ 的 zh.ts 与 en.ts 加词条
  kind: "remote",
  resolve: ({ stamp }) => `https://example.com/random.jpg?t=${stamp}`,
  // 同一张图有多个分辨率时可以再给一个 srcset
  downloadable: true,
  cache: "request", // none | day | request
}
```

`localCount` 对应 `public/images/background1..N.jpg` 的数量。

### 默认插画怎么换

把新图按 `public/images/wallpaper/illustration-<宽度>.jpg` 命名放进去，并同步 `wallpaper.ts` 里的 `ILLUSTRATION_WIDTHS` 即可。四档都建议保留：手机拿 1280（约 180 KB），普通桌面拿 2000/3000，4K 屏才拿 4000。

## 天气（两个数据源）

数据源由 `weather.ts` 顶部的 `weatherRaw.source` 选择：默认 `aurora`（免密钥，开箱即用），也可以切到
`azure`（微软官方接口，字段最全但需要自己申请订阅密钥）。字段映射都写在 `src/api/weather.ts`，
组件只认归一化后的 `WeatherSnapshot`，换源不影响任何视图代码。

| 数据源 | 接口 | 密钥 | 提供的信息 |
| --- | --- | --- | --- |
| `aurora`（默认） | [AuroraAPI 天气查询](https://api.andeer.top/api_details.php?id=19) | 不需要 | 城市 / 现象 / 当日温度区间 / 风向风级 / 空气质量 |
| `azure` | [Get Current Conditions](https://learn.microsoft.com/rest/api/maps/weather/get-current-conditions) | 需要 | 现象 / 当前温度 / 风向风速 / 图标编码 |

`weatherRaw` 常量里的公共字段：

| 字段 | 说明 |
| --- | --- |
| `source` | `aurora` 或 `azure`；写别的值在 `pnpm typecheck` 阶段就会失败 |
| `autoLocate` | 是否按访客 IP 自动判断城市，默认 `true`；关掉后**不再向定位服务发任何请求** |
| `city` | **兜底**城市名：定位失败、访客在国外或 `autoLocate` 关闭时用它查询与展示 |
| `cityIndex` | 同名城市的候选序号，见下 |
| `locateTimeoutMs` | 定位源的单次超时（毫秒）：一个源失败自动换下一个 |
| `geoKey` | 高德开放平台**Web服务** Key（不是 Web端 JS API）；填了则高德优先，留空只用免费源 |
| `timeoutMs` / `refreshMs` | 天气请求超时与自动刷新间隔（页面隐藏时不计时） |

两个数据源各自的终结点在 `weatherRaw.aurora` / `weatherRaw.azure` 里。`azure.key` 留空即视为该源不可用，
此时只能选 `aurora`；数据源不可用或 `features.weather` 关闭时**完全不发请求**，连定时器都不起。

### 访客定位（autoLocate）

`autoLocate` 打开时，进页面会先向 IP 定位服务问一次「访客在哪个城市」，拿到城市名再查天气——
也就是说，页面显示的是**访客自己所在城市**的天气，而不是站长的。实现在 `src/api/visitorLocation.ts`：

| 顺序 | 源 | 条件 | 实测耗时（2026-09，同一出口 IP） | 返回 |
| --- | --- | --- | --- | --- |
| 1 | `restapi.amap.com/v3/ip`（高德） | 填了 `geoKey` 才启用 | 官方接口 | `province` / `city` / `adcode` |
| 2 | `api.mir6.com/api/ip` | 默认 | 0.5 – 1.6 s | `province` / `city` / `isp` |
| 3 | `api.vore.top/api/IPdata` | 默认 | 1.0 – 4.1 s，出现过一次 >15 s 无响应 | `info1`（省）/ `info2`（市） |

三家都返回中文名、都带 `Access-Control-Allow-Origin: *`（浏览器可直连）。只有「中国 IP + 市级名称」
才会被采用：天气数据源是中文服务，国外 IP 定位出来的州 / 市名它查不到，这种情况直接回落 `city`。
定位请求在**本次会话里只发一次**（模块级缓存，30 分钟的刷新不会重复定位）；定位失败不写缓存，
下个周期还会再试；某个源抽风（比如高德 key 无效返回 `10001`）会自动换下一个源，不会卡住。

高德的 key 是**可选加分项**：不填也能用，填了定位更准更稳（免费额度每日 5000 次，旧版用的就是它）。
注意申请的是「Web服务」类型，不是「Web端（JS API）」——后者不能用于这种服务端查询。

> **隐私**：定位请求会把访客 IP 交给第三方，介意就在 `weather.ts` 里设 `autoLocate: false`，
> 此时定位请求数为 0，城市固定为 `city`。整行都不想要就直接关 `features.weather`。

### aurora 是两步协议

这个接口按城市名查询，同名城市先返回一份候选清单：

```bash
# 第一步：看候选清单（返回的是纯文本，不是 JSON）
curl 'https://api.andeer.top/API/daygas.php?msg=郑州'
# 1：河南省-郑州市   2：河南省-登封市   3：河南省-新郑市   9：河南省-二七区  ...

# 第二步：带序号取天气（这才是 JSON）
curl 'https://api.andeer.top/API/daygas.php?msg=郑州&b=1'
```

`weather.ts` 里的 `cityIndex` 就是清单里的序号，`b=1` 即「取第一个匹配」，绝大多数城市够用；
要精确到区县（比如上例的 `9` 是二七区）时按上面的命令查一次再改。

两个坑在 `src/api/weather.ts` 里都处理掉了：

- 城市查不到时接口照样返回 **HTTP 200 + `success: true`**，只是所有字段为 `null`（温度固定是 `～℃`）——
  必须当成失败抛错，否则界面会显示一行空白；
- `data` 文档写的是数组、实测返回对象，两种都接住；字段名是中文（`城市` / `天气` / `温度` / `风度` / `空气质量`）。

`风度` 是「西北风-2级」这种合并字符串，由 `splitWind()` 拆成风向与风速；温度是**当日区间**（`18～29℃`）
而不是当前温度，这是它与 azure 最大的差别（组件不拼单位，只显示 api 层格式化好的字符串）。

### azure 的取舍

订阅密钥写在 `weatherRaw.azure.key`。前端产物藏不住它，请尽量在 Azure 门户把密钥限制到本站域名，或改用
SAS Token / Microsoft Entra ID。图标按返回的 `iconCode` 映射，未知编码才回退到文案判断；接口只用了 18 个
操作中的「当前天气」一个，响应里还有湿度 / 体感 / UV / 能见度等字段没有展示。

### 评估过但没接入的

- **只回显 IP 的地址**：`ddns.oray.com/checkip`（`Current IP Address: …`，`text/html`）、`ip.3322.net`
  （纯 IP，`text/plain`）都只给 IP 不给城市，而且响应**没有 CORS 头**，浏览器直连读不到；
  `ipw.cn` / `4.ipw.cn` / `6.ipw.cn` 在本机 DNS 与 AliDNS 上都查不到 A 记录。定位源必须自带
  「IP → 城市」的数据库，回显 IP 的接口帮不上忙。
- **文心一言「天气」插件**：必须先用 API Key / Secret Key 在**服务端**换 `access_token`，浏览器直连既会
  泄露 Secret，也会被 CORS 拦下，静态站点无法安全使用。
- **AuroraAPI「天气信息（微软）」**（[id=555](https://api.andeer.top/api_details.php?id=555)，
  `https://api.andeer.top/API/weather_ms.php?city=广州`）：字段最全（体感 / 湿度 / 能见度 / 气压 / 露点），
  但 2026-09 实测**所有城市都返回全 `null`**（上游密钥已失效），站点却仍把它标为「接口状态：正常」。
  不接入——留一个只会返回空值的数据源，等于给自己埋一行空白。

要再换源，只需要动 `src/api/weather.ts` 的 `LOADERS` 注册表加一项，并在 `types/config.ts` 的
`WeatherSourceId` 里登记（漏了会编译失败）。

## 音乐（Meting）

播放器用 Meting-API。地址是**模板**，由 `src/api/music.ts` 的 `buildMetingUrl()` 替换占位符：

| 占位符 | 含义 |
| --- | --- |
| `:server` | 平台：`netease` / `tencent` / `kugou` / `xiami` / `baidu` |
| `:type` | 资源类型：`playlist` / `song` / `album` / `artist` / `search` |
| `:id` | 歌单 / 单曲 / 专辑 / 歌手 ID；**留空则整个播放器不加载**（零请求、零 DOM、零主包体积） |
| `:auth` | 受保护部署的口令，公开实例留空 |
| `:r` | 时间戳，用来打破缓存 |

换实例只改模板，例如自建 Meting-API 通常写成
`https://your-domain/api?server=:server&type=:type&id=:id&auth=:auth`。

解析规则：记录必须「有名字 + 有播放地址」才保留，并按歌曲 id 去重（歌单里重复曲目很常见）；
时长同时兼容秒与毫秒（接口不返回时长就留空，列表不显示这一列）；封面取 `cover` 或 `pic`。部分自建实现（尤其网易云）会把 `url` 返回成
`@module@callback@callbackFn@url`，这时会再发一次 JSONP 取真实地址（见 `src/api/jsonp.ts`）。

**歌单只在有明确意图时才请求**：打开播放器、点播放，或用户在设置里显式开启「自动播放」。
首屏不会碰第三方接口，默认实例是 `api.injahow.cn/meting/`（实测返回 CORS `*`）。

## 链接图标

`links/*.json` 的 `icon` 字段是本地图标注册表的键：

- 默认在 simple-icons（品牌图标）中查找，例如 `github`、`bilibili`、`neteasecloudmusic`；
- 需要 Material Symbols 时加前缀，例如 `ui:mail`、`ui:article`；
- 想用图片，把地址写进 `img`；`icon` 只接受图标名，写成图片路径会直接报错。

可用图标清单见 `src/generated/icons.manifest.json`，新增图标后运行 `pnpm icons` 重新生成。
