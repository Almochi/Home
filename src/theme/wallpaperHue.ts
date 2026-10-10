/**
 * 从壁纸中提取种子色相
 *
 * 目的：让动态配色真正「跟随壁纸」，而不是只跟随一个固定色相。
 * 约束：任何失败（跨域画布污染、解码失败、色彩过于单调）都必须静默回落到配置色相，
 * 因此调用方拿到的是 number | null，而不是异常。
 *
 * 做法：缩到 24×24 后逐像素转 HCT，按「感知色度 × 明度接近 50」加权做 15° 一份的色相直方图，
 * 取峰值所在的桶再做圆周平均，得到稳定的主色相。
 */
import { Hct } from "@material/material-color-utilities";
import { normalizeHue } from "@/theme/colorScheme";

const SAMPLE_SIZE = 24;
const BIN_COUNT = 24; // 15° 一桶
const MIN_WEIGHT = 0.02; // 色度过低（近灰）的像素不参与统计

const cache = new Map<string, number | null>();

function circularMean(hues: number[], weights: number[]): number {
  let x = 0;
  let y = 0;
  for (let i = 0; i < hues.length; i += 1) {
    const radians = (hues[i] * Math.PI) / 180;
    x += Math.cos(radians) * weights[i];
    y += Math.sin(radians) * weights[i];
  }
  const mean = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round(normalizeHue(mean));
}

/** 读取图片的主色相；失败返回 null */
export async function extractWallpaperHue(url: string): Promise<number | null> {
  if (cache.has(url)) return cache.get(url) ?? null;
  const result = await sample(url);
  cache.set(url, result);
  return result;
}

async function sample(url: string): Promise<number | null> {
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    const bins = new Array<number>(BIN_COUNT).fill(0);
    const hues: number[] = [];
    const weights: number[] = [];

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const hct = Hct.from(data[i], data[i + 1], data[i + 2]);
      // 色度低（灰）或明度极端的像素对「主色」贡献很小
      const toneWeight = 1 - Math.min(1, Math.abs(hct.tone - 50) / 50);
      const weight = (hct.chroma / 100) * (0.4 + 0.6 * toneWeight);
      if (weight < MIN_WEIGHT) continue;
      hues.push(hct.hue);
      weights.push(weight);
      bins[Math.min(BIN_COUNT - 1, Math.floor((hct.hue / 360) * BIN_COUNT))] += weight;
    }

    if (hues.length < 8) return null;

    const peak = bins.indexOf(Math.max(...bins));
    const selectedHues: number[] = [];
    const selectedWeights: number[] = [];
    for (let i = 0; i < hues.length; i += 1) {
      const bin = Math.min(BIN_COUNT - 1, Math.floor((hues[i] / 360) * BIN_COUNT));
      // 峰值桶及其相邻桶共同决定最终色相，避免 15° 边界跳动
      if (
        bin === peak ||
        bin === (peak + 1) % BIN_COUNT ||
        bin === (peak - 1 + BIN_COUNT) % BIN_COUNT
      ) {
        selectedHues.push(hues[i]);
        selectedWeights.push(weights[i]);
      }
    }

    return circularMean(selectedHues, selectedWeights);
  } catch {
    // 跨域图片会污染画布：这里刻意静默，交给调用方回落
    return null;
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const isCrossOrigin = /^https?:\/\//.test(url) && !url.startsWith(window.location.origin);
    if (isCrossOrigin) image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`壁纸解码失败：${url}`));
    image.src = url;
  });
}
