import sharp from 'sharp';

const MAX_DIM = 700;          // longest edge in px (plenty for cards + detail page)
const QUALITY = 75;           // WebP quality
const COMPRESS_THRESHOLD = 150 * 1024; // only touch data-URLs over ~150KB

/**
 * Accepts a base64 data-URL image, shrinks it to MAX_DIM px WebP,
 * and returns a much smaller data-URL.
 * Returns null if input is not a base64 image data-URL.
 * Returns the input unchanged if it is already small enough.
 * Throws if the image cannot be decoded.
 */
export async function compressBase64Image(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const m = /^data:image\/[a-z0-9.+-]+;base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!m) return null; // not a base64 image (regular URL/path) — leave it alone
  if (m[1].length <= COMPRESS_THRESHOLD) return dataUrl; // already small

  const input = Buffer.from(m[1], 'base64');
  const out = await sharp(input, { animated: false, failOn: 'none' })
    .rotate() // respect EXIF rotation from phone cameras
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 4 })
    .toBuffer();

  return `data:image/webp;base64,${out.toString('base64')}`;
}

/**
 * Small thumbnail (~320px WebP) used by list endpoints so the catalog
 * loads fast. Static path images (e.g. /images/x.png) are returned as-is.
 */
export async function makeThumb(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl || '';
  const m = /^data:image\/[a-z0-9.+-]+;base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!m) return dataUrl;
  try {
    const input = Buffer.from(m[1], 'base64');
    const out = await sharp(input, { animated: false, failOn: 'none' })
      .rotate()
      .resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 62, effort: 4 })
      .toBuffer();
    return `data:image/webp;base64,${out.toString('base64')}`;
  } catch (e) {
    console.error('makeThumb failed:', e.message);
    return dataUrl;
  }
}
