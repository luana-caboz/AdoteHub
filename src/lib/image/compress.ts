
export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

export const PHOTO_MAX_SIDE = 1600;
export const THUMB_MAX_SIDE = 480;
export const LOGO_MAX_SIDE = 512;
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;

async function loadBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

function draw(bitmap: ImageBitmap, maxSide: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao comprimir imagem"))), type, quality),
  );
}

export async function compressPhoto(file: File): Promise<{ main: CompressedImage; thumb: CompressedImage }> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name}: não é uma imagem`);
  if (file.size > MAX_INPUT_BYTES) throw new Error(`${file.name}: arquivo muito grande (máx. 25 MB)`);
  let bitmap: ImageBitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    throw new Error(`${file.name}: formato não suportado. Envie JPG ou PNG.`);
  }
  try {
    const mainCanvas = draw(bitmap, PHOTO_MAX_SIDE);
    const thumbCanvas = draw(bitmap, THUMB_MAX_SIDE);
    const [main, thumb] = await Promise.all([
      toBlob(mainCanvas, "image/jpeg", 0.82),
      toBlob(thumbCanvas, "image/jpeg", 0.78),
    ]);
    return {
      main: { blob: main, width: mainCanvas.width, height: mainCanvas.height },
      thumb: { blob: thumb, width: thumbCanvas.width, height: thumbCanvas.height },
    };
  } finally {
    bitmap.close();
  }
}

export async function compressLogo(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) throw new Error("Envie uma imagem");
  const bitmap = await loadBitmap(file);
  try {
    const canvas = draw(bitmap, LOGO_MAX_SIDE);
    return { blob: await toBlob(canvas, "image/png"), width: canvas.width, height: canvas.height };
  } finally {
    bitmap.close();
  }
}
