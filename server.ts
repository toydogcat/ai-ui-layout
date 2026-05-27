import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini SDK with User-Agent for AI Studio telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit to handle high-resolution image base64 uploads
  app.use(express.json({ limit: "30mb" }));

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route - UI Layout & Color Optimization Analysis
  app.post("/api/optimize-ui", async (req, res) => {
    try {
      const { image, mimeType } = req.body;

      if (!image || !mimeType) {
        return res.status(400).json({ error: "Missing image data or mimeType" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured in environment variables." });
      }

      // Prepare image object for Gemini SDK
      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: image,
        },
      };

      const systemInstruction = `You are a world-class UI/UX Design Specialist, Art Director, and Frontend Architect.
Your task is to analyze the uploaded UI design and provide actionable spacing, layout, typography, accessibility, and color optimizations.
All user-facing text, critiques, titles, descriptions, before/after states, theme names, and wireframe contents MUST be written in high-quality, professional Traditional Chinese (Taiwan, 台灣繁體中文).

Specifically:
1. Deeply analyze the visual structure, layout hierarchy, alignment, whitespace, typography sizing, contrast, and accessibility (WCAG 2.1 contrast guidelines).
2. Extract the actual dominant 4 to 8 colors containing their HEX code, descriptive name, layout role, and percentage.
3. Formulate 4 to 6 critical, prioritized design optimize suggestions (severity high/medium/low) with precise before and after descriptions in design language.
4. Construct an optimized layout 'reconstructedWireframe' consisting of 3 to 6 block elements (with columns, header, hero, etc.) detailing correct paddings, margins, contents, and layout rules that solve the visual flaws of the upload.
5. Create 3 jaw-dropping, cohesive alternative theme color conversion palettes (one clean modern light theme, one luxurious sleek dark theme, and one creative distinctive accented theme) mapping original colors to elegant, high-class alternative HEX values, along with visual Tailwind classes to help developers copy.`;

      const promptPart = `Please inspect this captured UI mockup or layout design screenshot:
1. Critically evaluate spacing, grid alignment, hierarchy, readability, and contrast problems.
2. Formulate beautiful solutions. Use professional Taiwan Traditional Chinese (台灣繁體中文).
3. Do not output anything other than a clean, valid JSON matching the requested responseSchema. Ensure hex colors are precise.`;

      // API call using gemini-3.5-flash with structured JSON output responseSchema
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [imagePart, { text: promptPart }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2, // low temperature for highly structured, precise analytical output
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              generalReview: {
                type: Type.STRING,
                description: "對此畫面設計優勢與劣勢的整體專業評論，3至5句話，語意優美細緻。"
              },
              extractedColors: {
                type: Type.ARRAY,
                description: "從畫面中提取的 4 到 8 個主要代表顏色 (Dominant Colors)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hex: { type: Type.STRING, description: "顏色 16 進位碼，格式如 #2563EB" },
                    name: { type: Type.STRING, description: "設計用色命名（例如：'主品牌科技藍'、'背景微光灰'）" },
                    ratio: { type: Type.INTEGER, description: "色佔比（1 至 100 區間）" },
                    role: { type: Type.STRING, description: "該顏色在 UI 扮演的角色與說明（例如：'按鈕主視覺色'、'輔助邊框色'）" },
                    isDark: { type: Type.BOOLEAN, description: "此色是否屬於深色系（以便適配前景文字顏色）" }
                  },
                  required: ["hex", "name", "ratio", "role", "isDark"]
                }
              },
              suggestions: {
                type: Type.ARRAY,
                description: "具體的版面、留白、對齊、字體、可存取性優化清單（建議 4 到 6 個）",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: "類別代碼只能是: 'layout', 'typography', 'color', 'accessibility', 'spacing'" },
                    title: { type: Type.STRING, description: "優化項標題，如：'主視覺讀取阻礙 - 留白過大'" },
                    description: { type: Type.STRING, description: "詳細成因與 UX 影響分析" },
                    severity: { type: Type.STRING, description: "嚴重等級只能是: 'high', 'medium', 'low'" },
                    before: { type: Type.STRING, description: "原圖中觀察到的不良現象" },
                    after: { type: Type.STRING, description: "優化建議執行的具體修改對齊、留白或尺寸基準" }
                  },
                  required: ["category", "title", "description", "severity", "before", "after"]
                }
              },
              reconstructedWireframe: {
                type: Type.ARRAY,
                description: "一套基於優化理念全新規劃的排版線框藍圖（結構性區塊，最多 6 個學術性或高度模組化的組件）",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "唯一代碼，例如 'box-1'" },
                    type: { type: Type.STRING, description: "組件類別限制在: 'header', 'hero', 'gallery', 'form', 'sidebar', 'card', 'footer', 'navigation', 'generic'" },
                    label: { type: Type.STRING, description: "優化後的組件名稱，例如：'高對比首頁英雄看板 (Centered Hero)'" },
                    alignment: { type: Type.STRING, description: "排版與對齊細部規範，例如：'水平置中 max-w-4xl，內部文字左對齊襯托點擊行為'" },
                    optimalSpacing: { type: Type.STRING, description: "推薦之留白 padding, margin 與 gap 規範，例如：'Padding 32px, 元素安全間距(Gap) 16px'" },
                    colorRole: { type: Type.STRING, description: "推薦綁定之主題色角色: 'background', 'primary', 'secondary', 'accent', 'text', 'card-bg'" },
                    contents: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "此組件內部包含之改進版控制項清單"
                    }
                  },
                  required: ["id", "type", "label", "alignment", "optimalSpacing", "colorRole", "contents"]
                }
              },
              colorConversions: {
                type: Type.ARRAY,
                description: "轉換配方：為當前提取色提供 3 套高級風格調色盤轉換對照方案（主題名如 '北歐森林極簡'、'奢華石墨黑曜'）",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "簡單編號如 'convert-nordic'" },
                    themeName: { type: Type.STRING, description: "風格方案名稱，如'北歐靜謐灰綠調'" },
                    description: { type: Type.STRING, description: "風格描述與意境解釋" },
                    colors: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "原色名稱標記" },
                          originalHex: { type: Type.STRING, description: "對應原提取 HEX 色碼" },
                          newHex: { type: Type.STRING, description: "全新轉換之 HEX 色碼（精準質感微調）" },
                          role: { type: Type.STRING, description: "設計功用角色（例如：'主按鈕背景'）" },
                          tailwindClass: { type: Type.STRING, description: "建議之 Tailwind 配對類名（例如：'bg-[#10b981]' 或是 'text-[#0f172a]'）" }
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
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini.");
      }

      // Return clean JSON
      const parsedData = JSON.parse(responseText);
      res.json(parsedData);

    } catch (error: any) {
      console.error("UI Optimization Error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze design image." });
    }
  });

  // Setup Vite Dev server or Serve static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Development fallback mounted via Vite middleware mode.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
