export enum ToolCategory {
  VIDEO_AUDIO = 'Video & Audio',
  IMAGE = 'Image',
  PDF_DOCS = 'PDF & Documents',
  AI_TOOLS = 'AI & Code',
  GIF = 'GIF',
  UTILITIES = 'Utilities',
  DATA_TEXT = 'Text & Data',
  OTHERS = 'Others'
}

export interface ToolDefinition {
  id: string;
  label: string;
  description: string;
  category: ToolCategory;
  acceptedMimeTypes: string[];
  outputFormatOptions?: { label: string; value: string }[];
  handlerType: 'image' | 'audio' | 'video' | 'pdf' | 'unit' | 'gemini_text' | 'color_picker' | 'youtube_downloader' | 'vocal_separator' | 'code_morph' | 'qr_code' | 'url_shortener' | 'base_converter' | 'text_transformer' | 'image_filter' | 'background_remover';
}

export enum TransformMode {
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  PDF = 'PDF',
  UNIT = 'UNIT',
  CODE = 'CODE',
  TEXT = 'TEXT'
}

export enum ImageFormat {
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  WEBP = 'image/webp',
  GIF = 'image/gif',
  AVIF = 'image/avif',
  HEIC = 'image/heic',
  BMP = 'image/bmp',
  TIFF = 'image/tiff',
  EPS = 'application/postscript',
  RAW = 'application/octet-stream',
  SVG = 'image/svg+xml'
}

export enum AudioFormat {
  WAV = 'audio/wav',
  MP3 = 'audio/mpeg',
  FLAC = 'audio/flac',
  AAC = 'audio/aac',
  OGG = 'audio/ogg',
  WMA = 'audio/x-ms-wma',
  M4A = 'audio/mp4',
  ALAC = 'audio/alac',
  DSD = 'audio/dsd',
  PCM = 'audio/pcm',
  APC = 'audio/apc',
  CDA = 'application/x-cdf',
  THREE_GA = 'audio/3ga',
  AU = 'audio/basic',
  MQA = 'audio/mqa',
  OPUS = 'audio/opus',
  RAW = 'application/octet-stream'
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  error: string | null;
  result: string | null;
  resultType: string;
}

export interface FileData {
  file: File;
  preview: string;
  type: string;
}

export interface UnitConversionState {
  category: 'length' | 'weight' | 'temperature' | 'time' | 'digital';
  fromUnit: string;
  toUnit: string;
  value: number;
  result: number;
}
