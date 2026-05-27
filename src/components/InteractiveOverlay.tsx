import React, { useState } from "react";
import { OcrItem } from "../utils/layoutAnalyzer";
import { DesignSuggestion } from "../types";
import { Copy, Check } from "lucide-react";

interface InteractiveOverlayProps {
  ocrResults: OcrItem[];
  naturalWidth: number;
  naturalHeight: number;
  activeSuggestion: DesignSuggestion | null;
  showOverlay: boolean;
  onCopiedText?: (text: string) => void;
}

export default function InteractiveOverlay({
  ocrResults,
  naturalWidth,
  naturalHeight,
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
      highlightedX = parseInt(xMatch[1], 10);
    }

    // Parse spacing coordinates out of title or description
    const gapMatch = desc.match(/下方間距為\s*(\d+)px/);
    if (gapMatch) {
      // Find the item matching this text
      const itemText = activeSuggestion.title.match(/「(.+?)」/)?.[1] || "";
      const targetItem = ocrResults.find(i => i.text.includes(itemText));
      if (targetItem) {
        highlightedGapRect = {
          x: targetItem.box.x,
          y: targetItem.box.y + targetItem.box.height,
          w: targetItem.box.width,
          h: parseInt(gapMatch[1], 10)
        };
      }
    }
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-20"
      viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Global Alignment Snapping Guides */}
      {ocrResults.map((item, idx) => {
        // Draw vertical snapping guides for left alignments
        const isLeftAlignedWithOthers = ocrResults.some(
          (other, oIdx) => oIdx !== idx && Math.abs(other.box.x - item.box.x) <= 5
        );

        if (isLeftAlignedWithOthers && item.box.x > 10) {
          return (
            <line
              key={`line-snap-${idx}`}
              x1={item.box.x}
              y1={0}
              x2={item.box.x}
              y2={naturalHeight}
              stroke="rgba(59, 130, 246, 0.15)"
              strokeWidth="1.5"
              strokeDasharray="4,6"
            />
          );
        }
        return null;
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
            {highlightedGapRect.h}px
          </text>
        </g>
      )}

      {/* 3. Text Interactive Bounding Boxes */}
      {ocrResults.map((item, idx) => {
        const isCopied = copiedId === idx;
        const box = item.box;

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

            {/* Hover Tooltip card background */}
            <foreignObject
              x={Math.max(10, Math.min(box.x + box.width / 2 - 90, naturalWidth - 190))}
              y={box.y - 34 > 10 ? box.y - 34 : box.y + box.height + 6}
              width="180"
              height="28"
              className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200"
            >
              <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-200 text-[10px] py-1 px-2.5 rounded-lg shadow-xl flex items-center justify-between font-sans">
                <span className="truncate max-w-[125px] font-medium">{item.text}</span>
                <span className="flex items-center gap-1 text-[9px] text-slate-400 font-mono scale-90">
                  {isCopied ? (
                    <span className="text-emerald-400 font-bold">已複製</span>
                  ) : (
                    <>
                      <span>H:</span>
                      <span>{box.height}px</span>
                    </>
                  )}
                </span>
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}
