import { ImageFormat, AudioFormat } from '../types';

/**
 * Converts a base64 string to an HTMLImageElement
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image'));
    img.src = src;
  });
};

/**
 * Reads a File object and returns a base64 string
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Custom Encoders ---

const encodeRAW = (imageData: ImageData): Blob => {
  const { width, height, data } = imageData;
  const rawBuffer = new Uint8Array(width * height * 3);
  let ptr = 0;
  for (let i = 0; i < data.length; i += 4) {
    rawBuffer[ptr++] = data[i];     // R
    rawBuffer[ptr++] = data[i + 1]; // G
    rawBuffer[ptr++] = data[i + 2]; // B
  }
  return new Blob([rawBuffer], { type: 'application/octet-stream' });
};

const encodeBMP = (imageData: ImageData): Blob => {
  const { width, height, data } = imageData;
  const padding = (4 - (width * 3) % 4) % 4;
  const fileSize = 54 + (width * 3 + padding) * height;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  
  view.setUint8(0, 0x42); view.setUint8(1, 0x4D); 
  view.setUint32(2, fileSize, true); view.setUint32(6, 0, true); view.setUint32(10, 54, true); 
  view.setUint32(14, 40, true); view.setInt32(18, width, true); view.setInt32(22, -height, true); 
  view.setUint16(26, 1, true); view.setUint16(28, 24, true); view.setUint32(30, 0, true); 
  view.setUint32(34, 0, true); view.setInt32(38, 2835, true); view.setInt32(42, 2835, true); 
  view.setUint32(46, 0, true); view.setUint32(50, 0, true); 
  
  let offset = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      view.setUint8(offset++, data[i + 2]); view.setUint8(offset++, data[i + 1]); view.setUint8(offset++, data[i]);     
    }
    for (let p = 0; p < padding; p++) { view.setUint8(offset++, 0); }
  }
  return new Blob([buffer], { type: 'image/bmp' });
};

const encodeTIFF = (imageData: ImageData): Blob => {
  // Simplified TIFF encoder
  const { width, height, data } = imageData;
  const pixelDataSize = width * height * 3;
  const offsetToIFD = 8 + pixelDataSize;
  const totalSize = offsetToIFD + 200; // rough estimate
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  
  view.setUint16(0, 0x4949, true); view.setUint16(2, 0x002A, true); view.setUint32(4, offsetToIFD, true); 
  let ptr = 8;
  for (let i = 0; i < data.length; i += 4) {
    view.setUint8(ptr++, data[i]); view.setUint8(ptr++, data[i + 1]); view.setUint8(ptr++, data[i + 2]); 
  }
  return new Blob([buffer], { type: 'image/tiff' });
};

const encodeEPS = (imageData: ImageData): Blob => {
  const { width, height, data } = imageData;
  let eps = `%!PS-Adobe-3.0 EPSF-3.0\n%%BoundingBox: 0 0 ${width} ${height}\n%%Pages: 1\n%%Title: Exported Image\n%%EndComments\n/readstring {\n  currentfile exch readhexstring pop\n} bind def\n/picstr ${width * 3} string def\n${width} ${height} 8\n[${width} 0 0 -${height} 0 ${height}]\n{ picstr readstring }\nfalse 3\ncolorimage\n`;
  let hex = "";
  const hexMap = "0123456789ABCDEF";
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
    hex += hexMap[r >> 4] + hexMap[r & 15] + hexMap[g >> 4] + hexMap[g & 15] + hexMap[b >> 4] + hexMap[b & 15];
    if (i % 80 === 0) hex += "\n";
  }
  eps += hex + `\n%%EOF`;
  return new Blob([eps], { type: 'application/postscript' });
};

export const applyImageFilter = async (
  sourceUrl: string,
  filterStyle: string
): Promise<string> => {
  const img = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Apply Filter
  ctx.filter = filterStyle;
  ctx.drawImage(img, 0, 0);

  return canvas.toDataURL('image/png');
};

/**
 * Removes background color based on tolerance
 */
export const removeBackground = async (
  sourceUrl: string,
  color: { r: number, g: number, b: number },
  tolerance: number
): Promise<string> => {
  const img = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate Euclidean distance threshold (max distance is ~441)
  const thresholdDist = (tolerance / 100) * 441;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const dist = Math.sqrt(
      Math.pow(r - color.r, 2) +
      Math.pow(g - color.g, 2) +
      Math.pow(b - color.b, 2)
    );

    if (dist < thresholdDist) {
      data[i + 3] = 0; // Set Alpha to 0 (Transparent)
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
};

export const convertRasterToRaster = async (
  sourceUrl: string,
  targetFormat: ImageFormat,
  quality: number = 0.92
): Promise<string> => {
  const img = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  if (targetFormat === ImageFormat.JPEG || targetFormat === ImageFormat.BMP) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  if ([ImageFormat.BMP, ImageFormat.TIFF, ImageFormat.EPS, ImageFormat.RAW].includes(targetFormat)) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let blob: Blob;
    switch (targetFormat) {
      case ImageFormat.BMP: blob = encodeBMP(imageData); break;
      case ImageFormat.TIFF: blob = encodeTIFF(imageData); break;
      case ImageFormat.EPS: blob = encodeEPS(imageData); break;
      case ImageFormat.RAW: blob = encodeRAW(imageData); break;
      default: blob = new Blob([]);
    }
    return URL.createObjectURL(blob);
  }
  return canvas.toDataURL(targetFormat, quality);
};

export const getPixelColor = async (imageUrl: string, x: number, y: number): Promise<{r:number, g:number, b:number, hex:string}> => {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return {r:0, g:0, b:0, hex:'#000000'};
  ctx.drawImage(img, 0, 0);
  const p = ctx.getImageData(x, y, 1, 1).data;
  const hex = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6).toUpperCase();
  return { r: p[0], g: p[1], b: p[2], hex };
};

export const downloadResult = (dataUrl: string, originalName: string, targetFormat: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  
  // Clean original name
  const namePart = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  
  // Determine extension
  let ext = 'bin';

  // Images
  if (targetFormat === ImageFormat.PNG) ext = 'png';
  else if (targetFormat === ImageFormat.JPEG) ext = 'jpg';
  else if (targetFormat === ImageFormat.WEBP) ext = 'webp';
  else if (targetFormat === ImageFormat.SVG) ext = 'svg';
  else if (targetFormat === ImageFormat.GIF) ext = 'gif';
  else if (targetFormat === ImageFormat.BMP) ext = 'bmp';
  else if (targetFormat === ImageFormat.TIFF) ext = 'tiff';
  else if (targetFormat === ImageFormat.EPS) ext = 'eps';
  else if (targetFormat === ImageFormat.RAW) ext = 'bin';
  else if (targetFormat === ImageFormat.AVIF) ext = 'avif';
  else if (targetFormat === ImageFormat.HEIC) ext = 'heic';
  
  // Audio
  else if (targetFormat === AudioFormat.MP3 || targetFormat === 'audio/mpeg') ext = 'mp3';
  else if (targetFormat === AudioFormat.WAV || targetFormat === 'audio/wav') ext = 'wav';
  else if (targetFormat === AudioFormat.OGG || targetFormat === 'audio/ogg') ext = 'ogg';
  else if (targetFormat === AudioFormat.FLAC || targetFormat === 'audio/flac') ext = 'flac';
  else if (targetFormat === AudioFormat.AAC || targetFormat === 'audio/aac') ext = 'aac';
  else if (targetFormat === AudioFormat.M4A || targetFormat === 'audio/mp4') ext = 'm4a';
  
  // Video
  else if (targetFormat === 'video/mp4') ext = 'mp4';
  else if (targetFormat === 'video/webm') ext = 'webm';
  else if (targetFormat === 'video/ogg') ext = 'ogv';
  
  // Docs
  else if (targetFormat === 'application/pdf') ext = 'pdf';
  else if (targetFormat === 'text/plain') ext = 'txt';
  else if (targetFormat === 'text/csv') ext = 'csv';
  else if (targetFormat === 'application/json') ext = 'json';
  else if (targetFormat.includes('word')) ext = 'docx';

  link.download = `${namePart}_converted.${ext}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
