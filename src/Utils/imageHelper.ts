export const getAssetPath = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = import.meta.env.BASE_URL || '/';
  if (baseUrl !== '/' && path.startsWith(baseUrl)) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Reads an image file, shrinks it to maxDim px and re-encodes it as a small
 * data-URL before upload, so product images never bloat the database.
 * Falls back to the original file content if anything goes wrong.
 */
export const compressImageFile = (file: File, maxDim = 700, quality = 0.75): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const original = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(original);
          // white background so transparent PNGs don't turn black
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', quality));
        } catch {
          resolve(original);
        }
      };
      img.onerror = () => resolve(original);
      img.src = original;
    };
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
