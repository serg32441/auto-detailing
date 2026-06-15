/**
 * Client-side image pre-filter for the BTI comparison module.
 *
 * Runs entirely in the browser via <canvas>, so the trivial "two images are the
 * same file" case is detected for free and never reaches the paid AI endpoint.
 *
 * Two cheap signals are combined:
 *   - dHash (difference hash): robust 64-bit perceptual fingerprint.
 *   - downscaled pixel similarity: catches near-identical scans.
 */

const HASH_W = 9;
const HASH_H = 8;
const SIM_SIZE = 32;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
    img.src = src;
  });
}

function grayscalePixels(
  img: HTMLImageElement,
  w: number,
  h: number,
): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  // White background so transparent PNG plans don't read as black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return gray;
}

/** 64-bit difference hash as a BigInt. */
function dHash(img: HTMLImageElement): bigint {
  const gray = grayscalePixels(img, HASH_W, HASH_H);
  let hash = 0n;
  let bit = 0n;
  for (let y = 0; y < HASH_H; y++) {
    for (let x = 0; x < HASH_W - 1; x++) {
      const left = gray[y * HASH_W + x];
      const right = gray[y * HASH_W + x + 1];
      if (left > right) hash |= 1n << bit;
      bit++;
    }
  }
  return hash;
}

function hammingDistance(a: bigint, b: bigint): number {
  let xor = a ^ b;
  let count = 0;
  while (xor > 0n) {
    count += Number(xor & 1n);
    xor >>= 1n;
  }
  return count;
}

/** Mean-absolute-difference similarity (0..100) on a downscaled grayscale. */
function pixelSimilarity(a: HTMLImageElement, b: HTMLImageElement): number {
  const ga = grayscalePixels(a, SIM_SIZE, SIM_SIZE);
  const gb = grayscalePixels(b, SIM_SIZE, SIM_SIZE);
  let sum = 0;
  for (let i = 0; i < ga.length; i++) sum += Math.abs(ga[i] - gb[i]);
  const mad = sum / ga.length;
  return Math.max(0, Math.round((1 - mad / 255) * 100));
}

export interface PrefilterResult {
  /** True when the images are confidently the same picture. */
  identical: boolean;
  /** Hamming distance between the two perceptual hashes (0 = identical). */
  hammingDistance: number;
  /** Pixel similarity 0..100. */
  similarity: number;
}

/**
 * Compare two images locally. `identical` is intentionally conservative: it only
 * fires for visually-identical inputs so we never hide a real layout difference.
 */
export async function prefilterImages(
  srcA: string,
  srcB: string,
): Promise<PrefilterResult> {
  const [imgA, imgB] = await Promise.all([loadImage(srcA), loadImage(srcB)]);
  const distance = hammingDistance(dHash(imgA), dHash(imgB));
  const similarity = pixelSimilarity(imgA, imgB);
  return {
    identical: distance <= 2 && similarity >= 97,
    hammingDistance: distance,
    similarity,
  };
}
