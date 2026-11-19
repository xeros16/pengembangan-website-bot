export function parseCropRatio(value = '') {
  const match = String(value).trim().match(/^(\d{1,4})\s*:\s*(\d{1,4})$/);
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!width || !height || width > 1000 || height > 1000) return null;
  return { width, height, ratio: width / height };
}

export function normalizeImageFormat(value = '') {
  const format = String(value).trim().toLowerCase().replace(/^\./, '');
  if (format === 'jpg') return 'jpeg';
  return ['jpeg', 'png', 'webp'].includes(format) ? format : null;
}

export function imageFormatLabel(format) {
  return format === 'jpeg' ? 'JPG' : String(format || '').toUpperCase();
}

export function getCenterCropRect(sourceWidth, sourceHeight, targetRatio) {
  const width = Number(sourceWidth);
  const height = Number(sourceHeight);
  const ratio = Number(targetRatio);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || !Number.isFinite(ratio) || ratio <= 0) return null;
  let cropWidth = width;
  let cropHeight = height;
  if (width / height > ratio) cropWidth = Math.max(1, Math.floor(height * ratio));
  else cropHeight = Math.max(1, Math.floor(width / ratio));
  return {
    left: Math.floor((width - cropWidth) / 2),
    top: Math.floor((height - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  };
}
