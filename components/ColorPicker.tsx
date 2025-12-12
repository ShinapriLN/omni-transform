import React, { useRef, useState } from 'react';
import { getPixelColor } from '../utils/imageUtils';

interface ColorPickerProps {
  imageSrc: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ imageSrc }) => {
  const [color, setColor] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale coordinates to natural image size
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;
    
    const hex = await getPixelColor(imageSrc, Math.floor(x * scaleX), Math.floor(y * scaleY));
    setColor(hex);
  };

  return (
    <div className="space-y-4">
       <div className="relative cursor-crosshair group rounded-lg overflow-hidden border border-gray-700">
         <img 
           ref={imgRef}
           src={imageSrc} 
           alt="Pick color" 
           onClick={handleClick}
           className="w-full h-auto"
         />
       </div>
       
       {color && (
         <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl border border-gray-700 animate-fade-in">
           <div 
             className="w-12 h-12 rounded-full border-2 border-white shadow-lg" 
             style={{ backgroundColor: color }}
           ></div>
           <div>
             <p className="text-xs text-gray-400 uppercase">Selected Color</p>
             <p className="text-xl font-mono font-bold text-white select-all">{color}</p>
           </div>
           <button 
             onClick={() => navigator.clipboard.writeText(color)}
             className="ml-auto text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-gray-300"
           >
             Copy
           </button>
         </div>
       )}
    </div>
  );
};
