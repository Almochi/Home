/**
 * 个人资料与简介文案：属于「个人内容」而不是界面词条，所以不放进 i18n。
 * 两套文案：默认显示 primary，右侧面板展开时换成 alternate。
 */
import { siteConfig } from "@/config/site";
import type { ProfileConfig } from "@/types/config";

const greetingRaw = {
  primary: {
    title: "Hello World !",
    text: "一个建立于 21 世纪的小站，存活于互联网的边缘",
  },
  alternate: {
    title: "Oops !",
    text: "哎呀，这都被你发现了（ 再点击一次可关闭 ）",
  },
} as const;

export const profileConfig: ProfileConfig = {
  avatar: siteConfig.logo.avatar,
  greeting: greetingRaw,
};
