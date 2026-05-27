import React, { useState } from "react";
import { OcrItem } from "../utils/layoutAnalyzer";
import { DesignSuggestion } from "../types";
import { Copy, Check } from "lucide-react";

interface InteractiveOverlayProps {
  ocrResults: OcrItem[];
  naturalWidth: number;
  naturalHeight: number;
  analysisScale?: number;
  activeSuggestion: DesignSuggestion | null;
  showOverlay: boolean;
  onCopiedText?: (text: string) => void;
}

export default function InteractiveOverlay({
  ocrResults,
  naturalWidth,
  naturalHeight,
  analysisScale = 1,
  activeSuggestion,
  showOverlay,
  onCopiedText
}: InteractiveOverlayProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!showOverlay || !naturalWidth || !naturalHeight) return null;

  const handleCopy = (text: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(idx);
      if (onCopiedText) {
        onCopiedText(text);
      }
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  // Extract alignment or spacing coordinates from active suggestion if highlighted
  let highlightedX: number | null = null;
  let highlightedYRange: { y1: number; y2: number } | null = null;
  let highlightedGapRect: { x: number; y: number; w: number; h: number } | null = null;
if (activeSuggestion) {
  const desc = activeSuggestion.description;

  // Parse x coordinate out of title or description if present
  const xMatch = desc.match(/x:\s*(\d+)px/);
  if (xMatch) {
    // Map back to natural scale from analysis scale
    highlightedX = parseInt(xMatch[1], 10) / analysisScale;
  }

  // Parse gap height if present (e.g. "下方間距為 24px")
  const gapMatch = desc.match(/下方間距為\s*(\d+)px/);
  if (gapMatch && ocrResults.length > 0) {
    // Try to find the item mentioned in title
    const title = activeSuggestion.title;
    const itemText = title.match(/「(.+)\.\.\.」/)?.[1] || "";
    const targetItem = ocrResults.find(i => i.text.startsWith(itemText));

    if (targetItem) {
      highlightedGapRect = {
        x: targetItem.box.x / analysisScale,
        y: (targetItem.box.y + targetItem.box.height) / analysisScale,
        w: targetItem.box.width / analysisScale,
        h: parseInt(gapMatch[1], 10) / analysisScale
      };
    }
  }
}

// 1. Aggregate X coordinates for snapping guides to reduce noise
const xGroups = new Map<number, number>();
ocrResults.forEach(item => {
  const x = item.box.x / analysisScale;
  if (x <= 10) return; // Ignore very edge alignments
  let foundKey = [...xGroups.keys()].find(k => Math.abs(k - x) <= 4);
  if (foundKey !== undefined) {
    xGroups.set(foundKey, xGroups.get(foundKey)! + 1);
  } else {
    xGroups.set(x, 1);
  }
});
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-20"
      viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Global Alignment Snapping Guides - Only show for groups of 2+ elements */}
      {[...xGroups.entries()].map(([x, count], gIdx) => {
        if (count < 2) return null;
        
        return (
          <line
            key={`line-snap-group-${gIdx}`}
            x1={x}
            y1={0}
            x2={x}
            y2={naturalHeight}
            stroke="rgba(59, 130, 246, 0.12)"
            strokeWidth="1.2"
            strokeDasharray="4,6"
          />
        );
      })}

      {/* 2. Highlight Specific Issue from Active Suggestion Card */}
      {highlightedX !== null && (
        <line
          x1={highlightedX}
          y1={0}
          x2={highlightedX}
          y2={naturalHeight}
          stroke="#f43f5e"
          strokeWidth="3.5"
          strokeDasharray="5,5"
          className="animate-pulse"
        />
      )}

      {highlightedGapRect && (
        <g className="animate-pulse">
          {/* Highlight Gap Rect */}
          <rect
            x={highlightedGapRect.x}
            y={highlightedGapRect.y}
            width={highlightedGapRect.w}
            height={highlightedGapRect.h}
            fill="rgba(244, 63, 94, 0.35)"
            stroke="#f43f5e"
            strokeWidth="2"
          />
          {/* Height marker text label */}
          <rect
            x={highlightedGapRect.x + highlightedGapRect.w / 2 - 25}
            y={highlightedGapRect.y + highlightedGapRect.h / 2 - 10}
            width="50"
            height="20"
            rx="4"
            fill="#f43f5e"
          />
          <text
            x={highlightedGapRect.x + highlightedGapRect.w / 2}
            y={highlightedGapRect.y + highlightedGapRect.h / 2 + 4}
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
          >
            {Math.round(highlightedGapRect.h * analysisScale)}px
          </text>
        </g>
      )}

      {/* 3. Text Interactive Bounding Boxes */}
      {ocrResults.map((item, idx) => {
        const isCopied = copiedId === idx;
        const box = {
          x: item.box.x / analysisScale,
          y: item.box.y / analysisScale,
          width: item.box.width / analysisScale,
          height: item.box.height / analysisScale
        };

        return (
          <g key={`ocr-box-${idx}`} className="group pointer-events-auto">
            {/* Transparent Bounding Box */}
            <rect
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              fill="rgba(59, 130, 246, 0.05)"
              stroke="rgba(59, 130, 246, 0.45)"
              strokeWidth="1.5"
              strokeDasharray="2,3"
              className="cursor-pointer hover:fill-blue-500/20 hover:stroke-blue-400 transition-all duration-200"
              onClick={(e) => handleCopy(item.text, idx, e)}
            />

            {/* Pure SVG Tooltip (Better Safari/iOS compatibility than foreignObject) */}
            <g 
              className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
              transform={`translate(${Math.max(10, Math.min(box.x + box.width / 2 - 90, naturalWidth - 190))}, ${box.y - 34 > 10 ? box.y - 34 : box.y + box.height + 6})`}
            >
              <rect 
                width="180" 
                height="28" 
                rx="8" 
                fill="rgba(11, 15, 25, 0.9)" 
                stroke="#1e293b" 
                strokeWidth="1"
              />
              <text 
                x="10" 
                y="18" 
                fill="#e2e8f0" 
                fontSize="10" 
                fontWeight="500" 
                fontFamily="sans-serif"
              >
                {item.text.length > 20 ? item.text.slice(0, 18) + '...' : item.text}
              </text>
              <text 
                x="170" 
                y="18" 
                textAnchor="end" 
                fill={isCopied ? "#10b981" : "#94a3b8"} 
                fontSize="9" 
                fontFamily="monospace"
              >
                {isCopied ? "已複製" : `H:${box.height}px`}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
