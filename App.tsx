import React, { useState, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FileUploader } from './components/FileUploader';
import { UrlInput } from './components/UrlInput';
import { Button } from './components/Button';
import { ColorPicker } from './components/ColorPicker';
import { AudioVisualizer } from './components/AudioVisualizer';
import { FileData, ToolDefinition, ProcessingState, TransformMode, ToolCategory, AudioFormat } from './types';
import { convertRasterToRaster, downloadResult, applyImageFilter, removeBackground, getPixelColor } from './utils/imageUtils';
import { convertAudio, separateAudio } from './utils/audioUtils';
import { transformImageToSvg } from './services/geminiService';
import { convertUnit, UNITS, UnitCategory } from './utils/mathUtils';
import { transformTextCase, transformDataFormat } from './utils/textUtils';
import { imageToPdf } from './utils/pdfUtils';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [sourceFile, setSourceFile] = useState<FileData | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Input State for Text/Code/Shortener
  const [textInput, setTextInput] = useState('');

  // Unit Converter State
  const [unitState, setUnitState] = useState({
    category: 'length' as UnitCategory,
    from: 'meters',
    to: 'feet',
    value: 1,
    result: 3.28084
  });

  // Base Converter State
  const [baseState, setBaseState] = useState({
    value: '10',
    fromBase: 10,
    toBase: 2,
    result: '1010'
  });

  // Background Remover State
  const [bgRemoveState, setBgRemoveState] = useState({
    color: { r: 255, g: 255, b: 255 },
    hex: '#FFFFFF',
    tolerance: 30,
    hasPicked: false
  });
  const bgImgRef = useRef<HTMLImageElement>(null);

  const [processState, setProcessState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    error: null,
    result: null,
    resultType: ''
  });

  const reset = () => {
    setSourceFile(null);
    setTextInput('');
    setBgRemoveState({
        color: { r: 255, g: 255, b: 255 },
        hex: '#FFFFFF',
        tolerance: 30,
        hasPicked: false
    });
    setProcessState({
      isProcessing: false,
      progress: 0,
      error: null,
      result: null,
      resultType: ''
    });
  };

  const handleToolSelect = (tool: ToolDefinition | null) => {
    if (!tool) {
      setSelectedTool(null);
    } else {
      setSelectedTool(tool);
      setTargetFormat(tool.outputFormatOptions?.[0]?.value || '');
      reset();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleUrlSubmit = (url: string) => {
    const id = extractYoutubeId(url);
    if (id) {
      setSourceFile({
        file: new File([""], `youtube_video_${id}`, { type: 'video/youtube' }),
        preview: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
        type: 'video/youtube'
      });
    } else {
      alert("Invalid YouTube URL");
    }
  };

  const handleBaseConvert = (val: string, from: number, to: number) => {
      // Clean input based on base
      let cleanVal = val;
      if (from === 2) cleanVal = val.replace(/[^0-1]/g, '');
      else if (from === 8) cleanVal = val.replace(/[^0-7]/g, '');
      else if (from === 10) cleanVal = val.replace(/[^0-9]/g, '');
      else if (from === 16) cleanVal = val.replace(/[^0-9a-fA-F]/g, '');

      // Check for empty to avoid NaN
      if (!cleanVal) {
          setBaseState({ value: val, fromBase: from, toBase: to, result: '' });
          return;
      }

      try {
        const decimal = parseInt(cleanVal, from);
        const res = decimal.toString(to).toUpperCase();
        setBaseState({ value: cleanVal, fromBase: from, toBase: to, result: res });
      } catch (e) {
        setBaseState({ value: cleanVal, fromBase: from, toBase: to, result: 'Error' });
      }
  };

  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!bgImgRef.current || !sourceFile) return;
    
    const rect = bgImgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale coordinates
    const scaleX = bgImgRef.current.naturalWidth / rect.width;
    const scaleY = bgImgRef.current.naturalHeight / rect.height;
    
    const colorData = await getPixelColor(sourceFile.preview, Math.floor(x * scaleX), Math.floor(y * scaleY));
    setBgRemoveState(prev => ({ 
        ...prev, 
        color: { r: colorData.r, g: colorData.g, b: colorData.b }, 
        hex: colorData.hex,
        hasPicked: true
    }));
  };

  const handleProcess = async () => {
    if (!selectedTool) return;
    if (selectedTool.handlerType === 'unit' || selectedTool.handlerType === 'base_converter') return;
    
    const isTextMode = ['code_morph', 'qr_code', 'url_shortener', 'text_transformer'].includes(selectedTool.handlerType);

    // Check inputs based on tool type
    if (isTextMode && !textInput) return;
    if (!isTextMode && !sourceFile) return;

    setProcessState(prev => ({ ...prev, isProcessing: true, error: null, progress: 10 }));

    try {
      let resultData: string = '';
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // --- TEXT TRANSFORMER (Case / CSV / JSON) ---
      if (selectedTool.handlerType === 'text_transformer') {
         setProcessState(prev => ({ ...prev, progress: 30 }));
         if (selectedTool.id === 'json-csv-converter') {
             resultData = transformDataFormat(textInput, targetFormat);
         } else {
             resultData = transformTextCase(textInput, targetFormat);
         }
         const blob = new Blob([resultData], { type: 'text/plain' });
         resultData = URL.createObjectURL(blob);
      }

      // --- URL SHORTENER ---
      else if (selectedTool.handlerType === 'url_shortener') {
          setProcessState(prev => ({ ...prev, progress: 50 }));
          // Simple TinyURL fetch
          const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(textInput)}`);
          if (!res.ok) throw new Error("Failed to shorten link");
          const shortUrl = await res.text();
          const blob = new Blob([shortUrl], { type: 'text/plain' });
          resultData = URL.createObjectURL(blob);
      }

      // --- QR CODE GENERATOR ---
      else if (selectedTool.handlerType === 'qr_code') {
          setProcessState(prev => ({ ...prev, progress: 30 }));
          // Use public API for QR Code
          const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(textInput)}`;
          // Fetch as blob to allow download
          const res = await fetch(apiUrl);
          const blob = await res.blob();
          resultData = URL.createObjectURL(blob);
      }

      // --- CODE MORPH HANDLER ---
      else if (selectedTool.handlerType === 'code_morph') {
         setProcessState(prev => ({ ...prev, progress: 40 }));
         const prompt = `Convert the following code to ${targetFormat}. Provide ONLY the converted code, no markdown fencing, no explanation.`;
         
         const resp = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: {
                 parts: [{ text: prompt + "\n\n" + textInput }]
             }
         });
         
         const convertedCode = resp.text || "// AI Translation failed";
         const blob = new Blob([convertedCode], { type: 'text/plain' });
         resultData = URL.createObjectURL(blob);
      }

      // --- GEMINI TEXT / VISION HANDLER ---
      else if (selectedTool.handlerType === 'gemini_text') {
        const prompt = selectedTool.id === 'vision-scribe' 
             ? "Describe this image in high detail. Include main objects, setting, colors, and mood."
             : "Extract all text from this file.";
             
        const resp = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: sourceFile!.preview.split(',')[1], mimeType: sourceFile!.type } },
                    { text: prompt }
                ]
            }
        });
        const text = resp.text || "No content generated.";
        const blob = new Blob([text], { type: 'text/plain' });
        resultData = URL.createObjectURL(blob);
      }

      // --- YOUTUBE HANDLER ---
      else if (selectedTool.handlerType === 'youtube_downloader') {
        setProcessState(prev => ({ ...prev, progress: 30 }));
        const isAudio = targetFormat.startsWith('audio');
        const SAMPLE_VIDEO = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
        const SAMPLE_AUDIO = 'https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/theme_01.mp3';
        const fetchUrl = isAudio ? SAMPLE_AUDIO : SAMPLE_VIDEO;
        const response = await fetch(fetchUrl);
        const blob = await response.blob();
        setProcessState(prev => ({ ...prev, progress: 80 }));
        const finalBlob = new Blob([blob], { type: targetFormat });
        resultData = URL.createObjectURL(finalBlob);
      }

      // --- BACKGROUND REMOVER ---
      else if (selectedTool.handlerType === 'background_remover') {
         setProcessState(prev => ({ ...prev, progress: 40 }));
         resultData = await removeBackground(sourceFile!.preview, bgRemoveState.color, bgRemoveState.tolerance);
      }

      // --- IMAGE HANDLER & FILTER ---
      else if (selectedTool.handlerType === 'image' || selectedTool.handlerType === 'image_filter') {
        if (targetFormat === 'image/svg+xml') {
           setProcessState(prev => ({ ...prev, progress: 30 }));
           const svgCode = await transformImageToSvg(sourceFile!.preview, sourceFile!.type);
           const blob = new Blob([svgCode], { type: 'image/svg+xml' });
           resultData = URL.createObjectURL(blob);
        } else if (selectedTool.handlerType === 'image_filter') {
           setProcessState(prev => ({ ...prev, progress: 30 }));
           resultData = await applyImageFilter(sourceFile!.preview, targetFormat);
        } else {
           const input = sourceFile!.preview; 
           resultData = await convertRasterToRaster(input, targetFormat as any);
        }
      }

      // --- AUDIO SEPARATOR ---
      else if (selectedTool.handlerType === 'vocal_separator') {
        setProcessState(prev => ({ ...prev, progress: 20 }));
        resultData = await separateAudio(sourceFile!.file, targetFormat as 'instrumental' | 'vocal');
      }

      // --- GENERAL AV HANDLER ---
      else if (selectedTool.handlerType === 'audio' || selectedTool.handlerType === 'video') {
        resultData = await convertAudio(sourceFile!.file, targetFormat as any);
      }

      // --- PDF HANDLER ---
      else if (selectedTool.handlerType === 'pdf') {
         resultData = await imageToPdf(sourceFile!.preview);
      }

      setProcessState({
        isProcessing: false,
        progress: 100,
        error: null,
        result: resultData,
        resultType: selectedTool.handlerType === 'vocal_separator' ? AudioFormat.WAV : 
                    selectedTool.handlerType === 'qr_code' ? 'image/png' :
                    selectedTool.handlerType === 'background_remover' ? 'image/png' :
                    (selectedTool.id === 'json-csv-converter' && targetFormat === 'json_to_csv') ? 'text/csv' :
                    (selectedTool.id === 'json-csv-converter' && targetFormat === 'csv_to_json') ? 'application/json' :
                    (selectedTool.handlerType === 'url_shortener' || selectedTool.handlerType === 'text_transformer') ? 'text/plain' : targetFormat
      });

    } catch (error: any) {
      console.error(error);
      setProcessState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message || "Transformation failed. Please check inputs."
      }));
    }
  };

  return (
    <div className="flex h-screen bg-[#0f1117] text-white font-sans overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        selectedToolId={selectedTool?.id || null} 
        onSelectTool={handleToolSelect} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        searchQuery={searchQuery}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-[#0f1117]/80 backdrop-blur-md z-30">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              
              <div className="flex items-center gap-2 text-sm">
                 <span 
                    className="text-gray-500 hover:text-gray-300 cursor-pointer hidden sm:block"
                    onClick={() => handleToolSelect(null)}
                 >
                   Dashboard
                 </span>
                 {selectedTool && (
                   <>
                     <span className="text-gray-600">/</span>
                     <span className="text-white font-medium">{selectedTool.label}</span>
                   </>
                 )}
              </div>
           </div>

           <div className="relative w-full max-w-md ml-4 hidden sm:block">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value && selectedTool) {
                        handleToolSelect(null);
                    }
                }}
                placeholder="Search tools (e.g. 'code', 'pdf')..."
                className="w-full bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <svg className="w-4 h-4 text-gray-500 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
           </div>
        </header>

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar relative">
          
          {!selectedTool ? (
             <div className="max-w-7xl mx-auto">
                <div className="mb-10 text-center sm:text-left">
                   <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                   <p className="text-gray-400">Select a tool from the sidebar or browse the categories below.</p>
                </div>
                <Dashboard onSelectTool={handleToolSelect} searchQuery={searchQuery} />
             </div>
          ) : (
             <div className="max-w-5xl mx-auto animate-fade-in">
                {/* Tool Header */}
                <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                          selectedTool.category === ToolCategory.VIDEO_AUDIO ? 'bg-purple-500/20 text-purple-400' :
                          selectedTool.category === ToolCategory.IMAGE ? 'bg-indigo-500/20 text-indigo-400' :
                          selectedTool.category === ToolCategory.AI_TOOLS ? 'bg-blue-500/20 text-blue-400' :
                          selectedTool.category === ToolCategory.UTILITIES ? 'bg-orange-500/20 text-orange-400' :
                          selectedTool.category === ToolCategory.DATA_TEXT ? 'bg-pink-500/20 text-pink-400' :
                          'bg-emerald-500/20 text-emerald-400'
                      }`}>
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                         <h2 className="text-2xl font-bold text-white">{selectedTool.label}</h2>
                         <p className="text-gray-400 text-sm">{selectedTool.description}</p>
                      </div>
                   </div>
                </div>

                {/* Tool Workspace */}
                {selectedTool.handlerType === 'unit' ? (
                   /* UNIT CONVERTER */
                   <div className="bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-700 shadow-xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                          <div>
                              <label className="block text-xs text-gray-500 uppercase font-semibold mb-2">Category</label>
                              <select 
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                value={unitState.category}
                                onChange={(e) => setUnitState(prev => ({ ...prev, category: e.target.value as any }))}
                              >
                                {Object.keys(UNITS).map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-center gap-4">
                         <div className="flex-1 w-full">
                            <input 
                              type="number" 
                              value={unitState.value} 
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setUnitState(prev => ({ ...prev, value: val }));
                                setUnitState(prev => ({ ...prev, value: val, result: convertUnit(prev.category, prev.from, prev.to, val) }));
                              }}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-2xl font-mono text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <select 
                               className="w-full mt-2 bg-gray-900 border-none text-gray-400 text-sm py-2"
                               value={unitState.from}
                               onChange={(e) => {
                                   setUnitState(prev => ({ 
                                       ...prev, 
                                       from: e.target.value, 
                                       result: convertUnit(prev.category, e.target.value, prev.to, prev.value) 
                                   }));
                               }}
                            >
                               {Object.keys(UNITS[unitState.category]).map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                         </div>
                         <div className="text-2xl text-gray-600 hidden md:block">→</div>
                         <div className="flex-1 w-full">
                            <div className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-2xl font-mono text-emerald-400">
                               {unitState.result.toFixed(4)}
                            </div>
                            <select 
                               className="w-full mt-2 bg-gray-900 border-none text-gray-400 text-sm py-2"
                               value={unitState.to}
                               onChange={(e) => {
                                   setUnitState(prev => ({ 
                                       ...prev, 
                                       to: e.target.value,
                                       result: convertUnit(prev.category, prev.from, e.target.value, prev.value) 
                                   }));
                               }}
                            >
                               {Object.keys(UNITS[unitState.category]).map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                         </div>
                      </div>
                   </div>
                ) : selectedTool.handlerType === 'base_converter' ? (
                   /* BASE CONVERTER */
                   <div className="bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-700 shadow-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                             <label className="text-xs text-gray-500 uppercase font-semibold">From Base</label>
                             <select 
                               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                               value={baseState.fromBase}
                               onChange={(e) => handleBaseConvert(baseState.value, parseInt(e.target.value), baseState.toBase)}
                             >
                                <option value={2}>Binary (2)</option>
                                <option value={8}>Octal (8)</option>
                                <option value={10}>Decimal (10)</option>
                                <option value={16}>Hexadecimal (16)</option>
                             </select>
                             <textarea 
                               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                               value={baseState.value}
                               onChange={(e) => handleBaseConvert(e.target.value, baseState.fromBase, baseState.toBase)}
                             />
                         </div>
                         <div className="space-y-2">
                             <label className="text-xs text-gray-500 uppercase font-semibold">To Base</label>
                             <select 
                               className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                               value={baseState.toBase}
                               onChange={(e) => handleBaseConvert(baseState.value, baseState.fromBase, parseInt(e.target.value))}
                             >
                                <option value={2}>Binary (2)</option>
                                <option value={8}>Octal (8)</option>
                                <option value={10}>Decimal (10)</option>
                                <option value={16}>Hexadecimal (16)</option>
                             </select>
                             <div className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-4 font-mono text-xl text-emerald-400 h-32 flex items-center overflow-x-auto">
                               {baseState.result || '...'}
                             </div>
                         </div>
                      </div>
                   </div>
                ) : (selectedTool.handlerType === 'code_morph' || selectedTool.handlerType === 'qr_code' || selectedTool.handlerType === 'url_shortener' || selectedTool.handlerType === 'text_transformer') ? (
                   /* TEXT/CODE INPUT WORKSPACE */
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-fit min-h-[400px]">
                      <div className="flex flex-col h-full">
                          <label className="text-sm text-gray-400 mb-2 font-medium">
                            {selectedTool.handlerType === 'url_shortener' || selectedTool.id === 'url-to-qrcode' ? 'Enter URL' : 'Enter Text/Code'}
                          </label>
                          <textarea 
                             className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-4 font-mono text-sm text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[200px]"
                             placeholder={
                               selectedTool.handlerType === 'url_shortener' ? "https://example.com/very/long/url..." : 
                               selectedTool.id === 'json-csv-converter' ? '[{"name": "John", "age": 30}]' :
                               "Type here..."
                             }
                             value={textInput}
                             onChange={(e) => setTextInput(e.target.value)}
                          />
                      </div>
                      <div className="flex flex-col h-full">
                         {(selectedTool.handlerType === 'code_morph' || selectedTool.handlerType === 'text_transformer') && (
                           <div className="flex items-center justify-between mb-2">
                               <label className="text-sm text-gray-400 font-medium">Target Format</label>
                               <select 
                                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-xs text-white"
                                  value={targetFormat}
                                  onChange={(e) => setTargetFormat(e.target.value)}
                                >
                                    {selectedTool.outputFormatOptions?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                           </div>
                         )}
                         
                         {processState.result ? (
                             <div className="flex-1 bg-black/40 border border-gray-700 rounded-xl overflow-hidden relative group min-h-[200px] flex items-center justify-center">
                                {selectedTool.handlerType === 'qr_code' ? (
                                    <div className="p-6 bg-white rounded-lg">
                                       <img src={processState.result} alt="QR Code" className="w-48 h-48" />
                                    </div>
                                ) : (
                                  <iframe 
                                    src={processState.result} 
                                    className="w-full h-full p-4 font-mono text-sm text-emerald-400 bg-transparent"
                                    title="Result"
                                  />
                                )}
                                
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                   <Button 
                                     onClick={() => downloadResult(processState.result!, selectedTool.id === 'qr_code' ? 'qrcode' : 'result', processState.resultType)}
                                     className="text-xs py-1 px-3"
                                   >Download</Button>
                                </div>
                             </div>
                         ) : (
                             <div className="flex-1 bg-gray-800/50 border border-gray-700 border-dashed rounded-xl flex items-center justify-center text-gray-500 text-sm min-h-[200px]">
                                {processState.isProcessing ? 'Processing...' : 'Result will appear here'}
                             </div>
                         )}

                         <div className="mt-4">
                            <Button 
                               onClick={handleProcess} 
                               isLoading={processState.isProcessing} 
                               className="w-full"
                               disabled={!textInput}
                            >
                               {processState.isProcessing ? 'Processing...' : selectedTool.id === 'link-shortener' ? 'Shorten URL' : selectedTool.handlerType === 'qr_code' ? 'Generate QR' : 'Transform'}
                            </Button>
                         </div>
                      </div>
                   </div>
                ) : (
                   /* GENERIC FILE WORKSPACE (Images, Video, Audio, PDF) */
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="space-y-6">
                       {!sourceFile ? (
                           selectedTool.handlerType === 'youtube_downloader' ? (
                             <UrlInput onUrlSubmit={handleUrlSubmit} />
                           ) : (
                             <FileUploader 
                               mode={selectedTool.category === ToolCategory.VIDEO_AUDIO ? TransformMode.VIDEO : TransformMode.IMAGE} 
                               onFileSelect={setSourceFile} 
                             />
                           )
                       ) : (
                          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl">
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-mono bg-gray-900 px-3 py-1.5 rounded-md text-gray-300 truncate max-w-[200px] border border-gray-700">{sourceFile.file.name}</span>
                                <button onClick={reset} className="text-red-400 text-xs hover:text-red-300 font-medium px-2 py-1 hover:bg-red-500/10 rounded transition-colors">Clear</button>
                             </div>
                             
                             <div className="bg-gray-900 rounded-xl overflow-hidden mb-6 flex items-center justify-center min-h-[250px] relative group border border-gray-800">
                                 {selectedTool.handlerType === 'color_picker' ? (
                                     <ColorPicker imageSrc={sourceFile.preview} />
                                 ) : sourceFile.type === 'video/youtube' ? (
                                    <>
                                      <img src={sourceFile.preview} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="YT Thumb" />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-xl">
                                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        </div>
                                      </div>
                                    </>
                                 ) : sourceFile.type.startsWith('image') ? (
                                    <div className="relative group w-full">
                                      {/* Specific Click Interaction for Background Remover */}
                                      {selectedTool.handlerType === 'background_remover' && (
                                         <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur text-xs px-3 py-1.5 rounded-lg border border-gray-600 pointer-events-none">
                                            {bgRemoveState.hasPicked ? 'Color Picked' : 'Click image to pick color'}
                                         </div>
                                      )}

                                      <img 
                                        src={sourceFile.preview} 
                                        ref={bgImgRef}
                                        className={`max-h-64 mx-auto object-contain ${selectedTool.handlerType === 'background_remover' ? 'cursor-crosshair' : ''}`} 
                                        alt="Preview" 
                                        onClick={selectedTool.handlerType === 'background_remover' ? handleImageClick : undefined}
                                      />
                                    </div>
                                 ) : (
                                    <div className="text-center p-8">
                                       <svg className="w-16 h-16 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                       <p className="text-gray-500 font-medium">Audio/Video Loaded</p>
                                    </div>
                                 )}
                             </div>

                             {selectedTool.handlerType === 'background_remover' && (
                               <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
                                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-4">
                                    Removal Settings
                                  </label>
                                  <div className="flex items-center gap-4 mb-4">
                                      <div className="w-10 h-10 rounded-lg border border-gray-600 shadow-sm" style={{ backgroundColor: bgRemoveState.hex }}></div>
                                      <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-300">Target Color</p>
                                          <p className="text-xs text-gray-500">{bgRemoveState.hex}</p>
                                      </div>
                                  </div>
                                  <div>
                                     <div className="flex justify-between text-xs text-gray-400 mb-1">
                                         <span>Tolerance</span>
                                         <span>{bgRemoveState.tolerance}%</span>
                                     </div>
                                     <input 
                                        type="range" 
                                        min="1" 
                                        max="100" 
                                        value={bgRemoveState.tolerance} 
                                        onChange={(e) => setBgRemoveState(prev => ({ ...prev, tolerance: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                     />
                                  </div>
                               </div>
                             )}

                             {selectedTool.outputFormatOptions && (
                               <div className="mb-6">
                                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                                    {selectedTool.handlerType === 'gemini_text' ? 'Output' : selectedTool.handlerType === 'image_filter' ? 'Select Filter' : 'Target Format'}
                                  </label>
                                  <div className="relative">
                                    <select 
                                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                                      value={targetFormat}
                                      onChange={(e) => setTargetFormat(e.target.value)}
                                    >
                                        {selectedTool.outputFormatOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                  </div>
                               </div>
                             )}

                             {selectedTool.handlerType !== 'color_picker' && (
                                <Button onClick={handleProcess} isLoading={processState.isProcessing} className="w-full text-lg h-12">
                                   {processState.isProcessing ? 'Processing...' : (selectedTool.handlerType === 'youtube_downloader' ? 'Prepare Download' : selectedTool.id === 'vision-scribe' ? 'Analyze Image' : selectedTool.handlerType === 'image_filter' ? 'Apply Filter' : selectedTool.handlerType === 'background_remover' ? 'Remove Background' : 'Convert Now')}
                                </Button>
                             )}
                          </div>
                       )}
                     </div>

                     {/* Output Panel */}
                     {processState.result && (
                        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl animate-fade-in-up h-fit">
                           <div className="flex items-center gap-3 mb-6 p-4 bg-emerald-900/20 border border-emerald-900/50 rounded-xl text-emerald-400">
                              <div className="p-2 bg-emerald-500 rounded-full text-white shadow-lg shadow-emerald-500/30">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <span className="font-bold">Success! Result ready.</span>
                           </div>
                           
                           <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800 text-center min-h-[200px] flex flex-col items-center justify-center">
                              {processState.resultType.startsWith('video') ? (
                                 <video controls src={processState.result} className="w-full rounded-lg max-h-60 shadow-lg" />
                              ) : processState.resultType.startsWith('audio') ? (
                                 <div className="w-full">
                                    {/* USE AUDIO VISUALIZER HERE */}
                                   <AudioVisualizer audioSrc={processState.result} />
                                 </div>
                              ) : processState.resultType === 'text/plain' || processState.resultType === 'text/csv' || processState.resultType === 'application/json' ? (
                                  <iframe src={processState.result} className="w-full h-64 border-none bg-transparent font-mono text-sm text-gray-300" title="Text Result" />
                              ) : (
                                  <>
                                    {/* Checkboard background for transparency result */}
                                    <div className="relative inline-block">
                                        {selectedTool.handlerType === 'background_remover' && (
                                            <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==')] opacity-20 rounded-lg"></div>
                                        )}
                                        <img src={processState.result} className="relative z-10 max-h-56 mx-auto object-contain mb-4 shadow-lg rounded-lg" alt="Result" />
                                    </div>
                                    <div className="text-gray-500 text-xs font-mono bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                                      {(processState.result.length / 1024).toFixed(1)} KB
                                    </div>
                                  </>
                              )}
                           </div>
                           
                           {selectedTool.handlerType === 'youtube_downloader' && (
                              <div className="mb-6 text-xs text-yellow-500/90 bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20 flex gap-3 items-start">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p><strong>Demo Mode:</strong> We've prepared a high-quality sample file for you to test the download functionality, as direct YouTube downloads are restricted in browsers.</p>
                              </div>
                           )}

                           <Button 
                              onClick={() => downloadResult(processState.result!, sourceFile?.file.name || 'output', processState.resultType)}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 h-12 text-lg shadow-emerald-900/20"
                           >
                              Download File
                           </Button>
                        </div>
                     )}
                   </div>
                )}
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
