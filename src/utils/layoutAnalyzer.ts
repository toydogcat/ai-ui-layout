import { DesignSuggestion, WireframeElement, ExtractedColor } from "../types";

export interface OcrItem {
  text: string;
  confidence: number;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Convert HEX to relative luminance
function getLuminance(hex: string): number {
  const cleanHex = hex.replace(/^#/, "");
  const num = parseInt(cleanHex, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculate contrast ratio between two colors
function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function analyzeLayout(
  ocrResults: OcrItem[],
  imageWidth: number,
  imageHeight: number,
  colors: ExtractedColor[]
): {
  suggestions: DesignSuggestion[];
  reconstructedWireframe: WireframeElement[];
  generalReview: string;
} {
  const suggestions: DesignSuggestion[] = [];
  const items = ocrResults.filter((item) => item.text.trim().length > 0 && item.box.width > 2 && item.box.height > 2);

  // Let's set some default suggestions if there are no OCR elements detected
  if (items.length === 0) {
    return {
      suggestions: [
        {
          category: "layout",
          title: "請上傳清晰的 UI 設計圖截圖",
          description: "未能偵測到頁面文字。請上傳包含文字、按鈕和排版結構的 UI 截圖，以便進行對齊與網格系統分析。",
          severity: "low",
          before: "未載入足夠的圖形或文字特徵",
          after: "載入完整介面後，將自動進行幾何對齊與留白量測"
        },
        {
          category: "color",
          title: "建立主體色彩對比系統",
          description: "預設主底色與文字色彩需要保持足夠對比（建議大於 4.5:1）。點擊下方升級調色盤，可直接應用高級設計方案。",
          severity: "medium",
          before: "未設定對比度標準",
          after: "推薦切換至「北歐冰川 (Nordic Arctic)」或「石墨炭黑 (Carbon Noir)」高亮主題"
        }
      ],
      reconstructedWireframe: [
        {
          id: "wf-1",
          type: "header",
          label: "頂部導覽列 (Navigation Bar)",
          alignment: "左對齊",
          optimalSpacing: "內邊距 (Padding): 16px | 間距 (Gap): 12px",
          colorRole: "primary",
          contents: ["首頁", "服務項目", "關於我們", "聯繫我們"]
        },
        {
          id: "wf-2",
          type: "hero",
          label: "主體焦點橫幅 (Hero Section)",
          alignment: "居中對齊",
          optimalSpacing: "垂直外邊距 (Margin): 48px | 間距: 20px",
          colorRole: "accent",
          contents: ["開啟您的 AI 智能設計之旅", "利用前端 100% 離線 OCR 與 K-Means 色彩算法，快速為您的 UI 進行對齊與配色優化評估。"]
        },
        {
          id: "wf-3",
          type: "footer",
          label: "頁尾資訊區 (Footer Section)",
          alignment: "居中對齊",
          optimalSpacing: "內邊距: 24px",
          colorRole: "background",
          contents: ["© 2026 UI Layout Optimizer. All rights reserved."]
        }
      ],
      generalReview: "未偵測到介面文字內容。請上傳帶有排版和文字資訊的 UI 介面，以啟動離線對齊、網格檢測和視覺層級分析。"
    };
  }

  // --- 1. ALIGNMENT DIAGNOSTICS (對齊分析) ---
  // Group elements by vertical columns to check left alignment
  // We sort by left edge: x
  const sortedByX = [...items].sort((a, b) => a.box.x - b.box.x);
  let alignmentIssuesCount = 0;

  for (let i = 0; i < sortedByX.length - 1; i++) {
    const itemA = sortedByX[i];
    const itemB = sortedByX[i + 1];

    const xDiff = Math.abs(itemA.box.x - itemB.box.x);
    // If elements are close in X (1px to 8px difference) and vertically spaced out
    const verticalOverlap =
      Math.max(0, Math.min(itemA.box.y + itemA.box.height, itemB.box.y + itemB.box.height) - Math.max(itemA.box.y, itemB.box.y));

    if (xDiff > 0 && xDiff <= 8 && verticalOverlap === 0) {
      alignmentIssuesCount++;
      if (alignmentIssuesCount <= Math.min(10, Math.floor(items.length / 3))) {
        suggestions.push({
          category: "layout",
          title: `「${itemA.text.slice(0, 8)}...」左側微小對齊偏差`,
          description: `偵測到 "${itemA.text.slice(0, 10)}" (x: ${itemA.box.x}px) 與 "${itemB.text.slice(0, 10)}" (x: ${itemB.box.x}px) 橫向起點僅差 ${xDiff}px。這會造成輕微的視覺參差感。`,
          severity: xDiff >= 5 ? "medium" : "low",
          before: `兩個元件的左側起點相差了 ${xDiff}px`,
          after: `強制靠齊至對齊線 (X: ${Math.min(itemA.box.x, itemB.box.x)}px)，以建立強烈的縱向網格對齊基準`
        });
      }
    }
  }

  // --- 2. SPACING & MARGINS (留白均勻度) ---
  // Sort elements by Y coordinate to check vertical spacing
  const sortedByY = [...items].sort((a, b) => a.box.y - b.box.y);
  let spacingIssuesCount = 0;
  const gaps: { gap: number; text1: string; text2: string }[] = [];

  for (let i = 0; i < sortedByY.length - 1; i++) {
    const itemA = sortedByY[i];
    const itemB = sortedByY[i + 1];

    // Check if they overlap horizontally in X space to ensure they are stacked vertically
    const horizOverlap =
      Math.min(itemA.box.x + itemA.box.width, itemB.box.x + itemB.box.width) > Math.max(itemA.box.x, itemB.box.x);

    if (horizOverlap && itemB.box.y > itemA.box.y + itemA.box.height) {
      const gap = itemB.box.y - (itemA.box.y + itemA.box.height);
      gaps.push({ gap, text1: itemA.text, text2: itemB.text });
    }
  }

  // Find uneven margins
  for (let i = 0; i < gaps.length - 1; i++) {
    const gap1 = gaps[i];
    const gap2 = gaps[i + 1];
    const diff = Math.abs(gap1.gap - gap2.gap);

    // If gaps are uneven (e.g. 24px and 11px)
    if (diff >= 8 && gap1.gap > 4 && gap2.gap > 4 && spacingIssuesCount < Math.min(10, Math.floor(items.length / 3))) {
      spacingIssuesCount++;
      suggestions.push({
        category: "spacing",
        title: "垂直元件留白間距不一致",
        description: `介面中垂直堆疊的段落間距不對稱：「${gap1.text1.slice(0, 6)}...」下方間距為 ${gap1.gap}px，而「${gap2.text1.slice(0, 6)}...」下方間距為 ${gap2.gap}px，造成版面留白雜亂。`,
        severity: diff >= 16 ? "high" : "medium",
        before: `垂直間距分別為 ${gap1.gap}px 和 ${gap2.gap}px (相差 ${diff}px)`,
        after: `統一收斂為網格系統中標準的 16px (或 8px 倍數) 間隙`
      });
    }
  }

  // --- 3. TYPOGRAPHY HIERARCHY (字級階層) ---
  const textHeights = items.map((item) => item.box.height);
  const maxHeight = Math.max(...textHeights);
  const minHeight = Math.min(...textHeights);

  if (maxHeight / minHeight < 1.4 && items.length >= 3) {
    suggestions.push({
      category: "typography",
      title: "標題與內文字體層級模糊",
      description: `畫面中最大文字字高為 ${maxHeight}px，最小字高為 ${minHeight}px，對比比例僅為 ${(maxHeight / minHeight).toFixed(1)}:1。資訊架構缺乏對比，不利於用戶快速掃描。`,
      severity: "medium",
      before: "標題與一般內容的文字高度與大小過於接近",
      after: "將主要標題放大至 24px 以上 (文字框高增加)，內文維持 14px，構成 2.0:1 以上的字級階層"
    });
  }

  // --- 4. ACCESSIBILITY CONTRAST (色彩對比度) ---
  if (colors.length >= 2) {
    const bgCol = colors.find((c) => c.role.includes("背景")) || colors[0];
    const textCol = colors.find((c) => c.role.includes("文字")) || colors[1] || colors[0];
    const accentCol = colors.find((c) => c.role.includes("品牌")) || colors[2] || colors[0];

    const textContrast = getContrastRatio(textCol.hex, bgCol.hex);
    if (textContrast < 4.5) {
      suggestions.push({
        category: "accessibility",
        title: "主體排版字與底色對比度不足",
        description: `當前主體文字 (${textCol.hex}) 與主要底色 (${bgCol.hex}) 的色彩對比度僅為 ${textContrast.toFixed(1)}:1，低於 WCAG AA 標準的 4.5:1。這會導致閱讀吃力。`,
        severity: "high",
        before: `文字與底色對比度為 ${textContrast.toFixed(1)}:1，影響長文本閱讀`,
        after: `更換文字為 ${bgCol.isDark ? "#F8FAFC" : "#0F172A"}，使對比度高於 8.5:1，完美保證閱讀體驗`
      });
    }

    const accentContrast = getContrastRatio(accentCol.hex, bgCol.hex);
    if (accentContrast < 3.0) {
      suggestions.push({
        category: "accessibility",
        title: "核心按鈕焦點色辨識度低",
        description: `核心焦點色 (${accentCol.hex}) 與背景底色 (${bgCol.hex}) 的視覺對比度僅為 ${accentContrast.toFixed(1)}:1，低於無障礙設計標準。重要點擊項目不易被快速察覺。`,
        severity: "medium",
        before: `核心按鈕與底色邊界模糊，對比僅有 ${accentContrast.toFixed(1)}:1`,
        after: `提升焦點按鈕顏色亮度或飽和度，增強其與背景底色的反差`
      });
    }
  }

  // --- 5. RECONSTRUCTED WIREFRAME SEGMENTATION (結構重構) ---
  // Group elements into 4 vertical bands based on Y coordinate to build an interactive mockup
  const reconstructedWireframe: WireframeElement[] = [];

  const segmentHeight = imageHeight / 4;
  const bands = {
    nav: items.filter((item) => item.box.y < segmentHeight),
    hero: items.filter((item) => item.box.y >= segmentHeight && item.box.y < segmentHeight * 2),
    body: items.filter((item) => item.box.y >= segmentHeight * 2 && item.box.y < segmentHeight * 3.4),
    footer: items.filter((item) => item.box.y >= segmentHeight * 3.4),
  };

  // Section 1: Navigation
  reconstructedWireframe.push({
    id: "wf-nav",
    type: "navigation",
    label: "頂部導覽區 (Navigation Area)",
    alignment: bands.nav.length > 2 ? "左側 LOGO，右側選單對齊" : "左側左對齊",
    optimalSpacing: "內邊距: 16px | 水平間距: 16px | 垂直高度: 64px",
    colorRole: "primary",
    contents: bands.nav.length > 0 ? bands.nav.map((i) => i.text).slice(0, 5) : ["標誌/Logo", "導覽選單"],
  });

  // Section 2: Hero
  reconstructedWireframe.push({
    id: "wf-hero",
    type: "hero",
    label: "主體焦點區 (Hero Header Block)",
    alignment: "橫向居中對齊",
    optimalSpacing: "垂直外邊距: 40px | 行高間距 (Gap): 16px",
    colorRole: "accent",
    contents: bands.hero.length > 0 ? bands.hero.map((i) => i.text).slice(0, 3) : ["主體核心標題", "次要宣傳文案按鈕"],
  });

  // Section 3: Body Cards/Form
  const bodyTexts = bands.body.map((i) => i.text);
  const isFormLike = bodyTexts.some((t) => t.includes("登入") || t.includes("輸入") || t.includes("信箱") || t.includes("確認"));

  reconstructedWireframe.push({
    id: "wf-body",
    type: isFormLike ? "form" : "card",
    label: isFormLike ? "核心表單容器 (Form Container)" : "資訊卡片網格 (Information Card Grid)",
    alignment: "水平左對齊，保證行文視覺基線統一",
    optimalSpacing: "外邊距: 24px | 卡片內留白: 20px | 元件垂直間距: 12px",
    colorRole: "card-bg",
    contents: bodyTexts.length > 0 ? bodyTexts.slice(0, 6) : ["資訊卡片 1", "資訊卡片 2", "按鈕/行動呼籲"],
  });

  // Section 4: Footer
  reconstructedWireframe.push({
    id: "wf-footer",
    type: "footer",
    label: "頁尾聲明區 (Footer Area)",
    alignment: "水平居中對齊",
    optimalSpacing: "內邊距: 24px | 垂直間距: 8px",
    colorRole: "background",
    contents: bands.footer.length > 0 ? bands.footer.map((i) => i.text).slice(0, 3) : ["© 2026 版權聲明 | 隱私權政策"],
  });

  // --- 6. GENERAL REVIEW SUMMARY (綜合審查) ---
  const alignDiffCount = alignmentIssuesCount;
  const unevenSpacingCount = spacingIssuesCount;
  const generalReview =
    `這張 UI 介面整體設計具備基礎結構。但幾何演算法發現了 ${alignDiffCount} 處文字對齊偏差、` +
    `${unevenSpacingCount} 處段落垂直留白不均。同時，部分主要文字與底色對比不足，可能影響視覺無障礙體驗。` +
    `建議統一採用 8px 網格標準收斂間距，靠齊文字起點，並參考下方方案 A/B 升級高對比配色。`;

  return {
    suggestions,
    reconstructedWireframe,
    generalReview,
  };
}
