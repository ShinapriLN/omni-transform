import React, { useState } from 'react';

interface UrlInputProps {
  onUrlSubmit: (url: string) => void;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onUrlSubmit }) => {
  const [url, setUrl] = useState('');

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center animate-fade-in-up">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
        <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
           <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Enter YouTube URL</h3>
      <p className="text-gray-400 text-sm mb-6">Paste the link to the video you want to convert</p>
      
      <div className="flex gap-2 max-w-lg mx-auto">
        <input 
          type="text" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder-gray-600"
        />
      </div>
      {url && (
         <button 
           onClick={() => onUrlSubmit(url)} 
           className="mt-6 w-full max-w-xs bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-red-500/20"
         >
           Fetch Video Info
         </button>
      )}
    </div>
  );
};
