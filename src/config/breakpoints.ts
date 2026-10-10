/**
 * 响应式断点：唯一来源。
 *
 * CSS 变量不能用于 @media，因此组件里允许写具体像素值，但只能取这里声明过的值，
 * scripts/check-design.mjs 会读取本文件并校验组件中的 @media 像素值。
 * 这里刻意不提供运行时助手：需要 matchMedia 的地方直接写查询串，
 * 避免出现「第二份断点定义」。
 */
export const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
