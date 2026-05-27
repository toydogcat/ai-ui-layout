import { ExtractedColor, AlternativeTheme, AlternativeThemeColor } from "../types";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

// Convert RGB to HEX
function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Convert HEX to RGB
function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace(/^#/, "");
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to HSL
function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Calculate color distance (Euclidean in RGB)
function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2)
  );
}

// Name colors elegantly based on HSL
function getColorName({ h, s, l }: HSL): string {
  if (s < 12) {
    if (l > 90) return "純淨透白";
    if (l > 75) return "簡約高雅灰";
    if (l > 55) return "中性霧霾灰";
    if (l > 35) return "大氣石墨灰";
    if (l > 15) return "邃古深炭灰";
    return "極致靜謐黑";
  }

  if (h >= 345 || h < 15) {
    if (l > 70) return "櫻花柔粉";
    if (s > 75) return "典雅硃砂紅";
    return "溫暖珊瑚紅";
  }
  if (h >= 15 && h < 45) {
    if (l > 70) return "蜜桃暖橙";
    if (s > 70) return "活力烈陽橘";
    return "落日餘暉橙";
  }
  if (h >= 45 && h < 75) {
    if (l > 75) return "溫潤奶油黃";
    return "金黃琥珀黃";
  }
  if (h >= 75 && h < 160) {
    if (l > 75) return "薄荷微風綠";
    if (s > 65) return "極光翡翠綠";
    return "松針深邃綠";
  }
  if (h >= 160 && h < 195) {
    return "清透碧波青";
  }
  if (h >= 195 && h < 245) {
    if (l > 75) return "晨曦微光藍";
    if (s > 60) return "科技極致藍";
    return "經典商務藍";
  }
  if (h >= 245 && h < 290) {
    return "夢幻薰衣紫";
  }
  return "高貴木槿紅";
}

// Assign semantic UI role to colors
function assignRoles(colors: { rgb: RGB; hsl: HSL; ratio: number }[]): string[] {
  // Sort colors by ratio descending
  const sorted = [...colors].map((c, idx) => ({ ...c, originalIdx: idx }));

  const roles = new Array<string>(colors.length).fill("輔助裝飾色 (Secondary Decoration)");

  // 1. Find Background: largest ratio among light colors, or simply the largest ratio
  let bgIdx = -1;
  const lightColors = sorted.filter((c) => c.hsl.l > 65);
  if (lightColors.length > 0) {
    bgIdx = lightColors[0].originalIdx;
  } else {
    bgIdx = sorted[0].originalIdx;
  }
  roles[bgIdx] = "主要背景底色 (Main Background)";

  // 2. Find Primary Text: largest ratio among dark colors that is NOT the background
  let textIdx = -1;
  const darkColors = sorted.filter((c) => c.originalIdx !== bgIdx && c.hsl.l < 45);
  if (darkColors.length > 0) {
    textIdx = darkColors[0].originalIdx;
    roles[textIdx] = "主體文字與排版色 (Primary Typography)";
  } else {
    // Fallback: next highest ratio
    const remaining = sorted.filter((c) => c.originalIdx !== bgIdx);
    if (remaining.length > 0) {
      textIdx = remaining[0].originalIdx;
      roles[textIdx] = "主體文字與排版色 (Primary Typography)";
    }
  }

  // 3. Find Brand Accent: most saturated color among remaining colors
  let accentIdx = -1;
  const remainingForAccent = sorted.filter(
    (c) => c.originalIdx !== bgIdx && c.originalIdx !== textIdx
  );
  if (remainingForAccent.length > 0) {
    // Sort by saturation descending
    const saturated = [...remainingForAccent].sort((a, b) => b.hsl.s - a.hsl.s);
    if (saturated[0].hsl.s > 25) {
      accentIdx = saturated[0].originalIdx;
      roles[accentIdx] = "品牌焦點與 CTA 按鈕色 (Brand CTA Accent)";
    }
  }

  // 4. Fill in secondary backgrounds or neutral outlines
  for (let i = 0; i < colors.length; i++) {
    if (i === bgIdx || i === textIdx || i === accentIdx) continue;
    const col = colors[i];
    if (col.hsl.l > 80) {
      roles[i] = "次要卡片與容器底色 (Secondary Card Background)";
    } else if (col.hsl.l > 50 && col.hsl.l <= 80) {
      roles[i] = "邊框線條與分割線色 (Border & Splitter Neutral)";
    } else {
      roles[i] = "次要輔助文字與標籤 (Secondary Text & Label)";
    }
  }

  return roles;
}

// Perform downsampled K-Means color clustering
export function extractDominantColors(imageData: ImageData, k = 5): ExtractedColor[] {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Sample pixels to ensure ultra-high performance (processing around 1500-2000 pixels is perfect)
  const totalPixels = width * height;
  const step = Math.max(1, Math.floor(totalPixels / 2000)) * 4; // 4 channels per pixel (RGBA)

  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += step) {
    // Ignore pure transparent pixels
    if (data[i + 3] < 30) continue;
    pixels.push({
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    });
  }

  if (pixels.length === 0) {
    return [
      { hex: "#FFFFFF", name: "純白背景", ratio: 80, role: "主要背景底色 (Main Background)", isDark: false },
      { hex: "#1E293B", name: "石墨炭藍", ratio: 20, role: "主體文字與排版色 (Primary Typography)", isDark: true },
    ];
  }

  // Initialize Centroids randomly from sampled pixels to ensure diversity and stability
  let centroids: RGB[] = [];
  const usedIdxs = new Set<number>();
  for (let i = 0; i < k; i++) {
    let idx;
    // Simple random seed selection (better than fixed offsets)
    do {
      idx = Math.floor(Math.random() * pixels.length);
    } while (usedIdxs.has(idx) && usedIdxs.size < pixels.length);
    usedIdxs.add(idx);
    centroids.push({ ...pixels[idx] });
  }

  // Run more iterations for better convergence as recommended in the report
  const maxIterations = 20;
  let assignments = new Int32Array(pixels.length);

  for (let iter = 0; iter < maxIterations; iter++) {
    // 1. Assign pixels to closest centroid
    for (let p = 0; p < pixels.length; p++) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let c = 0; c < k; c++) {
        const d = colorDistance(pixels[p], centroids[c]);
        if (d < minDist) {
          minDist = d;
          minIdx = c;
        }
      }
      assignments[p] = minIdx;
    }

    // 2. Recompute centroids
    const sumsR = new Float64Array(k);
    const sumsG = new Float64Array(k);
    const sumsB = new Float64Array(k);
    const counts = new Int32Array(k);

    for (let p = 0; p < pixels.length; p++) {
      const c = assignments[p];
      sumsR[c] += pixels[p].r;
      sumsG[c] += pixels[p].g;
      sumsB[c] += pixels[p].b;
      counts[c]++;
    }

    let centroidDelta = 0;
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) {
        // If a centroid got no pixels, assign a random pixel to it
        const randPixel = pixels[Math.floor(Math.random() * pixels.length)];
        centroids[c] = { ...randPixel };
        continue;
      }

      const nextCentroid = {
        r: Math.round(sumsR[c] / counts[c]),
        g: Math.round(sumsG[c] / counts[c]),
        b: Math.round(sumsB[c] / counts[c]),
      };

      centroidDelta += colorDistance(centroids[c], nextCentroid);
      centroids[c] = nextCentroid;
    }

    // Tighter convergence threshold for better precision
    if (centroidDelta < 0.5) {
      break;
    }
  }

  // Calculate cluster sizes and HSL properties
  const sizes = new Int32Array(k);
  for (let p = 0; p < pixels.length; p++) {
    sizes[assignments[p]]++;
  }

  const rawColors = centroids.map((rgb, idx) => {
    const hsl = rgbToHsl(rgb);
    const ratio = Math.max(1, Math.round((sizes[idx] / pixels.length) * 100));
    return { rgb, hsl, ratio };
  });

  // Sort colors by ratio descending to keep them ordered beautifully
  rawColors.sort((a, b) => b.ratio - a.ratio);

  // Assign roles
  const roles = assignRoles(rawColors);

  // Map to ExtractedColor schema
  return rawColors.map((col, idx) => {
    const hex = rgbToHex(col.rgb);
    const name = getColorName(col.hsl);
    const isDark = col.hsl.l < 50;
    return {
      hex,
      name,
      ratio: col.ratio,
      role: roles[idx],
      isDark,
    };
  });
}

// Generate the beautiful suggested themes based on the extracted colors
export function generateAlternativeThemes(extractedColors: ExtractedColor[]): AlternativeTheme[] {
  // 1. Identify roles from our extracted colors
  const mainBgColor = extractedColors.find(c => c.role.includes("主要背景")) || extractedColors[0];
  const primaryTextColor = extractedColors.find(c => c.role.includes("主體文字")) || extractedColors[1] || extractedColors[0];
  const accentColor = extractedColors.find(c => c.role.includes("品牌焦點")) || extractedColors[2] || extractedColors[0];

  // Helper to map color roles to custom conversion swatches
  const buildThemeColors = (
    themeId: string,
    bgHex: string,
    textHex: string,
    accentHex: string,
    cardBgHex: string,
    borderHex: string
  ): AlternativeThemeColor[] => {
    return extractedColors.map((c) => {
      let newHex = c.hex;
      let tailwindClass = "text-slate-400";
      let roleDescription = c.role;

      if (c.role.includes("主要背景")) {
        newHex = bgHex;
        tailwindClass = "bg-[#0b0f19]";
        roleDescription = "升級為深沉極簡底色，營造專業視覺空間";
      } else if (c.role.includes("主體文字")) {
        newHex = textHex;
        tailwindClass = "text-slate-100";
        roleDescription = "升級為高亮文字，加強對比度以提升易讀性";
      } else if (c.role.includes("品牌焦點")) {
        newHex = accentHex;
        tailwindClass = "bg-blue-500";
        roleDescription = "精選時尚亮色，凸顯主要點擊與重要按鈕";
      } else if (c.role.includes("次要卡片")) {
        newHex = cardBgHex;
        tailwindClass = "bg-[#131b2e]";
        roleDescription = "卡片與表單的背景托底色，劃分視覺層級";
      } else if (c.role.includes("邊框線條")) {
        newHex = borderHex;
        tailwindClass = "border-slate-800";
        roleDescription = "細緻中性邊界線，保持結構清晰度";
      } else {
        // Fallback blend using new background tones
        newHex = cardBgHex;
        tailwindClass = "bg-[#1e293b]";
        roleDescription = "微光背景元素，作為視覺呼吸過渡";
      }

      return {
        name: c.name,
        originalHex: c.hex,
        newHex,
        role: roleDescription,
        tailwindClass,
      };
    });
  };

  return [
    {
      id: "convert-nordic",
      themeName: "北歐冰川 (Nordic Arctic)",
      description: "以冰晶藍為品牌亮點，搭配大氣石墨灰背景與純潔雪地白文字，散發北歐現代極簡與高階冷感美學。",
      colors: buildThemeColors(
        "convert-nordic",
        "#0D1527", // Dark arctic bg
        "#E2E8F0", // Snow white text
        "#2AD1D6", // Arctic cyan accent
        "#17233B", // Cool card bg
        "#223354"  // Arctic border
      ),
    },
    {
      id: "convert-dark",
      themeName: "石墨炭黑 (Carbon Noir)",
      description: "專為高端暗色介面設計，以濃郁炭黑及無光澤石墨為基調，搭配炫光極光綠按鈕，展現極致科技感與專業感。",
      colors: buildThemeColors(
        "convert-dark",
        "#08080C", // Jet black bg
        "#F8FAFC", // Ultra white text
        "#10B981", // Emerald accent
        "#12121A", // Carbon card bg
        "#1E293B"  // Dark grey border
      ),
    },
    {
      id: "convert-glow",
      themeName: "溫暖落日 (Sunset Glow)",
      description: "以暖沙土色和落日餘暉橙為核心，極富溫度感的暖色系配置，營造溫馨、親切且奢華的人文設計格調。",
      colors: buildThemeColors(
        "convert-glow",
        "#171212", // Deep cocoa bg
        "#FFF7ED", // Warm peach text
        "#F97316", // Terracotta orange accent
        "#241C1C", // Warm card bg
        "#3E2E2E"  // Warm border
      ),
    },
  ];
}
