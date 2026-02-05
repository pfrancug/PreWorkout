const AVATAR_SIZE = 256;
const AVATAR_QUALITY = 0.8;

/**
 * Crops an image file to a centered square, resizes to 256×256,
 * and returns it as a base64 data URL (JPEG).
 */
export const cropToSquareDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const size = Math.min(img.width, img.height);
      const offsetX = (img.width - size) / 2;
      const offsetY = (img.height - size) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));

        return;
      }

      ctx.drawImage(
        img,
        offsetX,
        offsetY,
        size,
        size,
        0,
        0,
        AVATAR_SIZE,
        AVATAR_SIZE,
      );

      resolve(canvas.toDataURL('image/jpeg', AVATAR_QUALITY));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
