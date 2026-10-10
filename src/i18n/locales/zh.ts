/**
 * 简体中文词条 —— 这里是词条的「单一真源」：
 * I18nKey 由本文件推导，其他语言包用 Record<I18nKey, string> 约束，缺词条会直接编译报错。
 */
export const zh = {
  /* 应用级 */
  "app.loading": "加载中",
  "app.action.settings": "设置",
  "app.action.close": "关闭",
  "app.action.refresh": "换一句",
  "app.action.download": "下载壁纸",
  "app.action.showcase": "壁纸展示",
  "app.action.showcase.exit": "退出展示",
  "app.showcase.enter": "已进入壁纸展示，按 Esc 退出",
  "app.showcase.exit": "已退出壁纸展示",

  /* 区块 */
  "panel.links": "网站列表",
  "panel.info": "更多",
  "panel.social": "社交链接",

  /* 时钟与天气 */
  "clock.aria": "当前时间 {time}",
  "weather.title": "天气",
  "weather.loading": "天气获取中",
  "weather.failed": "天气数据获取失败",
  "weather.wind.suffix": "风",
  "weather.air": "空气{level}",

  /* 一言 */
  "hitokoto.placeholder": "这里应该显示一句话",
  "hitokoto.from": "無名",
  "hitokoto.failed": "一言获取失败",
  "hitokoto.player.open": "打开音乐播放器",

  /* 音乐 */
  "music.title": "音乐",
  "music.playlist": "播放列表",
  "music.hitokoto.back": "回到一言",
  "music.prev": "上一首",
  "music.next": "下一首",
  "music.play": "播放",
  "music.pause": "暂停",
  "music.volume": "音量",
  "music.idle": "未播放音乐",
  "music.loading": "歌单加载中",
  "music.load.failed": "播放器加载失败",
  "music.play.failed": "播放歌曲出现错误",
  "music.play.failed.next": "播放出现错误，正在切到下一首",
  "music.lyric.loading": "歌词加载中",
  "music.lyric.unavailable": "暂无歌词",
  "music.empty": "歌单为空",
  "music.autoplay.blocked": "浏览器已阻止自动播放，点击播放按钮开始",
  "music.loop.all": "列表循环",
  "music.loop.one": "单曲循环",
  "music.loop.none": "不循环",

  /* 时光胶囊 */
  "capsule.title": "时光胶囊",
  "capsule.day": "今日",
  "capsule.week": "本周",
  "capsule.month": "本月",
  "capsule.year": "本年",
  "capsule.hours": "小时",
  "capsule.days": "天",
  "capsule.remaining": "剩余 {value} {unit}",
  "capsule.site.start": "本站已经苟活了 {years} 年 {months} 月 {days} 天",

  /* 页脚 */
  "footer.credit": "Made by",

  /* 链接 */
  "links.new.tab": "{name}（新标签页打开）",
  "social.open": "打开 {name}",

  /* 设置 */
  "settings.title": "全局设置",
  "settings.repository": "Github 源代码仓库",
  "settings.changelog": "更新日志",
  "settings.changelog.added": "新增",
  "settings.changelog.fixed": "修复",
  "settings.tab.wallpaper": "个性壁纸",
  "settings.tab.appearance": "外观与配色",
  "settings.tab.player": "播放器",
  "settings.tab.other": "其他设置",
  "settings.wallpaper.label": "壁纸来源",
  "settings.wallpaper.illustration": "默认插画",
  "settings.wallpaper.local": "本地图集",
  "settings.wallpaper.bing": "每日一图",
  "settings.wallpaper.random": "随机壁纸",
  "settings.wallpaper.anime": "随机动漫",
  "settings.wallpaper.changed": "壁纸已更换",
  "settings.wallpaper.failed": "壁纸加载失败，已回落到默认壁纸",
  "settings.appearance.hue": "种子色相",
  "settings.appearance.hue.custom": "自定义色相",
  "settings.appearance.hue.wallpaper": "跟随壁纸（{hue}°）",
  "settings.appearance.style": "调色板风格",
  "settings.appearance.spec": "Material 版本",
  "settings.appearance.mode": "明暗模式",
  "settings.appearance.mode.auto": "跟随系统",
  "settings.appearance.mode.light": "浅色",
  "settings.appearance.mode.dark": "深色",
  "settings.appearance.motion": "动效",
  "settings.appearance.motion.system": "跟随系统",
  "settings.appearance.motion.reduced": "减少动效",
  "settings.appearance.motion.full": "完整动效",
  "settings.appearance.hue.follow": "跟随壁纸取色",
  "settings.appearance.reset": "恢复默认",
  "settings.appearance.preview": "配色预览",
  "settings.style.tonal.spot": "柔和",
  "settings.style.vibrant": "鲜艳",
  "settings.style.content": "内容",
  "settings.style.expressive": "表现力",
  "settings.style.rainbow": "彩虹",
  "settings.style.fruit.salad": "果缤纷",
  "settings.style.monochrome": "单色",
  "settings.style.neutral": "中性",
  "settings.style.fidelity": "真实",
  "settings.player.autoplay": "自动播放",
  "settings.player.shuffle": "随机播放",
  "settings.player.loop": "循环模式",
  "settings.player.lyric": "底栏歌词显示",
  "settings.player.volume": "默认音量",
  "settings.other.site.start": "建站日期显示",
  "settings.other.footer.backdrop": "底栏背景模糊",
  "settings.other.link.backdrop": "悬停卡片时虚化背景",
  "settings.other.language": "界面语言",

  /* 提示条 */
  "snackbar.close": "关闭",
  "snackbar.update.ready": "站点已更新，刷新后生效",
  "snackbar.refresh": "刷新",

  /* 无障碍 */
  "a11y.theme.toggle": "切换明暗模式，当前：{mode}",
  "a11y.settings.open": "打开设置",
  "a11y.info.open": "打开更多信息",
  "a11y.capsule.progress": "{name}已过 {percent}%",
  "a11y.content.skip": "跳到主要内容",
  "a11y.greeting.expand": "展开简介与更多信息",
  "a11y.greeting.collapse": "收起简介与更多信息",
} as const;

export type I18nKey = keyof typeof zh;
