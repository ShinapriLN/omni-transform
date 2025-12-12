import React from 'react';
import { TOOLS, TOOL_CATEGORIES } from '../constants';
import { ToolDefinition, ToolCategory } from '../types';

interface DashboardProps {
  onSelectTool: (tool: ToolDefinition) => void;
  searchQuery?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTool, searchQuery = '' }) => {
  
  // If search query is active, show flat list instead of categories
  if (searchQuery) {
    const filteredTools = TOOLS.filter(t => 
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="animate-fade-in-up">
            <h3 className="text-xl font-bold mb-6 text-gray-200">Search Results</h3>
            {filteredTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTools.map(tool => (
                        <ToolCard key={tool.id} tool={tool} onSelect={() => onSelectTool(tool)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-800/30 rounded-2xl border border-gray-800">
                    <p>No tools found matching "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="space-y-12">
      {TOOL_CATEGORIES.map(category => {
        const categoryTools = TOOLS.filter(t => t.category === category);
        if (categoryTools.length === 0) return null;

        return (
          <div key={category} className="animate-fade-in-up">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-100 border-b border-gray-800 pb-2">
              <span className={`w-2 h-8 rounded-full ${
                category === ToolCategory.VIDEO_AUDIO ? 'bg-purple-500' :
                category === ToolCategory.IMAGE ? 'bg-indigo-500' :
                category === ToolCategory.PDF_DOCS ? 'bg-red-500' :
                'bg-emerald-500'
              }`}></span>
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryTools.map(tool => (
                 <ToolCard key={tool.id} tool={tool} onSelect={() => onSelectTool(tool)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ToolCard: React.FC<{ tool: ToolDefinition; onSelect: () => void }> = ({ tool, onSelect }) => (
    <button
      onClick={onSelect}
      className="group bg-gray-800/40 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl p-5 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-3">
         <div className={`p-2 rounded-lg ${
            tool.category === ToolCategory.VIDEO_AUDIO ? 'bg-purple-500/10 text-purple-400' :
            tool.category === ToolCategory.IMAGE ? 'bg-indigo-500/10 text-indigo-400' :
            tool.category === ToolCategory.PDF_DOCS ? 'bg-red-500/10 text-red-400' :
            'bg-emerald-500/10 text-emerald-400'
         }`}>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
         </div>
      </div>
      <h4 className="font-semibold text-gray-200 group-hover:text-white mb-1">{tool.label}</h4>
      <p className="text-xs text-gray-500 group-hover:text-gray-400 line-clamp-2 mt-auto">{tool.description}</p>
    </button>
);
