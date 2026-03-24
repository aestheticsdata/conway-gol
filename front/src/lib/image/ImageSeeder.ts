import { GRID_COLS, GRID_ROWS } from "@grid/constants";

const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ACCEPTED_TYPES: ReadonlyArray<{ mime: string; ext: string }> = [
  { mime: "image/jpeg", ext: "JPG" },
  { mime: "image/png", ext: "PNG" },
  { mime: "image/webp", ext: "WebP" },
  { mime: "image/gif", ext: "GIF" },
  { mime: "image/bmp", ext: "BMP" },
  { mime: "image/avif", ext: "AVIF" },
];

export const ACCEPTED_MIME_TYPES = ACCEPTED_TYPES.map((t) => t.mime);
export const ACCEPTED_EXTENSIONS = ACCEPTED_TYPES.map((t) => t.ext);

export class ImageSeedError extends Error {}

/**
 * Detect the actual image format by inspecting the file's magic bytes.
 * Returns the matching MIME type, or null if the signature is not recognised.
 *
 * Magic signatures checked (first 16 bytes are sufficient):
 *   JPEG  : FF D8 FF
 *   PNG   : 89 50 4E 47 0D 0A 1A 0A
 *   GIF   : 47 49 46 38 (37|39) 61          GIF87a / GIF89a
 *   WebP  : 52 49 46 46 ?? ?? ?? ?? 57 45 42 50   RIFF....WEBP
 *   BMP   : 42 4D
 *   AVIF  : ?? ?? ?? ?? 66 74 79 70 61 76 69 (66|73)   ????ftyp avif|avis
 */
export function detectImageMime(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";

  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";

  if (
    bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61
  ) return "image/gif";

  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";

  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "image/bmp";

  if (
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70 &&
    bytes[8] === 0x61 && bytes[9] === 0x76 && bytes[10] === 0x69 &&
    (bytes[11] === 0x66 || bytes[11] === 0x73)
  ) return "image/avif";

  return null;
}

/**
 * Convert raw RGBA pixel data to a normalised grayscale float array.
 *
 * Steps:
 *  1. Weighted luminance per pixel (ITU-R BT.601).
 *  2. Transparent pixels → white (255) so they become DEAD cells.
 *  3. Histogram stretching: maps [min, max] → [0, 255] so the full contrast
 *     range of the image is always used regardless of original exposure.
 */
export function pixelsToNormalisedGrayscale(
  data: Uint8ClampedArray,
  cols: number,
  rows: number,
): Float32Array {
  const n = cols * rows;
  const gray = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const p = i * 4;
    gray[i] =
      data[p + 3] < 128
        ? 255
        : 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }

  let min = 255;
  let max = 0;
  for (let i = 0; i < n; i++) {
    if (gray[i] < min) min = gray[i];
    if (gray[i] > max) max = gray[i];
  }
  const range = max - min;
  if (range > 0) {
    for (let i = 0; i < n; i++) {
      gray[i] = ((gray[i] - min) / range) * 255;
    }
  }

  return gray;
}

/**
 * Floyd-Steinberg dithering: converts a normalised grayscale buffer to a
 * binary (0/1) grid.
 *
 * The algorithm quantises each pixel to black (0) or white (255) and
 * distributes the rounding error to 4 neighbouring pixels:
 *
 *           [curr]  7/16
 *   3/16    5/16    1/16
 *
 * This preserves the perceived brightness distribution and makes shapes
 * visually recognisable even at 5 px/cell resolution.
 *
 * @param gray      Normalised grayscale buffer [0..255] — never mutated.
 * @param threshold Pixels darker than this become ALIVE (1). Range 0-255.
 */
export function floydSteinberg(
  gray: Float32Array,
  cols: number,
  rows: number,
  threshold = 128,
): number[][] {
  const buf = gray.slice();
  const grid: number[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowData: number[] = [];
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      const old = Math.max(0, Math.min(255, buf[i]));
      const quantised = old < threshold ? 0 : 255;
      rowData.push(quantised === 0 ? 1 : 0);
      const err = old - quantised;

      if (col + 1 < cols) buf[i + 1] += (err * 7) / 16;
      if (row + 1 < rows) {
        if (col > 0) buf[i + cols - 1] += (err * 3) / 16;
        buf[i + cols] += (err * 5) / 16;
        if (col + 1 < cols) buf[i + cols + 1] += (err * 1) / 16;
      }
    }
    grid.push(rowData);
  }

  return grid;
}

/**
 * Load an image file, fit it into the grid while preserving aspect ratio
 * (contain / letterbox), validate its format via magic bytes, and return
 * both the binary grid and the intermediate grayscale buffer.
 *
 * The grayscale buffer is returned so the caller can cheaply re-apply a
 * different threshold (e.g. from a UI slider) without reloading the image.
 */
export async function seedFromImage(
  file: File,
  cols: number = GRID_COLS,
  rows: number = GRID_ROWS,
  threshold = 128,
): Promise<{ grid: number[][]; grayscale: Float32Array }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageSeedError(`File too large (max ${MAX_FILE_SIZE_MB}MB)`);
  }

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detectedMime = detectImageMime(header);
  if (!detectedMime || !ACCEPTED_MIME_TYPES.includes(detectedMime)) {
    throw new ImageSeedError(`Unsupported format. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ImageSeedError("Unsupported or corrupt image file");
  }

  const canvas = new OffscreenCanvas(cols, rows);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new ImageSeedError("Could not create offscreen canvas context");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cols, rows);

  const scale = Math.min(cols / bitmap.width, rows / bitmap.height);
  const drawW = Math.round(bitmap.width * scale);
  const drawH = Math.round(bitmap.height * scale);
  const offsetX = Math.round((cols - drawW) / 2);
  const offsetY = Math.round((rows - drawH) / 2);

  ctx.drawImage(bitmap, offsetX, offsetY, drawW, drawH);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, cols, rows);
  const grayscale = pixelsToNormalisedGrayscale(data, cols, rows);
  const grid = floydSteinberg(grayscale, cols, rows, threshold);

  return { grid, grayscale };
}
