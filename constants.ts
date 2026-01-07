import { ToolDefinition, ToolCategory, ImageFormat, AudioFormat } from './types';

export const SUPPORTED_IMAGE_INPUTS = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/avif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'
];

export const SUPPORTED_AUDIO_INPUTS = [
  'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/x-m4a', 'audio/webm'
];

export const SUPPORTED_VIDEO_INPUTS = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'
];

export const PDF_INPUTS = ['application/pdf'];

// --- Option Lists ---

const IMAGE_OUTPUTS = [
  { label: 'JPG', value: ImageFormat.JPEG },
  { label: 'PNG', value: ImageFormat.PNG },
  { label: 'WEBP', value: ImageFormat.WEBP },
  { label: 'ICO (Icon)', value: ImageFormat.ICO },
  { label: 'GIF', value: ImageFormat.GIF },
  { label: 'BMP', value: ImageFormat.BMP },
  { label: 'TIFF', value: ImageFormat.TIFF },
];

const AUDIO_OUTPUTS = [
  { label: 'MP3', value: AudioFormat.MP3 },
  { label: 'WAV', value: AudioFormat.WAV },
  { label: 'FLAC', value: AudioFormat.FLAC },
  { label: 'AAC', value: AudioFormat.AAC },
  { label: 'OGG', value: AudioFormat.OGG },
  { label: 'M4A', value: AudioFormat.M4A },
];

const TEXT_CASES = [
  { label: 'UPPERCASE', value: 'upper' },
  { label: 'lowercase', value: 'lower' },
  { label: 'Title Case', value: 'title' },
  { label: 'camelCase', value: 'camel' },
  { label: 'snake_case', value: 'snake' },
  { label: 'kebab-case', value: 'kebab' },
  { label: 'PascalCase', value: 'pascal' },
];

const DATA_FORMATS = [
  { label: 'JSON to CSV', value: 'json_to_csv' },
  { label: 'CSV to JSON', value: 'csv_to_json' },
];

const IMAGE_FILTERS = [
  { label: 'Grayscale', value: 'grayscale(100%)' },
  { label: 'Sepia', value: 'sepia(100%)' },
  { label: 'Invert', value: 'invert(100%)' },
  { label: 'Blur', value: 'blur(5px)' },
  { label: 'Brightness (High)', value: 'brightness(150%)' },
  { label: 'Contrast (High)', value: 'contrast(200%)' },
  { label: 'Hue Rotate', value: 'hue-rotate(90deg)' },
  { label: 'Vintage', value: 'sepia(50%) contrast(120%)' },
];

// --- The Master Tool Registry ---

export const TOOLS: ToolDefinition[] = [
  // === IMAGE ===
  {
    id: 'background-remover',
    label: 'Background Remover',
    description: 'Remove background using Magic Wand/Color Keying.',
    category: ToolCategory.IMAGE,
    acceptedMimeTypes: SUPPORTED_IMAGE_INPUTS,
    handlerType: 'background_remover'
  },
  {
    id: 'image-filters',
    label: 'Image Filters',
    description: 'Apply artistic filters (Grayscale, Sepia, Blur).',
    category: ToolCategory.IMAGE,
    acceptedMimeTypes: SUPPORTED_IMAGE_INPUTS,
    outputFormatOptions: IMAGE_FILTERS,
    handlerType: 'image_filter'
  },
  {
    id: 'image-converter',
    label: 'Image Converter',
    description: 'Convert between PNG, JPG, ICO, WEBP, and more.',
    category: ToolCategory.IMAGE,
    acceptedMimeTypes: SUPPORTED_IMAGE_INPUTS,
    outputFormatOptions: IMAGE_OUTPUTS,
    handlerType: 'image'
  },
  {
    id: 'color-picker',
    label: 'Color Picker',
    description: 'Extract colors from your images.',
    category: ToolCategory.IMAGE,
    acceptedMimeTypes: SUPPORTED_IMAGE_INPUTS,
    handlerType: 'color_picker'
  },
  {
    id: 'resize-image',
    label: 'Resize Image',
    description: 'Change image dimensions.',
    category: ToolCategory.IMAGE,
    acceptedMimeTypes: SUPPORTED_IMAGE_INPUTS,
    handlerType: 'image'
  },

  // === TEXT & DATA ===
  {
    id: 'text-case-converter',
    label: 'Text Case Converter',
    description: 'Transform text to UPPERCASE, snake_case, and more.',
    category: ToolCategory.DATA_TEXT,
    acceptedMimeTypes: [],
    outputFormatOptions: TEXT_CASES,
    handlerType: 'text_transformer'
  },
  {
    id: 'json-csv-converter',
    label: 'JSON <> CSV',
    description: 'Convert data arrays between JSON and CSV formats.',
    category: ToolCategory.DATA_TEXT,
    acceptedMimeTypes: [],
    outputFormatOptions: DATA_FORMATS,
    handlerType: 'text_transformer'
  },
  
  // === UTILITIES ===
  {
    id: 'link-shortener',
    label: 'Link Shortener',
    description: 'Shorten long URLs instantly.',
    category: ToolCategory.UTILITIES,
    acceptedMimeTypes: [],
    handlerType: 'url_shortener'
  },
  {
    id: 'url-to-qrcode',
    label: 'URL to QR Code',
    description: 'Convert any website link into a QR code.',
    category: ToolCategory.UTILITIES,
    acceptedMimeTypes: [],
    handlerType: 'qr_code'
  },
  {
    id: 'text-to-qrcode',
    label: 'Text to QR Code',
    description: 'Convert plain text into a scanable QR code.',
    category: ToolCategory.UTILITIES,
    acceptedMimeTypes: [],
    handlerType: 'qr_code'
  },
  {
    id: 'base-converter',
    label: 'Base Number Transform',
    description: 'Convert Binary, Octal, Decimal, Hex, and more.',
    category: ToolCategory.UTILITIES,
    acceptedMimeTypes: [],
    handlerType: 'base_converter'
  },

  // === VIDEO & AUDIO ===
  {
    id: 'vocal-separator',
    label: 'Vocal Remover / Isolator',
    description: 'Separate vocals and instrumentals from music.',
    category: ToolCategory.VIDEO_AUDIO,
    acceptedMimeTypes: SUPPORTED_AUDIO_INPUTS,
    outputFormatOptions: [
      { label: 'Extract Instrumental (Karaoke)', value: 'instrumental' },
      { label: 'Extract Vocals', value: 'vocal' }
    ],
    handlerType: 'vocal_separator'
  },
  {
    id: 'youtube-to-mp3',
    label: 'YouTube to MP3',
    description: 'Download audio from YouTube videos.',
    category: ToolCategory.VIDEO_AUDIO,
    acceptedMimeTypes: [],
    outputFormatOptions: [{ label: 'MP3', value: AudioFormat.MP3 }, { label: 'M4A', value: AudioFormat.M4A }],
    handlerType: 'youtube_downloader'
  },
  {
    id: 'youtube-to-mp4',
    label: 'YouTube to MP4',
    description: 'Download high quality video from YouTube.',
    category: ToolCategory.VIDEO_AUDIO,
    acceptedMimeTypes: [],
    outputFormatOptions: [{ label: 'MP4', value: 'video/mp4' }, { label: 'WEBM', value: 'video/webm' }],
    handlerType: 'youtube_downloader'
  },
  {
    id: 'video-converter',
    label: 'Video Converter',
    description: 'Convert video files to different formats.',
    category: ToolCategory.VIDEO_AUDIO,
    acceptedMimeTypes: SUPPORTED_VIDEO_INPUTS,
    outputFormatOptions: [{ label: 'MP4', value: 'video/mp4' }, { label: 'WEBM', value: 'video/webm' }],
    handlerType: 'video'
  },
  {
    id: 'audio-converter',
    label: 'Audio Converter',
    description: 'Convert audio files to any format.',
    category: ToolCategory.VIDEO_AUDIO,
    acceptedMimeTypes: SUPPORTED_AUDIO_INPUTS,
    outputFormatOptions: AUDIO_OUTPUTS,
    handlerType: 'audio'
  },
  {
    id: 'video-to-mp3',
    label: 'Video to MP3',
    description: 'Extract audio from video files.',
    category: ToolCategory.VIDEO_AUDIO,
    acceptedMimeTypes: SUPPORTED_VIDEO_INPUTS,
    outputFormatOptions: [{ label: 'MP3', value: AudioFormat.MP3 }, { label: 'WAV', value: AudioFormat.WAV }],
    handlerType: 'audio'
  },
  {
    id: 'video-compressor',
    label: 'Video Compressor',
    description: 'Reduce video file size.',
    category: ToolCategory.VIDEO_AUDIO,
    acceptedMimeTypes: SUPPORTED_VIDEO_INPUTS,
    handlerType: 'video'
  },
  {
    id: 'mp3-compressor',
    label: 'MP3 Compressor',
    description: 'Reduce audio file size.',
    category: ToolCategory.VIDEO_AUDIO,
    acceptedMimeTypes: ['audio/mpeg'],
    handlerType: 'audio'
  },

  // === PDF & DOCUMENTS ===
  {
    id: 'img-to-pdf',
    label: 'Image to PDF',
    description: 'Convert images to PDF document.',
    category: ToolCategory.PDF_DOCS,
    acceptedMimeTypes: SUPPORTED_IMAGE_INPUTS,
    outputFormatOptions: [{ label: 'PDF', value: 'application/pdf' }],
    handlerType: 'pdf'
  },

  // === GIF ===
  {
    id: 'video-to-gif',
    label: 'Video to GIF',
    description: 'Create animated GIFs from videos.',
    category: ToolCategory.GIF,
    acceptedMimeTypes: SUPPORTED_VIDEO_INPUTS,
    outputFormatOptions: [{ label: 'GIF', value: ImageFormat.GIF }],
    handlerType: 'image'
  },
  {
    id: 'image-to-gif',
    label: 'Image to GIF',
    description: 'Convert static image to static GIF.',
    category: ToolCategory.GIF,
    acceptedMimeTypes: SUPPORTED_IMAGE_INPUTS,
    outputFormatOptions: [{ label: 'GIF', value: ImageFormat.GIF }],
    handlerType: 'image'
  }
];

export const TOOL_CATEGORIES = Object.values(ToolCategory);