import React, { useState, useEffect } from "react";
import { Sparkles, Image as ImageIcon, CheckCircle, RefreshCw, Layers, ArrowRight, ShieldAlert, Palette, AlertCircle, Key, X, Lock } from "lucide-react";
import ImageUploader from "./components/ImageUploader";
import ColorPaletteView from "./components/ColorPaletteView";
import SuggestionsView from "./components/SuggestionsView";
import WireframePreview from "./components/WireframePreview";
import { OptimizationResult, AlternativeTheme } from "./types";

// High quality static Taiwan Traditional Chinese demo dataset for immediate demo visualization
const DEMO_OPTIMIZATION_RESULT: OptimizationResult = {
  generalReview: "此頁面在功能架構上具備現代 SaaS 風格，元件意圖明確。然而在視覺平衡、元素呼吸感（Spacing）和網格對齊（Grid Alignment）上略顯鬆散。尤其是主橫幅部分文字邊緣與背景高亮色對比較低，卡片邊距不均，導致使用者在快速掃視時容易產生視覺疲勞。若能導入 8px 增量格柵系統，對齊垂直中線並重新微調色階，將大幅提升易讀性、高貴感與行動點點擊轉化率。",
  extractedColors: [
    { hex: "#0F172A", name: "極曜深夜藍", ratio: 45, role: "主要背景與側邊導航基調色", isDark: true },
    { hex: "#2563EB", name: "經典科技藍", ratio: 20, role: "主打行動點 (CTA) 與高亮強調色", isDark: true },
    { hex: "#64748B", name: "微風岩石灰", ratio: 15, role: "次要標題、欄位說明文字", isDark: false },
    { hex: "#10B981", name: "極光翡翠綠", ratio: 12, role: "數據圖表增長與成功狀態提示色", isDark: false },
    { hex: "#F8FAFC", name: "北極雲霧白", ratio: 8, role: "資訊卡片底色與次級背景分線", isDark: false }
  ],
  suggestions: [
    {
      category: "spacing",
      title: "主看板內部安全防衛間距不足（Padding）",
      description: "主內容卡片內的 Padding 目前估計為隨機的 12px，使關鍵標題、段落與卡片外框線產生粘連，干擾視覺聚焦，降低品牌的高級格調。",
      severity: "high",
      before: "元件間距過窄，使用者感到擁擠、窒息、訊息混亂。",
      after: "導入標準 24px (p-6) 全內外留白，確保邊緣到核心資訊具備合乎常規的呼吸深度。"
    },
    {
      category: "layout",
      title: "垂直欄位與導航線未對齊",
      description: "左側側邊導航 Logo 與核心主內容在橫向上偏移了近 8px 雜音，打破了網格的連續性，降低了頁面的對齊精準度與工業感設計品質。",
      severity: "medium",
      before: "定位點參差不齊，多出不必要的邊角間隔，干擾光流走向。",
      after: "利用 Flex 佈局強制 items-center 對齊，或將其固定至 max-w-7xl 對齊骨架上。"
    },
    {
      category: "accessibility",
      title: "高彩綠色與亮白底色之高對比檢測未過關",
      description: "提示成功狀態的翡翠綠 (#10B981) 在北極雲霧白卡片底色上直接疊加，對比度僅為 3.1:1，未達 WCAG 2.1 的 4.5:1 AA 級對比建議標準。",
      severity: "high",
      before: "長輩或高亮背光環境下的使用者將難以看清內容。",
      after: "建議將白色底色上的文字改用更黑的深祖母綠 (#065F46) 或替換為帶有淡綠背景色塊的複合標籤。"
    },
    {
      category: "typography",
      title: "主標題與副段落視覺字形層級不明顯",
      description: "此畫面的標題與一般段落文字皆採用了相似的 15px/16px，視覺層級（Typography Hierarchy）太過微弱，使用者無法第一秒掌握閱讀重心。",
      severity: "low",
      before: "各區塊看似一樣重要，導致導讀流動零碎。",
      after: "調整主標為 20px / bold，副段落設為 14px / slate-500，以拉開視覺張力差距。"
    }
  ],
  reconstructedWireframe: [
    {
      id: "box-header",
      type: "header",
      label: "極簡對齊頂部導航列 (Standard Grid Header)",
      alignment: "水平滿寬 w-full，左右 padding 48px，左右元件分散對齊 (justify-between & items-center)",
      optimalSpacing: "高度規範於 64px, 元素安全間隔(Gap)為 16px",
      colorRole: "background",
      contents: ["系統徽標 Logo", "一級主題切換列", "個人頭像選單", "全域搜尋框"]
    },
    {
      id: "box-hero",
      type: "hero",
      label: "主動式優化行動英雄看板 (Action Hero Canopy)",
      alignment: "水平置中限寬 max-w-6xl，內部排版改為左對齊配右側形象卡片",
      optimalSpacing: "Padding 全拉大至 48px, 與下方元件相距 margin-bottom 32px",
      colorRole: "primary",
      contents: ["大字重引人入勝標題 (24px Bold)", "呼應 CTA 按鈕 (Padding 12px 24px)", "輔助說明標籤快取"]
    },
    {
      id: "box-grid",
      type: "card",
      label: "標準化呼吸度三欄卡片模組 (Clean 3-Column Card Grid)",
      alignment: "網格排版系統 grid-cols-1 md:grid-cols-3，安全間距 gap-6 強制等寬對稱",
      optimalSpacing: "卡片邊界 Padding 24px (p-6), 子元件間隔 Gap 12px",
      colorRole: "card-bg",
      contents: ["核心數據看盤", "即時回饋清單", "互動式分析指標元件"]
    }
  ],
  colorConversions: [
    {
      id: "convert-nordic",
      themeName: "北歐岩石極簡 (Sage & Stone)",
      description: "以冰島天然火山岩為靈感，結合淡鼠尾草綠與晨霧灰，去蕪存菁。提供高雅、自然、極低視覺壓力的乾淨明亮感，完美適合需要專注的核心工具與閱讀型 SaaS。",
      colors: [
        { name: "曜黑主底", originalHex: "#0F172A", newHex: "#F1F5F9", role: "背景底色", tailwindClass: "bg-[#F1F5F9]" },
        { name: "主打強調藍", originalHex: "#2563EB", newHex: "#1E3A8A", role: "核心按鈕/焦點", tailwindClass: "bg-[#1E3A8A] text-white" },
        { name: "微風岩灰", originalHex: "#64748B", newHex: "#475569", role: "次要標題文字", tailwindClass: "text-[#475569]" },
        { name: "翡翠亮綠", originalHex: "#10B981", newHex: "#0F766E", role: "狀態色調/增長標記", tailwindClass: "text-[#0F766E]" },
        { name: "雲霧白底板", originalHex: "#F8FAFC", newHex: "#FFFFFF", role: "卡片底色與區塊板", tailwindClass: "bg-white" }
      ]
    },
    {
      id: "convert-dark",
      themeName: "深碳極光奢華 (Aurora Obsidian)",
      description: "專為極致科技感開發的星曜黑色基底，融入略帶溫潤的深木炭黑底盤，配合具備呼吸透光感的極光霓虹翠。擁有極高的弱光舒適度，呈現高科技、專業、沉浸式的設計語彙。",
      colors: [
        { name: "曜黑主底", originalHex: "#0F172A", newHex: "#0B0F17", role: "星空深夜極曜背景", tailwindClass: "bg-[#0B0F17]" },
        { name: "主打強調藍", originalHex: "#2563EB", newHex: "#3B82F6", role: "發光行動點", tailwindClass: "bg-[#3B82F6]" },
        { name: "微風岩灰", originalHex: "#64748B", newHex: "#94A3B8", role: "主副標題文字", tailwindClass: "text-[#94A3B8]" },
        { name: "翡翠亮綠", originalHex: "#10B981", newHex: "#34D399", role: "霓虹亮點/進程色", tailwindClass: "text-[#34D399]" },
        { name: "雲霧白底板", originalHex: "#F8FAFC", newHex: "#1E2530", role: "卡片黑色板底", tailwindClass: "bg-[#1E2530]" }
      ]
    },
    {
      id: "convert-neon",
      themeName: "日落香檳暖沙調 (Desert Sunset Champagne)",
      description: "以暖沙色、香檳金、微暈日落橙、大地陶瓦構成的輕奢溫柔暖调。打破科技冰冷感，注入極富生命與藝術感的生活溫度，適合高級品牌、沙龍、生活美學與高端電商平台。",
      colors: [
        { name: "曜黑主底", originalHex: "#0F172A", newHex: "#FAF6F0", role: "香檳沙礫主背景", tailwindClass: "bg-[#FAF6F0]" },
        { name: "主打強調藍", originalHex: "#2563EB", newHex: "#C27854", role: "暖陶行動與焦點", tailwindClass: "bg-[#C27854]" },
        { name: "微風岩灰", originalHex: "#64748B", newHex: "#5C564F", role: "主要文字用色", tailwindClass: "text-[#5C564F]" },
        { name: "翡翠亮綠", originalHex: "#10B981", newHex: "#B45309", role: "點綴性提示色盤", tailwindClass: "text-[#B45309]" },
        { name: "雲霧白底板", originalHex: "#F8FAFC", newHex: "#FFFDFC", role: "溫和高淨度卡片", tailwindClass: "bg-[#FFFDFC]" }
      ]
    }
  ]
};

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(DEMO_OPTIMIZATION_RESULT);
  const [activeThemeId, setActiveThemeId] = useState<string>("convert-nordic");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sleek Settings Modal and API Key states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("gemini_api_key") || "";
  });

  // Section II: parent-child iframe scroll broadcast protocol
  useEffect(() => {
    let lastScrollY = 0;
    const scrollThreshold = 8; // 靈敏度門檻，防微小抖動
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold && currentScrollY > 10) return;
      
      // 判斷滾動方向
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';
      
      // 向母窗口廣播滾動狀態
      window.parent.postMessage({
        type: 'iframe_scroll',
        scrollY: currentScrollY,
        direction: direction
      }, '*');
      
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Section IV: SPA action change trigger for Vercount visitor count reload
  useEffect(() => {
    // @ts-ignore
    if (window.vercount && typeof window.vercount.fetch === 'function') {
      // @ts-ignore
      window.vercount.fetch();
    }
  }, [result]);

  // Handle the uploaded image analysis trigger
  const handleImageUploaded = async (base64Data: string, mimeType: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Strip base64 header if included by FileReader
      const base64Clean = base64Data.split(",")[1] || base64Data;
      let parsedResult: OptimizationResult;

      // Try calling local mock/dev backend if running on localhost and no client key is set
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      
      if (isLocalhost && !apiKey) {
        try {
          const response = await fetch("/api/optimize-ui", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image: base64Clean,
              mimeType: mimeType,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Analysis failed on local server");
          }

          parsedResult = await response.json();
        } catch (localErr: any) {
          console.warn("Local server call failed. Falling back to client-side API direct call if key is set...", localErr);
          throw localErr;
        }
      } else {
        // Online deployment or explicitly configured key -> Call Gemini directly from browser
        if (!apiKey) {
          setIsSettingsOpen(true);
          throw new Error("請先點擊右上角「API 金鑰設定」設定您的 Google Gemini API 金鑰以在線上進行 AI 診斷分析！");
        }

        const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const schema = {
          type: "OBJECT",
          properties: {
            generalReview: {
              type: "STRING",
              description: "對此畫面設計優勢與劣勢的整體專業評論，3至5句話，語意優美細緻。"
            },
            extractedColors: {
              type: "ARRAY",
              description: "從畫面中提取的 4 到 8 個主要代表顏色 (Dominant Colors)",
              items: {
                type: "OBJECT",
                properties: {
                  hex: { type: "STRING", description: "顏色 16 進位碼，格式如 #2563EB" },
                  name: { type: "STRING", description: "設計用色命名（例如：'主品牌科技藍'、'背景微光灰'）" },
                  ratio: { type: "INTEGER", description: "色佔比（1 至 100 區間）" },
                  role: { type: "STRING", description: "該顏色在 UI 扮演的角色與說明（例如：'按鈕主視覺色'、'輔助邊框色'）" },
                  isDark: { type: "BOOLEAN", description: "此色是否屬於深色系（以便適配前景文字顏色）" }
                },
                required: ["hex", "name", "ratio", "role", "isDark"]
              }
            },
            suggestions: {
              type: "ARRAY",
              description: "具體的版面、留白、對齊、字體、可存取性優化清單（建議 4 到 6 個）",
              items: {
                type: "OBJECT",
                properties: {
                  category: { type: "STRING", description: "類別代碼只能是: 'layout', 'typography', 'color', 'accessibility', 'spacing'" },
                  title: { type: "STRING", description: "優化項標題，如：'主視覺讀取阻礙 - 留白過大'" },
                  description: { type: "STRING", description: "詳細成因與 UX 影響分析" },
                  severity: { type: "STRING", description: "嚴重等級只能是: 'high', 'medium', 'low'" },
                  before: { type: "STRING", description: "原圖中觀察到的不良現象" },
                  after: { type: "STRING", description: "優化建議執行的具體修改對齊、留白或尺寸基準" }
                },
                required: ["category", "title", "description", "severity", "before", "after"]
              }
            },
            reconstructedWireframe: {
              type: "ARRAY",
              description: "一套基於優化理念全新規劃的排版線框藍圖（結構性區塊，最多 6 個學術性或高度模組化的組件）",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING", description: "唯一代碼，例如 'box-1'" },
                  type: { type: "STRING", description: "組件類別限制在: 'header', 'hero', 'gallery', 'form', 'sidebar', 'card', 'footer', 'navigation', 'generic'" },
                  label: { type: "STRING", description: "優化後的組件名稱，例如：'高對比首頁英雄看板 (Centered Hero)'" },
                  alignment: { type: "STRING", description: "排版與對齊細部規範，例如：'水平置中 max-w-4xl，內部文字左對齊襯托點擊行為'" },
                  optimalSpacing: { type: "STRING", description: "推薦之留白 padding, margin 與 gap 規範，例如：'Padding 32px, 元素安全間距(Gap) 16px'" },
                  colorRole: { type: "STRING", description: "推薦綁定之主題色角色: 'background', 'primary', 'secondary', 'accent', 'text', 'card-bg'" },
                  contents: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "此組件內部包含之改進版控制項清單"
                  }
                },
                required: ["id", "type", "label", "alignment", "optimalSpacing", "colorRole", "contents"]
              }
            },
            colorConversions: {
              type: "ARRAY",
              description: "轉換配方：為當前提取色提供 3 套高級風格調色盤轉換對照方案（主題名如 '北歐森林極簡'、'奢華石墨黑曜'）",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING", description: "簡單編號如 'convert-nordic'" },
                  themeName: { type: "STRING", description: "風格方案名稱，如'北歐靜謐灰綠調'" },
                  description: { type: "STRING", description: "風格描述與意境解釋" },
                  colors: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        name: { type: "STRING", description: "原色名稱標記" },
                        originalHex: { type: "STRING", description: "對應原提取 HEX 色碼" },
                        newHex: { type: "STRING", description: "全新轉換之 HEX 色碼（精準質感微調）" },
                        role: { type: "STRING", description: "設計功用角色（例如：'主按鈕背景'）" },
                        tailwindClass: { type: "STRING", description: "建議之 Tailwind 配對類名（例如：'bg-[#10b981]' 或是 'text-[#0f172a]'）" }
                      },
                      required: ["name", "originalHex", "newHex", "role", "tailwindClass"]
                    }
                  }
                },
                required: ["id", "themeName", "description", "colors"]
              }
            }
          },
          required: ["generalReview", "extractedColors", "suggestions", "reconstructedWireframe", "colorConversions"]
        };

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Clean,
                    },
                  },
                  {
                    text: `Please inspect this captured UI mockup or layout design screenshot:
1. Critically evaluate spacing, grid alignment, hierarchy, readability, and contrast problems.
2. Formulate beautiful solutions. Use professional Taiwan Traditional Chinese (台灣繁體中文).
3. Do not output anything other than a clean, valid JSON matching the requested responseSchema. Ensure hex colors are precise.`,
                  },
                ],
              },
            ],
            systemInstruction: {
              parts: [
                {
                  text: `You are a world-class UI/UX Design Specialist, Art Director, and Frontend Architect.
Your task is to analyze the uploaded UI design and provide actionable spacing, layout, typography, accessibility, and color optimizations.
All user-facing text, critiques, titles, descriptions, before/after states, theme names, and wireframe contents MUST be written in high-quality, professional Traditional Chinese (Taiwan, 台灣繁體中文).

Specifically:
1. Deeply analyze the visual structure, layout hierarchy, alignment, whitespace, typography sizing, contrast, and accessibility (WCAG 2.1 contrast guidelines).
2. Extract the actual dominant 4 to 8 colors containing their HEX code, descriptive name, layout role, and percentage.
3. Formulate 4 to 6 critical, prioritized design optimize suggestions (severity high/medium/low) with precise before and after descriptions in design language.
4. Construct an optimized layout 'reconstructedWireframe' consisting of 3 to 6 block elements (with columns, header, hero, etc.) detailing correct paddings, margins, contents, and layout rules that solve the visual flaws of the upload.
5. Create 3 jaw-dropping, cohesive alternative theme color conversion palettes (one clean modern light theme, one luxurious sleek dark theme, and one creative distinctive accented theme) mapping original colors to elegant, high-class alternative HEX values, along with visual Tailwind classes to help developers copy.`,
                },
              ],
            },
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: schema,
              temperature: 0.2,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = "Gemini API 呼叫失敗";
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error?.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const responseJson = await response.json();
        const responseText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
          throw new Error("Gemini API 回傳空內容");
        }

        parsedResult = JSON.parse(responseText);
      }

      setResult(parsedResult);
      
      // Auto assign the first generated theme ID if available
      if (parsedResult.colorConversions && parsedResult.colorConversions.length > 0) {
        setActiveThemeId(parsedResult.colorConversions[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "上傳分析發生未知錯誤，請確認您的 API 金鑰已設定。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDemo = () => {
    setResult(DEMO_OPTIMIZATION_RESULT);
    setActiveThemeId("convert-nordic");
    setErrorMsg(null);
  };

  const selectedTheme = result?.colorConversions.find(t => t.id === activeThemeId) || null;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Elegantly Polished Minimal Header with Trad-Chinese localization */}
      <header className="bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-800/90 py-5 px-6 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-100 text-base tracking-wide md:text-lg">
                  UI Layout & Color Optimizer
                </h1>
                <span className="bg-blue-900/65 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-blue-800/80">
                  v2.5 AI
                </span>
              </div>
              <p className="text-xs text-slate-400">上傳設計截圖，自動提取色彩、精準診斷版面與對齊，輸出高級轉換調色盤</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end sm:self-auto">
            {apiKey ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2.5 py-1 rounded-full font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                API 金鑰已設
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2.5 py-1 rounded-full font-mono" title="線上環境必須設定 API 金鑰才能進行分析">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                本機/未設金鑰
              </span>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/60 transition-colors"
            >
              <Key size={13} />
              API 金鑰設定
            </button>

            {result !== DEMO_OPTIMIZATION_RESULT && (
              <button
                onClick={handleResetToDemo}
                className="text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                title="載入標準示範範例"
              >
                <RefreshCw size={13} />
                載入示範版面
              </button>
            )}
            
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-slate-400 hover:text-slate-300 font-semibold flex items-center gap-1"
            >
              Google AI Studio
            </a>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-8">
        
        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-200 text-sm flex gap-3 items-start animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold">分析服務提示：</p>
              <p className="text-rose-400 mt-1 leading-relaxed text-xs">{errorMsg}</p>
              <p className="text-[10px] text-slate-450 mt-2">
                請檢查專案中的 <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-300">Settings &gt; Secrets</code>，確保已正確填入 <code className="bg-slate-900 px-1 py-0.5 rounded font-mono font-bold">GEMINI_API_KEY</code> 並重新嘗試。
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Drag or select image upload area */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-4 space-y-4">
            <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-5 shadow-xs">
              <h2 className="text-slate-100 font-bold text-base mb-1.5 flex items-center gap-1.5">
                <ImageIcon size={16} className="text-indigo-400" />
                <span>分析目標畫面</span>
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed mb-4">
                你可以隨意上傳一張網站 Mockup、App 截圖、或者是正在設計的手稿、Wireframe。AI 將針對畫面進行結構剖析與色相探勘。
              </p>
              <ImageUploader onImageSelected={handleImageUploaded} isLoading={isLoading} />
            </div>

            <div className="bg-gradient-to-br from-indigo-950 to-blue-900 border border-slate-850/60 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
              {/* background vector accent */}
              <div className="absolute right-0 bottom-0 opacity-10 font-bold text-9xl select-none -mr-10 -mb-10 font-sans">
                UI
              </div>
              <span className="bg-blue-800/80 text-blue-200 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mb-3 uppercase tracking-wider">
                設計師思維 (UX Logic)
              </span>
              <h3 className="text-sm font-bold mb-1.5 leading-snug">
                為什麼需要自動優化色彩與網格？
              </h3>
              <p className="text-blue-100/85 text-xs leading-relaxed">
                一個粗糙的 UI 通常僅差在細部對齊。AI 會透過比對先進排版模式，推薦更高級的調色對稱對照組，幫你將普通網站重新塑造為具備北歐簡約、奢華碳黑、或日落暖調的原生大作。
              </p>
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col h-full justify-between">
            {result ? (
              <div className="bg-[#131B2E] border border-slate-800/85 text-slate-100 rounded-2xl p-6 shadow-md flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                    <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase font-mono">
                      ● AI 視覺化評論摘要 (Visual Design critique)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-900/35 border border-emerald-800/30 px-2 py-0.5 rounded">
                      診斷完成 (Success)
                    </span>
                  </div>
                  
                  <p className="text-slate-200 text-sm md:text-base leading-relaxed tracking-wide italic font-serif pl-4 border-l-2 border-indigo-500/85">
                    「 {result.generalReview} 」
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/85">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 font-mono block">EXTRACTED dominant</span>
                    <strong className="text-slate-300 font-mono text-lg">{result.extractedColors.length} 個顏色</strong>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 font-mono block">SUGGESTED improvements</span>
                    <strong className="text-slate-300 font-mono text-lg">{result.suggestions.length} 項深度優化</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full border border-dashed border-slate-800 bg-[#131B2E] rounded-2xl flex flex-col items-center justify-center p-12 text-center text-slate-300">
                <ImageIcon size={48} className="text-slate-600 stroke-[1.2] mb-4" />
                <h3 className="text-slate-200 font-bold text-base mb-1">等待分析...</h3>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                  請於左側上傳一張 UI 設計截圖，或直接進行示範報告解析，查看完整的設計優化回饋。
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Detailed Results showing optimization analyses */}
        {result && (
          <div className="space-y-8 animate-fadeIn duration-500">
            
            {/* Color section */}
            <section id="colors-and-conversions">
              <ColorPaletteView 
                extractedColors={result.extractedColors}
                colorConversions={result.colorConversions}
                selectedThemeId={activeThemeId}
                onThemeSelect={(id) => setActiveThemeId(id)}
              />
            </section>

            {/* Layout suggestions containing side-by-side Before/After cards */}
            <section id="layout-suggestions">
              <SuggestionsView suggestions={result.suggestions} />
            </section>

            {/* Reconstructed Wireframe visualizer */}
            <section id="layout-reconstruction">
              <WireframePreview 
                wireframe={result.reconstructedWireframe}
                activeTheme={selectedTheme}
              />
            </section>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#0B0F19] border-t border-slate-850/60 py-6 px-6 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} UI Layout & Color Optimizer. 基於 Google Gemini-3.5-flash 進階多模態大模型。
          </p>
          <div className="flex items-center gap-4 text-slate-400 bg-slate-900/40 px-4 py-2 rounded-full border border-slate-800/40 shadow-inner">
            <span>全站總瀏覽: <span id="vercount_value_site_pv" className="font-semibold text-indigo-400 font-mono">--</span> 次</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>訪客蒞臨: <span id="vercount_value_site_uv" className="font-semibold text-indigo-400 font-mono">--</span> 人</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsSettingsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-[#131B2E] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scaleUp overflow-hidden">
            {/* Ambient light effect inside modal */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400">
                <Key size={18} />
                <h3 className="font-bold text-slate-100">Google Gemini API 金鑰設定</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-slate-300 text-xs leading-relaxed">
                本項目部署於 GitHub Pages 靜態空間。為了能讓您在線上環境中呼叫 AI 進行客製化 UI 診斷，請設定您個人的 Google Gemini API 金鑰。
              </p>
              
              <div className="bg-slate-950/60 border border-slate-850/80 p-3 rounded-xl text-[11px] text-slate-400 leading-relaxed space-y-1">
                <div className="flex gap-1.5 text-indigo-300 font-semibold mb-1">
                  <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                  安全防護聲明
                </div>
                <p>
                  您的金鑰將僅儲存在您的瀏覽器本機快取 (<code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">localStorage</code>) 中，直接與 Google 官方 API 端點進行點對點通訊，絕不會上傳至任何第三方伺服器，請放心使用。
                </p>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1.5">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  前往 Google AI Studio 獲取免費金鑰
                  <ArrowRight size={10} />
                </a>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("gemini_api_key");
                    setApiKey("");
                    setIsSettingsOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 font-semibold hover:bg-slate-800 transition-colors"
                >
                  清除金鑰
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("gemini_api_key", apiKey);
                    setIsSettingsOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow-md shadow-indigo-600/10"
                >
                  儲存並關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
