import React, { useState } from "react";
import { AlertCircle, Layout, Type as TextIcon, ShieldAlert, Palette, Check, ArrowRight } from "lucide-react";
import { DesignSuggestion } from "../types";

interface SuggestionsViewProps {
  suggestions: DesignSuggestion[];
  onHoverSuggestion?: (suggestion: DesignSuggestion | null) => void;
  onClickSuggestion?: (suggestion: DesignSuggestion | null) => void;
  activeSuggestion?: DesignSuggestion | null;
}

export default function SuggestionsView({
  suggestions,
  onHoverSuggestion,
  onClickSuggestion,
  activeSuggestion
}: SuggestionsViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'layout' | 'typography' | 'color' | 'accessibility' | 'spacing'>('all');

  const categories = [
    { id: 'all', label: '全部建議' },
    { id: 'layout', label: '版面配置' },
    { id: 'spacing', label: '間距留白' },
    { id: 'typography', label: '字體階層' },
    { id: 'color', label: '配色整合' },
    { id: 'accessibility', label: '可存取性' }
  ] as const;

  const filteredSuggestions = activeTab === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === activeTab);

  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <span className="bg-rose-950/60 text-rose-450 border border-rose-900/40 text-[10px] font-bold px-2 py-0.5 rounded-md">必須優化</span>;
      case 'medium':
        return <span className="bg-amber-950/60 text-amber-450 border border-amber-900/40 text-[10px] font-bold px-2 py-0.5 rounded-md">高度建議</span>;
      case 'low':
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">優雅微調</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'layout':
        return <Layout size={16} className="text-blue-500" />;
      case 'spacing':
        return <AlertCircle size={16} className="text-emerald-500" />;
      case 'typography':
        return <TextIcon size={16} className="text-indigo-500" />;
      case 'color':
        return <Palette size={16} className="text-pink-500" />;
      case 'accessibility':
        return <ShieldAlert size={16} className="text-violet-500" />;
      default:
        return <AlertCircle size={16} className="text-slate-500" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'layout': return '版面配置';
      case 'spacing': return '留白間距';
      case 'typography': return '文字排版';
      case 'color': return '色彩配色';
      case 'accessibility': return '可存取性 (WCAG)';
      default: return '其他建議';
    }
  };

  return (
    <div className="w-full bg-[#131B2E] rounded-2xl border border-slate-800/80 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-slate-800/60">
        <div>
          <h3 className="text-slate-100 font-bold text-lg font-sans flex items-center gap-2">
            <span>診斷優化建議清單</span>
            <span className="text-[10px] bg-indigo-900/50 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-800/40">
              滑鼠懸停卡片以在上方截圖標記位置
            </span>
          </h3>
          <p className="text-slate-400 text-xs">AI 幾何算法與色彩聚類深度檢視 UI 問題，指出具體痛點並給出最佳改良方案</p>
        </div>

        {/* Categories Tab Pill List */}
        <div className="flex flex-wrap gap-1 bg-[#0B0F19]/60 p-1 rounded-xl border border-slate-800/50">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                ${activeTab === cat.id 
                  ? "bg-[#1e293b] text-blue-400 shadow-xs border border-slate-800" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/40"
                }
              `}
            >
              {cat.label}
              {cat.id !== "all" && (
                <span className={`ml-1 text-[10px] rounded px-1
                  ${activeTab === cat.id ? 'bg-blue-950/70 text-blue-400' : 'bg-[#1e293b] text-slate-400'}
                `}>
                  {suggestions.filter(s => s.category === cat.id).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filteredSuggestions.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          在此類別下無評估中的警告或調整建議
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSuggestions.map((suggestion, idx) => {
            const isHighlighted = activeSuggestion?.title === suggestion.title;
            return (
              <div 
                key={idx}
                onMouseEnter={() => onHoverSuggestion?.(suggestion)}
                onMouseLeave={() => onHoverSuggestion?.(null)}
                onClick={() => onClickSuggestion?.(suggestion)}
                className={`border rounded-2xl bg-[#0B0F19]/40 hover:border-indigo-500/50 transition-all duration-300 shadow-xs overflow-hidden cursor-pointer
                  ${isHighlighted ? "border-indigo-500 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/50" : "border-slate-800/65"}
                `}
              >
                {/* Header Box */}
                <div className="p-4 bg-[#0F172E]/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-[#1e293b] rounded-lg border border-slate-850 shadow-xs">
                      {getCategoryIcon(suggestion.category)}
                    </div>
                    <div>
                      <span className="text-[10px] bg-[#1e293b]/70 text-slate-400 font-bold px-1.5 py-0.5 rounded">
                        {getCategoryName(suggestion.category)}
                      </span>
                      <h4 className="text-slate-200 font-bold text-sm tracking-tight mt-1">
                        {suggestion.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getSeverityBadge(suggestion.severity)}
                  </div>
                </div>

                {/* Description & Fix section */}
                <div className="p-5 space-y-4">
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {suggestion.description}
                  </p>

                  {/* Compare Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5">
                    {/* Before */}
                    <div className="p-4 rounded-xl bg-rose-950/15 border border-rose-900/20 text-xs">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-2">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                        原始畫面痛點 (Before)
                      </div>
                      <p className="text-slate-300 leading-relaxed font-medium">
                        {suggestion.before}
                      </p>
                    </div>

                    {/* After */}
                    <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-900/20 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        建議優化手法 (After)
                      </div>
                      <p className="text-slate-300 leading-relaxed font-medium">
                        {suggestion.after}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
