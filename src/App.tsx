import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Image as ImageIcon, RefreshCw, Layers, ArrowRight, Palette, AlertCircle } from "lucide-react";
import ImageUploader from "./components/ImageUploader";
import ColorPaletteView from "./components/ColorPaletteView";
import SuggestionsView from "./components/SuggestionsView";
import WireframePreview from "./components/WireframePreview";
import InteractiveOverlay from "./components/InteractiveOverlay";
import { OptimizationResult, AlternativeTheme, DesignSuggestion } from "./types";
import { extractDominantColors, generateAlternativeThemes } from "./utils/colorClustering";
import { analyzeLayout, OcrItem } from "./utils/layoutAnalyzer";

// High quality static Taiwan Traditional Chinese demo dataset for immediate demo visualization
const DEMO_OPTIMIZATION_RESULT: OptimizationResult = {
  generalReview: "此頁面在功能架構上具備極致現代的 SaaS 風格，元件意圖明確。然而在幾何對齊、元素呼吸感（Spacing）和網格對齊（Grid Alignment）上略顯鬆散。尤其是頂部導航 Logo 與核心主內容在橫向上有 8px 雜音偏差，且卡片內部間距留白不對稱，導致使用者在快速掃視時容易產生視覺疲勞。若能導入標準 8px 格柵系統，對齊垂直中線並重新微調色階，將大幅提升易讀性、質感與行動點轉換率。",
  extractedColors: [
    { hex: "#0B0F19", name: "曜石極致黑", ratio: 52, role: "主要背景與側邊導航基調色", isDark: true },
    { hex: "#00E5FF", name: "極光霓虹藍", ratio: 15, role: "主打行動點 (CTA) 與亮點強調色", isDark: false },
    { hex: "#1A2333", name: "深藍碳晶灰", ratio: 15, role: "次要卡片與容器托底色", isDark: true },
    { hex: "#F8FAFC", name: "純淨微光白", ratio: 10, role: "主體文字與高亮字形排版色", isDark: false },
    { hex: "#64748B", name: "霧霾灰石灰", ratio: 8, role: "次要排版、欄位說明文字", isDark: false }
  ],
  suggestions: [
    {
      category: "layout",
      title: "垂直欄位與導航線未對齊",
      description: "左側側邊導航選單 Logo 與右側核心內容看板的左側對齊線有微小偏差，打破了網格系統的連續性，降低了頁面對齊的精準度與工業感設計品質。",
      severity: "medium",
      before: "側邊欄定位點與卡片邊界參差不齊，光流走向分散。",
      after: "強制靠齊至縱向對齊線 (X: 260px)，以建立強烈的視覺網格基準線。"
    },
    {
      category: "spacing",
      title: "主看板內部垂直間距留白不一致",
      description: "三個數據分析卡片之間的垂直對應留白不對稱。「Total Users」卡片下方與線條的間距過窄，而「Performance Analytics」的間距過寬，造成版面留白雜亂。",
      severity: "high",
      before: "卡片垂直間隙不對稱，視覺出現無序多變的像素留白。",
      after: "統一收斂為 8px 或 16px 的倍數間隙，確保各模組間有通透的呼吸深度。"
    },
    {
      category: "accessibility",
      title: "亮白標籤文字與底色之高對比檢測未過關",
      description: "部分高亮標籤文字與主要底色（曜石極致黑）的對比度僅為 3.5:1，低於無障礙設計標準（WCAG 2.1 AA 級大於 4.5:1 的要求），閱讀吃力。",
      severity: "high",
      before: "在長輩或室外高背光環境下，文字與底色邊界模糊、難以看清。",
      after: "更換文字為極亮白 (#F8FAFC)，使色彩對比度高於 8.5:1，保證極高的易讀性。"
    },
    {
      category: "typography",
      title: "標題與內文字體層級模糊",
      description: "主標題「Dashboard」字體高度與次要卡片指標文字過於相近，缺乏清晰的字級對比（Typography Hierarchy），不利於用戶快速掃描。",
      severity: "low",
      before: "各區塊字重與高度接近，導致導讀流動碎裂。",
      after: "主標題設定為 26px Bold，次要標籤與副文本縮小至 14px，拉開視覺層次差距。"
    }
  ],
  reconstructedWireframe: [
    {
      id: "wf-nav",
      type: "header",
      label: "極簡對齊頂部導航列 (Standard Grid Header)",
      alignment: "水平滿寬 w-full，左右 padding 48px，左右元件分散對齊 (justify-between & items-center)",
      optimalSpacing: "高度規範於 64px, 元素安全間隔(Gap)為 16px",
      colorRole: "background",
      contents: ["系統徽標 Logo", "一級主題切換列", "個人頭像選單", "全域搜尋框"]
    },
    {
      id: "wf-hero",
      type: "hero",
      label: "主動式優化行動英雄看板 (Action Hero Canopy)",
      alignment: "水平置中限寬 max-w-6xl，內部排版改為左對齊配右側形象卡片",
      optimalSpacing: "Padding 全拉大至 48px, 與下方元件相距 margin-bottom 32px",
      colorRole: "primary",
      contents: ["大字重引人入勝標題 (24px Bold)", "呼應 CTA 按鈕 (Padding 12px 24px)", "輔助說明標籤快取"]
    },
    {
      id: "wf-body",
      type: "card",
      label: "標準化呼吸度三欄卡片模組 (Clean 3-Column Card Grid)",
      alignment: "網格排版系統 grid-cols-1 md:grid-cols-3，安全間距 gap-6 強制等寬對稱",
      optimalSpacing: "卡片邊界 Padding 24px (p-6), 子元件間隔 Gap 12px",
      colorRole: "card-bg",
      contents: ["核心數據看盤", "即時回饋清單", "互動式分析指標元件"]
    },
    {
      id: "wf-footer",
      type: "footer",
      label: "頁尾聲明區 (Footer Area)",
      alignment: "水平居中對齊",
      optimalSpacing: "內邊距: 24px | 垂直間距: 8px",
      colorRole: "background",
      contents: ["© 2026 版權聲明 | 隱私權政策"]
    }
  ],
  colorConversions: [
    {
      id: "convert-nordic",
      themeName: "北歐冰川 (Nordic Arctic)",
      description: "以冰晶藍為品牌亮點，搭配大氣石墨灰背景與純潔雪地白文字，散發北歐現代極簡與高階冷感美學。",
      colors: [
        { name: "主要背景底色", originalHex: "#0B0F19", newHex: "#0D1527", role: "升級為深沉極簡底色，營造專業視覺空間", tailwindClass: "bg-[#0b0f19]" },
        { name: "主體文字與排版色", originalHex: "#F8FAFC", newHex: "#E2E8F0", role: "升級為高亮文字，加強對比度以提升易讀性", tailwindClass: "text-slate-100" },
        { name: "品牌焦點與 CTA 按鈕色", originalHex: "#00E5FF", newHex: "#2AD1D6", role: "精選時尚亮色，凸顯主要點擊與重要按鈕", tailwindClass: "bg-blue-500" },
        { name: "次要卡片與容器底色", originalHex: "#1A2333", newHex: "#17233B", role: "卡片與表單的背景托底色，劃分視覺層級", tailwindClass: "bg-[#131b2e]" },
        { name: "邊框線條與分割線色", originalHex: "#64748B", newHex: "#223354", role: "細緻中性邊界線，保持結構清晰度", tailwindClass: "border-slate-800" }
      ]
    },
    {
      id: "convert-dark",
      themeName: "石墨炭黑 (Carbon Noir)",
      description: "專為高端暗色介面設計，以濃郁炭黑及無光澤石墨為基調，搭配炫光極光綠按鈕，展現極致科技感與專業感。",
      colors: [
        { name: "主要背景底色", originalHex: "#0B0F19", newHex: "#08080C", role: "升級為深沉極簡底色，營造專業視覺空間", tailwindClass: "bg-[#0b0f19]" },
        { name: "主體文字與排版色", originalHex: "#F8FAFC", newHex: "#F8FAFC", role: "升級為高亮文字，加強對比度以提升易讀性", tailwindClass: "text-slate-100" },
        { name: "品牌焦點與 CTA 按鈕色", originalHex: "#00E5FF", newHex: "#10B981", role: "精選時尚亮色，凸顯主要點擊與重要按鈕", tailwindClass: "bg-blue-500" },
        { name: "次要卡片與容器底色", originalHex: "#1A2333", newHex: "#12121A", role: "卡片與表單的背景托底色，劃分視覺層級", tailwindClass: "bg-[#131b2e]" },
        { name: "邊框線條與分割線色", originalHex: "#64748B", newHex: "#1E293B", role: "細緻中性邊界線，保持結構清晰度", tailwindClass: "border-slate-800" }
      ]
    },
    {
      id: "convert-glow",
      themeName: "溫慢落日 (Sunset Glow)",
      description: "以暖沙土色和落日餘暉橙為核心，極富溫度感的暖色系配置，營造溫馨、親切且奢華的人文設計格調。",
      colors: [
        { name: "主要背景底色", originalHex: "#0B0F19", newHex: "#171212", role: "升級為深沉極簡底色，營造專業視覺空間", tailwindClass: "bg-[#0b0f19]" },
        { name: "主體文字與排版色", originalHex: "#F8FAFC", newHex: "#FFF7ED", role: "升級為高亮文字，加強對比度以提升易讀性", tailwindClass: "text-slate-100" },
        { name: "品牌焦點與 CTA 按鈕色", originalHex: "#00E5FF", newHex: "#F97316", role: "精選時尚亮色，凸顯主要點擊與重要按鈕", tailwindClass: "bg-blue-500" },
        { name: "次要卡片與容器底色", originalHex: "#1A2333", newHex: "#241C1C", role: "卡片與表單的背景托底色，劃分視覺層級", tailwindClass: "bg-[#131b2e]" },
        { name: "邊框線條與分割線色", originalHex: "#64748B", newHex: "#3E2E2E", role: "細緻中性邊界線，保持結構清晰度", tailwindClass: "border-slate-800" }
      ]
    }
  ]
};

const DEMO_OCR_RESULTS: OcrItem[] = [
  { text: "Dashboard", confidence: 0.99, box: { x: 242, y: 152, width: 147, height: 26 } },
  { text: "+ New Project", confidence: 0.99, box: { x: 794, y: 144, width: 135, height: 36 } },
  { text: "Analytics", confidence: 0.98, box: { x: 98, y: 202, width: 75, height: 18 } },
  { text: "Total Users", confidence: 0.99, box: { x: 260, y: 220, width: 90, height: 18 } },
  { text: "3,458", confidence: 0.99, box: { x: 260, y: 250, width: 92, height: 32 } },
  { text: "Monthly Revenue", confidence: 0.99, box: { x: 495, y: 220, width: 130, height: 18 } },
  { text: "$145,290", confidence: 0.99, box: { x: 495, y: 250, width: 154, height: 32 } },
  { text: "Active Sessions", confidence: 0.99, box: { x: 730, y: 220, width: 120, height: 18 } },
  { text: "1,892", confidence: 0.99, box: { x: 730, y: 250, width: 92, height: 32 } },
  { text: "Performance Analytics", confidence: 0.97, box: { x: 260, y: 486, width: 200, height: 22 } },
  { text: "Total traffic", confidence: 0.98, box: { x: 733, y: 538, width: 78, height: 16 } },
  { text: "Page views", confidence: 0.98, box: { x: 835, y: 538, width: 78, height: 16 } }
];

const DET_MODEL_URL = "https://huggingface.co/tobytoy/yolo_base_home/resolve/main/paddle/ch_PP-OCRv4_det_infer.onnx";
const REC_MODEL_URL = "https://huggingface.co/tobytoy/yolo_base_home/resolve/main/paddle/ch_PP-OCRv4_rec_infer.onnx";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<
    "idle" | "loading-det" | "loading-rec" | "initializing" | "running-ocr" | "analyzing"
  >("idle");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatusText, setLoadingStatusText] = useState("");

  const [result, setResult] = useState<OptimizationResult | null>(DEMO_OPTIMIZATION_RESULT);
  const [activeThemeId, setActiveThemeId] = useState<string>("convert-nordic");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for interactive SVG overlays
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = useState(1000);
  const [naturalHeight, setNaturalHeight] = useState(1000);
  const [analysisScale, setAnalysisScale] = useState(1);
  const [ocrResults, setOcrResults] = useState<OcrItem[]>(DEMO_OCR_RESULTS);
  const [activeSuggestion, setActiveSuggestion] = useState<DesignSuggestion | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  const workerRef = useRef<Worker | null>(null);
  const pendingInitResolve = useRef<((w: Worker) => void) | null>(null);
  const pendingRecognizeResolve = useRef<((results: OcrItem[]) => void) | null>(null);
  const pendingReject = useRef<((err: Error) => void) | null>(null);

  // Set default preview image on component load
  useEffect(() => {
    setPreviewUrl(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/demo_ui.png`);
  }, []);

  // Fetch file with progress tracking
  const fetchWithProgress = async (url: string, onProgress: (progress: number) => void): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`無法下載模型檔案: ${response.statusText}`);

    const contentLength = response.headers.get("content-length");
    if (!contentLength) {
      return await response.arrayBuffer();
    }

    const total = parseInt(contentLength, 10);
    let loaded = 0;

    const reader = response.body?.getReader();
    if (!reader) {
      return await response.arrayBuffer();
    }

    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;
        onProgress(Math.round((loaded / total) * 100));
      }
    }

    const allChunks = new Uint8Array(loaded);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }
    return allChunks.buffer;
  };

  // Fetch with Cache Storage integration
  const getModelWithCache = async (url: string, onProgress: (progress: number) => void): Promise<ArrayBuffer> => {
    const cacheName = "ui-optimizer-model-cache";
    if ("caches" in window) {
      try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          onProgress(100);
          console.log("[App] Cache Hit for:", url);
          return await cachedResponse.arrayBuffer();
        }

        console.log("[App] Cache Miss. Downloading:", url);
        const buffer = await fetchWithProgress(url, onProgress);

        // Put in cache for next loads - use slice to keep a copy for cache since it might be transferred
        await cache.put(url, new Response(buffer.slice(0)));
        return buffer;
      } catch (err) {
        console.warn("[App] Cache Storage failure, falling back to direct fetch...", err);
      }
    }

    return await fetchWithProgress(url, onProgress);
  };

  // Initialize PaddleOCR Web Worker
  const initWorker = async (): Promise<Worker> => {
    if (workerRef.current) return workerRef.current;

    const detBuffer = await getModelWithCache(DET_MODEL_URL, (p) => {
      setLoadingStage("loading-det");
      setLoadingStatusText("正在下載 OCR 幾何偵測模型 (PP-OCRv4)...");
      setLoadingProgress(p);
    });

    const recBuffer = await getModelWithCache(REC_MODEL_URL, (p) => {
      setLoadingStage("loading-rec");
      setLoadingStatusText("正在下載 OCR 文字辨識模型...");
      setLoadingProgress(p);
    });

    setLoadingStage("initializing");
    setLoadingStatusText("正在載入文字字典配置檔...");
    setLoadingProgress(30);
    const dictUrl = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/paddle/ppocr_keys_v1.txt`;
    const dictRes = await fetch(dictUrl);
    if (!dictRes.ok) throw new Error("無法讀取字典檔案");
    const dictContent = await dictRes.text();

    setLoadingProgress(60);
    setLoadingStatusText("正在建立 100% 離線 WebAssembly 執行緒...");

    return new Promise((resolve, reject) => {
      pendingInitResolve.current = resolve;
      pendingReject.current = reject;

      console.log("[App] Instantiating ocr-worker...");
      const worker = new Worker(new URL("./ocr-worker.js", import.meta.url), { type: "module" });

      worker.onmessage = (e) => {
        const { type, data } = e.data;
        if (type === "status") {
          setLoadingStatusText(data);
        } else if (type === "initialized") {
          console.log("[App] Worker successfully initialized.");
          workerRef.current = worker;
          pendingInitResolve.current?.(worker);
        } else if (type === "result") {
          pendingRecognizeResolve.current?.(data.results || []);
        } else if (type === "error") {
          pendingReject.current?.(new Error(data));
        }
      };

      worker.postMessage(
        {
          type: "init",
          data: { detBuffer, recBuffer, dictContent },
        },
        [detBuffer, recBuffer]
      );
    });
  };

  // Broadcast scroll state to parent iframe
  useEffect(() => {
    let lastScrollY = 0;
    const scrollThreshold = 8;

    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      if (Math.abs(currentScrollY - lastScrollY) < scrollThreshold && currentScrollY > 10) return;

      const direction = currentScrollY > lastScrollY ? "down" : "up";

      window.parent.postMessage(
        {
          type: "iframe_scroll",
          scrollY: currentScrollY,
          direction: direction,
        },
        "*"
      );

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reload vercount visitors count on result updates
  useEffect(() => {
    // @ts-ignore
    if (window.vercount && typeof window.vercount.fetch === "function") {
      // @ts-ignore
      window.vercount.fetch();
    }
  }, [result]);

  // Main Upload and offline analysis engine
  const handleImageUploaded = async (base64Data: string, mimeType: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setPreviewUrl(base64Data);

    try {
      // 1. Parse Image natural dimensions and draw on canvas
      setLoadingStage("initializing");
      setLoadingStatusText("正在讀取圖片像素格式...");
      setLoadingProgress(0);

      const img = new Image();
      const imgLoadedPromise = new Promise<{ width: number; height: number; imageData: ImageData; scale: number }>(
        (resolve, reject) => {
          img.onload = () => {
            const nWidth = img.naturalWidth;
            const nHeight = img.naturalHeight;
            
            // Detect Retina/High-res images and scale down for analysis performance
            // But we keep original natural dimensions for the final SVG overlay rendering
            const ANALYSIS_MAX_WIDTH = 1280;
            const scale = nWidth > 2500 ? ANALYSIS_MAX_WIDTH / nWidth : 1;
            
            const width = Math.round(nWidth * scale);
            const height = Math.round(nHeight * scale);
            
            setNaturalWidth(nWidth);
            setNaturalHeight(nHeight);
            setAnalysisScale(scale);

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Canvas 2D Context 無法載入"));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            resolve({ width, height, imageData, scale });
          };
          img.onerror = () => reject(new Error("上傳圖片解析失敗"));
        }
      );
      img.src = base64Data;

      const { width, height, imageData, scale } = await imgLoadedPromise;

      // 2. Perform client-side K-Means Color Clustering
      setLoadingStatusText("正在進行 K-Means 色彩聚類提取...");
      setLoadingProgress(40);
      const extractedColors = extractDominantColors(imageData, 5);

      // 3. Initialize & spin up PaddleOCR WASM Worker
      const worker = await initWorker();

      // 4. Run layout OCR detection
      setLoadingStage("running-ocr");
      setLoadingStatusText("正在進行離線圖形文字識別 (OCR)...");
      setLoadingProgress(80);

      const ocrPromise = new Promise<OcrItem[]>((resolve, reject) => {
        pendingRecognizeResolve.current = resolve;
        pendingReject.current = reject;
      });

      worker.postMessage({
        type: "recognize",
        data: {
          imageData: imageData.data,
          width: width,
          height: height,
        },
      });

      const ocrItems = await ocrPromise;
      setOcrResults(ocrItems);

      // 5. Run Layout Geometry Alignments and Margins Heuristics Engine
      setLoadingStage("analyzing");
      setLoadingStatusText("正在進行幾何網格與對齊偏差分析...");
      setLoadingProgress(95);

      const layoutAnalysis = analyzeLayout(ocrItems, width, height, extractedColors);

      // 6. Compile and display final result
      const finalResult: OptimizationResult = {
        generalReview: layoutAnalysis.generalReview,
        extractedColors: extractedColors,
        suggestions: layoutAnalysis.suggestions,
        reconstructedWireframe: layoutAnalysis.reconstructedWireframe,
        colorConversions: generateAlternativeThemes(extractedColors),
      };

      setResult(finalResult);
      if (finalResult.colorConversions.length > 0) {
        setActiveThemeId(finalResult.colorConversions[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "離線分析發生錯誤，請重新上傳嘗試。");
    } finally {
      setIsLoading(false);
      setLoadingStage("idle");
    }
  };

  const handleResetToDemo = () => {
    setResult(DEMO_OPTIMIZATION_RESULT);
    setOcrResults(DEMO_OCR_RESULTS);
    setPreviewUrl(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/demo_ui.png`);
    setNaturalWidth(1000);
    setNaturalHeight(1000);
    setActiveThemeId("convert-nordic");
    setErrorMsg(null);
  };

  const selectedTheme = result?.colorConversions.find((t) => t.id === activeThemeId) || null;

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
                <span className="bg-indigo-900/65 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-indigo-800/80">
                  v3.0 100% 離線版
                </span>
              </div>
              <p className="text-xs text-slate-400">
                前端 100% 本地運算！無須 API 金鑰，使用 ONNX WASM PaddleOCR 與 K-Means 進行幾何對齊診斷
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-3 py-1.5 rounded-full font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              本地安全隱私防護 (100% Secure)
            </span>

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
              <p className="font-bold">診斷執行提示：</p>
              <p className="text-rose-400 mt-1 leading-relaxed text-xs">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Section 1: Dashboard Top Control & Visual Mockup */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Actions & Configuration */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#131B2E] border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-slate-100 font-bold text-base flex items-center gap-1.5">
                  <ImageIcon size={16} className="text-indigo-400" />
                  <span>分析目標畫面</span>
                </h2>
                {result !== DEMO_OPTIMIZATION_RESULT && (
                  <button
                    onClick={handleResetToDemo}
                    className="text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    重設為示範
                  </button>
                )}
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                您可以點擊或拖放上傳一張 SaaS、網站或手機 App 截圖。瀏覽器將直接在本地執行 AI
                文字邊界偵測與 K-Means 色彩聚類。
              </p>

              <ImageUploader onImageSelected={handleImageUploaded} isLoading={isLoading} />

              {previewUrl && (
                <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[#0B0F19]/50 border border-slate-800/40 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        id="toggle-overlay"
                        type="checkbox"
                        checked={showOverlay}
                        onChange={(e) => setShowOverlay(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-800 rounded focus:ring-blue-500 focus:ring-offset-slate-900 focus:ring-1 cursor-pointer"
                      />
                      <label htmlFor="toggle-overlay" className="text-slate-300 cursor-pointer font-semibold select-none">
                        顯示智能對齊與留白導引線
                      </label>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950 px-2 py-0.5 rounded border border-indigo-900/30">
                      {ocrResults.length} 個區域偵測
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 leading-normal">
                    滑鼠移至右側圖面標記可查看像素高寬，點擊可直接複製文字內容。
                  </p>
                </div>
              )}
            </div>

            {/* Static UX Tips card */}
            <div className="bg-gradient-to-br from-indigo-950 to-blue-900 border border-slate-850/60 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 font-bold text-9xl select-none -mr-10 -mb-10 font-sans">
                UI
              </div>
              <span className="bg-blue-800/80 text-blue-200 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mb-3 uppercase tracking-wider">
                100% 離線隱私保證
              </span>
              <h3 className="text-sm font-bold mb-1.5 leading-snug">幾何與色彩的黃金律</h3>
              <p className="text-blue-100/85 text-xs leading-relaxed">
                網頁排版中細微的對齊缺失、段落間距不對稱，都會引起潛意識的閱讀疲勞。本系統採用
                PaddleOCR 抓取幾何特徵，利用 K-Means 演算法在三維 RGB 空間進行色彩歸類，為您量身打造極具美感的 Nord
                與 Carbon 配色轉換方案。
              </p>
            </div>
          </div>

          {/* Right Column: Visual Mockup Canvas & Design Critique */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 1. Interactive Visual Mockup Canvas */}
            {previewUrl && (
              <div className="bg-[#131B2E] border border-slate-800/85 rounded-2xl p-5 shadow-md flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
                  <span className="text-[10px] text-indigo-400 font-bold tracking-wider uppercase font-mono">
                    ● 智能交互式視覺畫布 (Interactive Visual Canvas)
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded font-mono">
                    圖片解析: {naturalWidth}px × {naturalHeight}px
                  </span>
                </div>

                {/* Relative Image + SVG Bounding Box overlay */}
                <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-[#0B0F19] flex justify-center items-center p-4">
                  <div className="relative w-full max-w-[500px]">
                    <img
                      src={previewUrl}
                      alt="Interactive Layout Mockup"
                      className="w-full h-auto object-contain rounded-lg max-h-[500px] select-none pointer-events-none"
                    />
                    <InteractiveOverlay
                      ocrResults={ocrResults}
                      naturalWidth={naturalWidth}
                      naturalHeight={naturalHeight}
                      analysisScale={analysisScale}
                      activeSuggestion={activeSuggestion}
                      showOverlay={showOverlay}
                    />                  </div>
                </div>
              </div>
            )}

            {/* 2. Visual Critique Summary */}
            {result && (
              <div className="bg-[#131B2E] border border-slate-800/85 text-slate-100 rounded-2xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                  <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase font-mono">
                    ● AI 幾何演算法審查評論 (Offline Grid Review)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-900/40 px-2.5 py-1 rounded">
                    離線檢測完成 (100% Local)
                  </span>
                </div>

                <p className="text-slate-200 text-sm md:text-base leading-relaxed tracking-wide italic font-serif pl-4 border-l-2 border-indigo-500/85">
                  「 {result.generalReview} 」
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/85">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 font-mono block">EXTRACTED DOMINANT</span>
                    <strong className="text-slate-350 font-mono text-lg">
                      {result.extractedColors.length} 個主要用色
                    </strong>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 font-mono block">SUGGESTED IMPROVEMENTS</span>
                    <strong className="text-slate-350 font-mono text-lg">
                      {result.suggestions.length} 項排版警告
                    </strong>
                  </div>
                </div>
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
              <SuggestionsView
                suggestions={result.suggestions}
                activeSuggestion={activeSuggestion}
                onHoverSuggestion={(s) => setActiveSuggestion(s)}
              />
            </section>

            {/* Reconstructed Wireframe visualizer */}
            <section id="layout-reconstruction">
              <WireframePreview wireframe={result.reconstructedWireframe} activeTheme={selectedTheme} />
            </section>
          </div>
        )}
      </main>

      {/* Model downloading progressive modal */}
      {isLoading && loadingStage !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />

          {/* Progress Modal Content */}
          <div className="relative bg-[#131B2E] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden text-center space-y-6">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>

            <div className="space-y-2">
              <h4 className="text-slate-100 font-bold text-base leading-snug">{loadingStatusText}</h4>
              <p className="text-slate-400 text-xs leading-normal">
                第一次分析將自動在瀏覽器中安全下載約 20MB 的 PaddleOCR ONNX 深度學習模型，下載後將永久快取於本地，下次分析無需再次下載。
              </p>
            </div>

            {/* Progress Bar */}
            {loadingStage !== "initializing" && loadingStage !== "analyzing" && (
              <div className="space-y-1">
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>下載狀態</span>
                  <span>{loadingProgress}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0B0F19] border-t border-slate-850/60 py-6 px-6 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} UI Layout & Color Optimizer. 基於 PaddleOCR WASM 本地排版診斷引擎。</p>
          <div className="flex items-center gap-4 text-slate-400 bg-slate-900/40 px-4 py-2 rounded-full border border-slate-800/40 shadow-inner">
            <span>
              全站總瀏覽:{" "}
              <span id="vercount_value_site_pv" className="font-semibold text-indigo-400 font-mono">
                --
              </span>{" "}
              次
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>
              訪客蒞臨:{" "}
              <span id="vercount_value_site_uv" className="font-semibold text-indigo-400 font-mono">
                --
              </span>{" "}
              人
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
