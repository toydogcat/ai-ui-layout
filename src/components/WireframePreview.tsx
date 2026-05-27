import React, { useState } from "react";
import { 
  Layout, 
  Layers, 
  HelpCircle, 
  ExternalLink, 
  Maximize2, 
  Grid, 
  Heading, 
  Menu, 
  Image as ImageIcon, 
  Footprints, 
  CheckSquare, 
  User, 
  Activity,
  Compass,
  Search,
  ChevronRight,
  Bell,
  MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WireframeElement, AlternativeTheme } from "../types";

interface WireframePreviewProps {
  wireframe: WireframeElement[];
  activeTheme: AlternativeTheme | null;
}

export default function WireframePreview({ wireframe, activeTheme }: WireframePreviewProps) {
  const [viewMode, setViewMode] = useState<"blueprint" | "mockup">("blueprint");
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  // Helper to map colorRole to safe Tailwind styles based on the activeTheme colors
  const getThemeColorStyles = (role: string, type: "bg" | "text" | "border") => {
    if (!activeTheme) {
      // Fallback colors if no active theme
      const fallbacks: Record<string, { bg: string, text: string, border: string }> = {
        background: { bg: "#f8fafc", text: "#0f172a", border: "#e2e8f0" },
        primary: { bg: "#2563eb", text: "#ffffff", border: "#1d4ed8" },
        secondary: { bg: "#475569", text: "#ffffff", border: "#334155" },
        accent: { bg: "#f59e0b", text: "#0f172a", border: "#d97706" },
        text: { bg: "transparent", text: "#0f172a", border: "transparent" },
        "card-bg": { bg: "#ffffff", text: "#1e293b", border: "#e2e8f0" }
      };
      return fallbacks[role]?.[type] || fallbacks.background[type];
    }

    // Try to find matching color in activeTheme
    const lcRole = role.toLowerCase();
    let matchedColor = activeTheme.colors.find(c => {
      const cRole = c.role.toLowerCase();
      return cRole.includes(lcRole) || lcRole.includes(cRole);
    });

    // If still not matched, fallback on index heuristics
    if (!matchedColor) {
      if (lcRole === "background") matchedColor = activeTheme.colors.find(c => c.role.toLowerCase().includes("bg") || c.role.toLowerCase().includes("背景")) || activeTheme.colors[0];
      else if (lcRole === "primary") matchedColor = activeTheme.colors.find(c => c.role.toLowerCase().includes("primary") || c.role.toLowerCase().includes("主")) || activeTheme.colors[1];
      else if (lcRole === "accent") matchedColor = activeTheme.colors.find(c => c.role.toLowerCase().includes("accent") || c.role.toLowerCase().includes("強")) || activeTheme.colors[2];
      else if (lcRole === "card-bg") matchedColor = activeTheme.colors.find(c => c.role.toLowerCase().includes("card") || c.role.toLowerCase().includes("卡")) || activeTheme.colors[0];
      else matchedColor = activeTheme.colors[2] || activeTheme.colors[0];
    }

    const hexValue = matchedColor?.newHex || "#cbd5e1";

    if (type === "bg") return hexValue;
    if (type === "text") {
      // Return contrast color based on isDark (roughly approximated)
      if (matchedColor) {
        // Use standard contrast logic
        return hexToLuma(hexValue) > 165 ? "#0f172a" : "#ffffff";
      }
      return "#0f172a";
    }
    return hexValue;
  };

  // Helper to check relative color tone
  const hexToLuma = (hex: string) => {
    const c = hex.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b; // luma
  };

  // Icon selector based on Wireframe type
  const getWireframeIcon = (type: string) => {
    switch (type) {
      case "header": return <Menu size={16} className="text-slate-400" />;
      case "hero": return <Compass size={16} className="text-slate-400" />;
      case "gallery": return <ImageIcon size={16} className="text-slate-400" />;
      case "form": return <CheckSquare size={16} className="text-slate-400" />;
      case "sidebar": return <Layout size={16} className="text-slate-400" />;
      case "card": return <Layers size={16} className="text-slate-400" />;
      case "footer": return <Footprints size={16} className="text-slate-400" />;
      case "navigation": return <Activity size={16} className="text-slate-400" />;
      default: return <Grid size={16} className="text-slate-400" />;
    }
  };

  // Render specialized mockup components
  const renderMockupComponent = (el: WireframeElement) => {
    const bg = getThemeColorStyles(el.colorRole, "bg");
    const text = getThemeColorStyles(el.colorRole, "text");
    const accent = getThemeColorStyles("accent", "bg");
    const accentText = getThemeColorStyles("accent", "text");
    const isDarkBg = hexToLuma(getThemeColorStyles("background", "bg")) < 120;
    const borderColor = isDarkBg ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

    switch (el.type) {
      case "header":
      case "navigation":
        return (
          <div key={el.id} className="w-full flex items-center justify-between px-6 py-4 rounded-xl border" style={{ backgroundColor: bg, color: text, borderColor }}>
            <div className="flex items-center gap-6">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">L</div>
              <div className="hidden md:flex items-center gap-4">
                {el.contents.slice(0, 4).map((item, i) => (
                  <span key={i} className="text-[10px] font-bold opacity-70 hover:opacity-100 cursor-pointer">{item}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Search size={14} className="opacity-60" />
              <Bell size={14} className="opacity-60" />
              <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600"></div>
            </div>
          </div>
        );
      
      case "hero":
        return (
          <div key={el.id} className="w-full flex flex-col items-center text-center py-12 px-6 rounded-2xl border" style={{ backgroundColor: bg, color: text, borderColor }}>
            <div className="max-w-xl space-y-4">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                {el.contents[0] || "智能設計未來"}
              </h2>
              <p className="text-xs md:text-sm opacity-70 max-w-md mx-auto leading-relaxed">
                {el.contents[1] || "利用 100% 瀏覽器端離線運算，為您的介面提供專業的對齊診斷與精準配色建議。"}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button className="px-5 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2" style={{ backgroundColor: accent, color: accentText }}>
                  立即開始探索 <ChevronRight size={14} />
                </button>
                <button className="px-5 py-2 rounded-lg text-xs font-bold border border-current opacity-70 hover:opacity-100 transition-opacity">
                  查看展示影片
                </button>
              </div>
            </div>
          </div>
        );

      case "card":
        return (
          <div key={el.id} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border p-4 space-y-3 transition-transform hover:-translate-y-1" style={{ backgroundColor: bg, color: text, borderColor }}>
                <div className="w-full aspect-video rounded-xl bg-slate-800/50 flex items-center justify-center opacity-40">
                  <ImageIcon size={24} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold">{el.contents[i-1] || `精選組件 ${i}`}</h4>
                  <div className="h-1.5 w-full bg-current opacity-10 rounded-full"></div>
                  <div className="h-1.5 w-3/4 bg-current opacity-10 rounded-full"></div>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono opacity-50">#design_tok</span>
                  <MoreHorizontal size={14} className="opacity-40" />
                </div>
              </div>
            ))}
          </div>
        );

      case "form":
        return (
          <div key={el.id} className="max-w-md mx-auto w-full p-6 rounded-2xl border space-y-4" style={{ backgroundColor: bg, color: text, borderColor }}>
            <div className="space-y-1">
              <h3 className="text-sm font-bold">{el.label}</h3>
              <p className="text-[10px] opacity-60">請填寫下方資訊以繼續您的優化之旅</p>
            </div>
            <div className="space-y-3">
              {[0, 1].map(i => (
                <div key={i} className="space-y-1.5">
                  <label className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{el.contents[i] || "輸入欄位"}</label>
                  <div className="w-full h-9 rounded-lg border bg-black/5 flex items-center px-3 text-[10px] opacity-40" style={{ borderColor: 'rgba(128,128,128,0.2)' }}>
                    在此輸入...
                  </div>
                </div>
              ))}
              <button className="w-full h-9 rounded-lg text-xs font-bold mt-2" style={{ backgroundColor: accent, color: accentText }}>
                確認送出
              </button>
            </div>
          </div>
        );

      case "footer":
        return (
          <div key={el.id} className="w-full flex flex-col md:flex-row items-center justify-between px-6 py-8 rounded-xl border border-t-2" style={{ backgroundColor: bg, color: text, borderColor }}>
            <div className="flex flex-col gap-2 mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">L</div>
                <span className="text-[10px] font-bold tracking-tight">UI Optimizer</span>
              </div>
              <p className="text-[9px] opacity-50">© 2026 Crafted with Passion by Toymsi</p>
            </div>
            <div className="flex gap-8">
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold opacity-40 uppercase">Resources</span>
                {["Github", "Documentation", "Pricing"].map(t => <span key={t} className="text-[9px] opacity-70 cursor-pointer">{t}</span>)}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold opacity-40 uppercase">Company</span>
                {["About", "Blog", "Contact"].map(t => <span key={t} className="text-[9px] opacity-70 cursor-pointer">{t}</span>)}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div key={el.id} className="rounded-xl p-4 border" style={{ backgroundColor: bg, color: text, borderColor }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">{el.label}</span>
              <span className="text-[9px] font-mono opacity-40">{el.type}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {el.contents.map((c, i) => (
                <div key={i} className="px-2 py-1 rounded bg-black/5 border border-black/5 text-[10px] opacity-70">
                  {c}
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-[#131B2E] rounded-2xl border border-slate-800/80 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-800/60">
        <div>
          <h3 className="text-slate-100 font-bold text-lg font-sans">最適化版面重構 (Layout Blueprint)</h3>
          <p className="text-slate-400 text-xs">AI 依據黃金分割與留白對齊學對該畫面重寫的結構化 HTML/CSS 線框提案</p>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex bg-[#0B0F19]/60 p-1 rounded-xl border border-slate-800/50 self-start">
          <button
            onClick={() => setViewMode("blueprint")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all
              ${viewMode === "blueprint" 
                ? "bg-[#1e293b] text-blue-400 shadow-xs ring-1 ring-black/10" 
                : "text-slate-400 hover:text-slate-200"
              }
            `}
          >
            <Grid size={13} />
            線框結構藍圖
          </button>
          <button
            onClick={() => setViewMode("mockup")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all
              ${viewMode === "mockup" 
                ? "bg-[#1e293b] text-blue-400 shadow-xs ring-1 ring-black/10" 
                : "text-slate-400 hover:text-slate-200"
              }
            `}
          >
            <Layers size={13} />
            高階用色模擬
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Main interactive Canvas */}
        <div className="xl:col-span-8">
          <div className="bg-slate-950 rounded-2xl p-6 min-h-[480px] shadow-inner relative flex flex-col justify-start overflow-hidden">
            
            {/* Browser frame decoration */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="text-[10px] text-slate-500 ml-2 font-mono select-none">AI Optimized UI Layout viewport</span>
              </div>
              <div className="px-3 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono w-48 text-center truncate">
                {activeTheme ? `theme://${activeTheme.id}` : "layout://reconstructed"}
              </div>
            </div>

            {/* Wireframe contents */}
            <AnimatePresence mode="wait">
              {viewMode === "blueprint" ? (
                // 1. Blueprint View Mode
                <motion.div 
                  key="blueprint"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 flex-1 flex flex-col justify-center"
                >
                  {wireframe.map((el) => {
                    const isHovered = hoveredElementId === el.id;
                    return (
                      <div
                        key={el.id}
                        onMouseEnter={() => setHoveredElementId(el.id)}
                        onMouseLeave={() => setHoveredElementId(null)}
                        className={`relative rounded-xl border border-dashed p-4 transition-all duration-300
                          ${isHovered 
                            ? "border-amber-400 bg-amber-500/5 shadow-md shadow-amber-500/5 -translate-y-0.5" 
                            : "border-slate-800 hover:border-slate-700 bg-slate-900/30"
                          }
                        `}
                      >
                        {/* Top labels */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getWireframeIcon(el.type)}
                            <span className={`text-xs font-bold font-sans ${isHovered ? 'text-amber-300' : 'text-slate-300'}`}>{el.label}</span>
                            <span className="text-[9px] font-mono uppercase bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                              {el.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono italic">
                            {el.optimalSpacing}
                          </span>
                        </div>

                        {/* Align rules */}
                        <div className="text-[10px] text-slate-400 mb-3 leading-snug bg-slate-950/40 p-2 rounded border border-slate-900 font-mono">
                          <span className="text-slate-500">對齊與留白學：</span>
                          {el.alignment}
                        </div>

                        {/* Content items mock (inside block) */}
                        <div className="flex flex-wrap gap-1.5">
                          {el.contents.map((item, idy) => (
                            <span 
                              key={idy} 
                              className="text-[10px] font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-1 rounded transition-colors"
                            >
                              + {item}
                            </span>
                          ))}
                        </div>

                        {/* Info overlay tooltip indicators on Blueprint hover */}
                        {isHovered && (
                          <div className="absolute -top-3.5 right-6 bg-slate-900 border border-amber-500/50 text-[10px] font-bold text-amber-300 px-2.5 py-1 rounded-md shadow-lg pointer-events-none animate-bounce">
                            {el.optimalSpacing}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                // 2. High Class Mockup View Mode
                <motion.div 
                  key="mockup"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="rounded-xl p-4 flex-1 flex flex-col justify-start overflow-y-auto overflow-x-hidden shadow-2xl custom-scrollbar"
                  style={{ backgroundColor: getThemeColorStyles("background", "bg") }}
                >
                  <div className="space-y-6 w-full max-w-4xl mx-auto">
                    {wireframe.map((el) => renderMockupComponent(el))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Info/Specs Panel */}
        <div className="xl:col-span-4 space-y-4">
...
          </div>
        </div>

        {/* Sidebar Info/Specs Panel */}
        <div className="xl:col-span-4 space-y-4">
          <div className="p-4 rounded-xl bg-[#0B0F19]/60 border border-slate-800/70">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span>佈置對齊幾何規範</span>
            </h4>
            <div className="space-y-4">
              {wireframe.map((el) => {
                const isHovered = hoveredElementId === el.id;
                return (
                  <div 
                    key={el.id} 
                    className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer text-left
                      ${isHovered 
                        ? "bg-[#1e293b]/70 border-amber-500/60 shadow-sm" 
                        : "bg-transparent border-transparent hover:bg-slate-800/30"
                      }
                    `}
                    onMouseEnter={() => setHoveredElementId(el.id)}
                    onMouseLeave={() => setHoveredElementId(null)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1 rounded ${isHovered ? 'bg-amber-950/50 text-amber-400' : 'bg-[#1e293b] text-slate-400'}`}>
                        {getWireframeIcon(el.type)}
                      </div>
                      <span className="text-xs font-bold text-slate-200 line-clamp-1">{el.label}</span>
                    </div>
                    
                    <ul className="text-[10px] text-slate-400 space-y-0.5 pl-5 list-disc leading-normal mt-1.5">
                      <li>對齊：{el.alignment}</li>
                      <li>間距：{el.optimalSpacing}</li>
                      <li>色彩角色：{el.colorRole}</li>
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800/60 bg-[#0B0F19]/60">
            <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
              對齊率加成
            </span>
            <p className="text-xs text-slate-400 leading-relaxed mt-2">
              這套線框是依照 <strong className="text-slate-200">8px 增量網格系統 (8pt grid scale)</strong> 規劃。將畫面內原本渙散的留白、未定位對齊的核心組件全部導正為標準框架，能有效優化轉化率並大幅減低前端工程拆解程式的複雜度。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
