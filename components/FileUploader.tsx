import React, { useCallback, useState } from 'react';
import { SUPPORTED_IMAGE_INPUTS, SUPPORTED_AUDIO_INPUTS } from '../constants';
import { readFileAsBase64 } from '../utils/imageUtils';
import { FileData, TransformMode } from '../types';

interface FileUploaderProps {
  onFileSelect: (data: FileData) => void;
  mode: TransformMode;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, mode }) => {
  const [isDragging, setIsDragging] = useState(false);

  const supportedTypes = mode === TransformMode.IMAGE ? SUPPORTED_IMAGE_INPUTS : SUPPORTED_AUDIO_INPUTS;

  const handleFile = async (file: File) => {
    if (!file) return;
    
    // Looser check for audio as MIME types vary wildly
    const isAudio = file.type.startsWith('audio/');
    const isImage = file.type.startsWith('image/');

    if (mode === TransformMode.IMAGE && !isImage) {
      alert("Please upload an image file (PNG, JPG, etc).");
      return;
    }
    if (mode === TransformMode.AUDIO && !isAudio) {
      alert("Please upload an audio file (MP3, WAV, etc).");
      return;
    }

    try {
      // For audio we don't strictly need base64 preview, but we use it for consistency
      const base64 = await readFileAsBase64(file);
      onFileSelect({
        file,
        preview: base64,
        type: file.type
      });
    } catch (e) {
      console.error("Error reading file", e);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [mode]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div 
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`
        border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer
        flex flex-col items-center justify-center min-h-[300px]
        ${isDragging 
          ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]' 
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
        }
      `}
    >
      <input 
        type="file" 
        className="hidden" 
        id="file-upload"
        accept={supportedTypes.join(',')}
        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
      />
      <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
        <div className={`w-20 h-20 mb-6 rounded-full ${mode === TransformMode.IMAGE ? 'bg-indigo-900/50' : 'bg-purple-900/50'} flex items-center justify-center`}>
          {mode === TransformMode.IMAGE ? (
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-200 mb-2">
          Drop your {mode === TransformMode.IMAGE ? 'image' : 'audio'} here
        </h3>
        <p className="text-gray-400 text-sm mb-6">or click to browse</p>
        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
          {mode === TransformMode.IMAGE ? 'PNG, JPG, WEBP, BMP...' : 'MP3, WAV, FLAC, OGG...'}
        </span>
      </label>
    </div>
  );
};
