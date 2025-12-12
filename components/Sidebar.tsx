import React, { useState } from 'react';
import { TOOLS, TOOL_CATEGORIES } from '../constants';
import { ToolCategory, ToolDefinition } from '../types';

interface SidebarProps {
  selectedToolId: string | null;
  onSelectTool: (tool: ToolDefinition) => void;
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  selectedToolId, 
  onSelectTool, 
  isOpen, 
  onClose,
  searchQuery 
}) => {
  const [expandedCategory, setExpandedCategory] = useState<ToolCategory | null>(null);

  const toggleCategory = (category: ToolCategory) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Filter tools based on search
  const filteredTools = TOOLS.filter(t => 
    t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-gray-900 border-r border-gray-800
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-gray-900 sticky top-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg mr-3">
            O
          </div>
          <span className="text-xl font-bold tracking-tight text-white">OmniTransform</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
          <button
            onClick={() => {
              onSelectTool(null as any); 
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedToolId 
                ? 'bg-indigo-600/10 text-indigo-400' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </button>

          <div className="my-4 border-t border-gray-800"></div>

          {searchQuery ? (
            // Search Results Mode
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Search Results</p>
              {filteredTools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => {
                    onSelectTool(tool);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedToolId === tool.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {tool.label}
                </button>
              ))}
              {filteredTools.length === 0 && (
                <p className="px-3 text-sm text-gray-500">No tools found.</p>
              )}
            </div>
          ) : (
            // Category Mode
            TOOL_CATEGORIES.map(category => {
              const categoryTools = TOOLS.filter(t => t.category === category);
              if (categoryTools.length === 0) return null;

              const isActive = expandedCategory === category || categoryTools.some(t => t.id === selectedToolId);
              const colorClass = 
                category === ToolCategory.VIDEO_AUDIO ? 'text-purple-400' :
                category === ToolCategory.IMAGE ? 'text-indigo-400' :
                category === ToolCategory.PDF_DOCS ? 'text-red-400' :
                'text-emerald-400';

              return (
                <div key={category} className="space-y-1">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
                       {category}
                    </span>
                    <svg 
                      className={`w-4 h-4 text-gray-500 transition-transform ${isActive ? 'rotate-90' : ''}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {isActive && (
                    <div className="pl-4 space-y-1 animate-fade-in">
                      {categoryTools.map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => {
                            onSelectTool(tool);
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm border-l-2 transition-colors ${
                            selectedToolId === tool.id
                              ? 'border-indigo-500 bg-gray-800 text-white'
                              : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                          }`}
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
           <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-500">
             <p className="font-semibold text-gray-400 mb-1">OmniTransform v1.0</p>
             <p>Secure client-side processing.</p>
           </div>
        </div>
      </aside>
    </>
  );
};
