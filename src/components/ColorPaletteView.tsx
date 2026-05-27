import React, { useState } from "react";
import { Copy, Check, Palette, ArrowRight, Eye, RefreshCw, Download, FileJson } from "lucide-react";
import { ExtractedColor, AlternativeTheme } from "../types";

interface ColorPaletteViewProps {
  extractedColors: ExtractedColor[];
  colorConversions: AlternativeTheme[];
  selectedThemeId: string;
  onThemeSelect: (themeId: string) => void;
}

export default function ColorPaletteView({
  extractedColors,
  colorConversions,
  selectedThemeId,
  onThemeSelect
}: ColorPaletteViewProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 2000);
    });
  };

  const handleExportFigma = () => {
    const selectedTheme = colorConversions.find(t => t.id === selectedThemeId) || colorConversions[0];
    
    // Create Figma Variables JSON structure
    const figmaData = {
      version: "1.0.0",
      name: `UI Optimizer - ${selectedTheme.themeName}`,
      collections: [
        {
          name: "Brand Colors",
          modes: [{ modeId: "default", name: "Default" }],
          variables: extractedColors.map(c => ({
            name: `extracted/${c.name}`,
            type: "COLOR",
            valuesByMode: { default: c.hex },
            description: c.role
          }))
        },
        {
          name: "Theme Tokens",
          modes: [{ modeId: "theme", name: selectedTheme.themeName }],
          variables: selectedTheme.colors.map(c => ({
            name: `theme/${c.name}`,
            type: "COLOR",
            valuesByMode: { theme: c.newHex },
            description: c.role
          }))
        }
      ]
    };

    const blob = new Blob([JSON.stringify(figmaData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `figma-variables-${selectedTheme.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedTheme = colorConversions.find(t => t.id === selectedThemeId) || colorConversions[0];

  return (
    <div className="w-full bg-[#131B2E] rounded-2xl border border-slate-800/85 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-950/60 text-blue-450 rounded-xl">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="text-slate-100 font-bold text-lg font-sans">色彩分析與高級樣式轉換</h3>
            <p className="text-slate-400 text-xs">智能提取代表用色，並推薦 3 款具設計意境的轉換調色盤</p>
          </div>
        </div>

        <button
          onClick={handleExportFigma}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all shadow-sm"
        >
          <FileJson size={14} className="text-blue-400" />
          導出 Figma Variables
        </button>
      </div>

      {/* Grid: Dominant Colors on top, conversion presets below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Dominant Colors List (Left/Upper) */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            畫面中提取的主代表色 ({extractedColors.length})
          </h4>
          
          <div className="space-y-2.5">
            {extractedColors.map((color, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-850 bg-[#1e293b]/45 hover:bg-[#1e293b]/70 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg shadow-sm border border-slate-700/50 relative flex items-center justify-center cursor-pointer overflow-hidden transition-transform group-hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => copyToClipboard(color.hex)}
                  >
                    <span className={`text-[9px] font-bold tracking-tight opacity-0 group-hover:opacity-100 transition-opacity ${color.isDark ? 'text-white/80' : 'text-slate-800/80'}`}>
                      {copiedHex === color.hex ? "已複製" : "複製"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-200 text-sm leading-none">{color.name}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-350 px-1.5 py-0.5 rounded font-mono font-medium">
                        {color.ratio}%
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">{color.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400 font-semibold">{color.hex}</span>
                  <button
                    onClick={() => copyToClipboard(color.hex)}
                    className="p-1.5 text-slate-300 hover:text-slate-100 bg-[#1e293b] border border-slate-800 hover:border-slate-700 rounded-lg shadow-xs opacity-0 group-hover:opacity-100 transition-all font-mono"
                    title="複製色碼"
                  >
                    {copiedHex === color.hex ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Theme Conversion View (Right/Lower) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              點擊切換 3 套專業升級風格調色盤
            </h4>
            
            {/* Presets Selection Row */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {colorConversions.map((theme) => {
                const isActive = theme.id === selectedThemeId;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onThemeSelect(theme.id)}
                    className={`p-3 rounded-xl border text-left transition-all duration-300 relative flex flex-col justify-between h-24 shadow-xs
                      ${isActive 
                        ? "border-blue-500 bg-blue-950/30 shadow-sm ring-1 ring-blue-500" 
                        : "border-slate-800 hover:border-slate-700 bg-[#0B0F19]/60 hover:bg-[#1e293b]/45"
                      }
                    `}
                  >
                    <div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1 inline-block ${isActive ? 'bg-blue-900/50 text-blue-300' : 'bg-slate-800 text-slate-400'}`}>
                        方案 {theme.id === "convert-nordic" ? "A" : theme.id === "convert-dark" ? "B" : "C"}
                      </span>
                      <div className="text-xs font-bold text-slate-200 line-clamp-1">{theme.themeName}</div>
                    </div>
                    
                    {/* Circle Swatches Preview */}
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {theme.colors.slice(0, 4).map((c, idx) => (
                        <div 
                          key={idx} 
                          className="w-4 h-4 rounded-full border border-slate-900 shadow-xs" 
                          style={{ backgroundColor: c.newHex }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* active Theme details */}
            {selectedTheme && (
              <div className="p-4 rounded-2xl bg-[#0F172E]/60 border border-slate-800/70 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{selectedTheme.themeName}</span>
                    <span className="text-[10px] text-slate-400 leading-none">轉換調色方案</span>
                  </div>
                  <p className="text-slate-350 text-xs mt-1 leading-relaxed">
                    {selectedTheme.description}
                  </p>
                </div>

                {/* Color-to-Color Conversion Mapping */}
                <div className="space-y-2">
                  <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">
                    <span className="col-span-4">原色與功用</span>
                    <span className="col-span-1"></span>
                    <span className="col-span-7">建議升級新用色 (HEX & Tailwind)</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                    {selectedTheme.colors.map((color, idx) => (
                      <div 
                        key={idx} 
                        className="grid grid-cols-12 items-center bg-[#1e293b]/40 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors group"
                      >
                        {/* Original Section */}
                        <div className="col-span-4 flex items-center gap-2 overflow-hidden">
                          <div 
                            className="w-5 h-5 rounded-md border border-slate-700 shrink-0" 
                            style={{ backgroundColor: color.originalHex }}
                          />
                          <div className="truncate">
                            <div className="text-xs font-semibold text-slate-200 truncate line-clamp-1">{color.name}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{color.originalHex}</span>
                          </div>
                        </div>

                        {/* Arrows */}
                        <div className="col-span-1 flex justify-center text-slate-500">
                          <ArrowRight size={12} />
                        </div>

                        {/* Converted Section */}
                        <div className="col-span-7 flex items-center justify-between pl-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div 
                              className="w-5 h-5 rounded-md border border-slate-700/50 shrink-0" 
                              style={{ backgroundColor: color.newHex }}
                            />
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-100 font-mono leading-none">{color.newHex}</span>
                                <span className="text-[9px] text-blue-400 bg-blue-950 px-1 py-0.5 rounded scale-90 origin-left">
                                  {color.tailwindClass}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-450 line-clamp-1">{color.role}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => copyToClipboard(color.newHex)}
                            className="p-1 text-slate-400 hover:text-slate-200 bg-slate-800/60 rounded hover:bg-slate-700 transition-colors"
                            title="複製新 HEX"
                          >
                            {copiedHex === color.newHex ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
