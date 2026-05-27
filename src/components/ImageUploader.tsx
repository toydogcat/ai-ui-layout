import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Sparkles, X } from "lucide-react";

interface ImageUploaderProps {
  onImageSelected: (dataUrl: string, mimeType: string) => void;
  isLoading: boolean;
}

export default function ImageUploader({ onImageSelected, isLoading }: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("請上傳有效的圖片檔案（PNG, JPEG, WebP）！");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewUrl(reader.result);
        onImageSelected(reader.result, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  const clearSelectedImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <div
        id="upload-container"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
          ${isDragActive 
            ? "border-blue-500 bg-blue-950/40" 
            : "border-slate-800 hover:border-slate-700 bg-[#0B0F19]/45"
          }
          ${isLoading ? "pointer-events-none opacity-80" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
          disabled={isLoading}
        />

        {previewUrl ? (
          <div className="relative h-80 w-full flex items-center justify-center bg-[#131B2E] group">
            <img
              src={previewUrl}
              alt="UI Preview"
              className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
            />
            
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <span className="bg-slate-900/95 text-slate-100 text-sm font-medium px-4 py-2 rounded-lg shadow-md flex items-center gap-2 border border-slate-800">
                <Upload size={16} />
                更換其他設計圖
              </span>
            </div>

            {!isLoading && (
              <button
                onClick={clearSelectedImage}
                className="absolute top-4 right-4 bg-slate-950/80 hover:bg-slate-950 text-white rounded-full p-1.5 transition-colors shadow-md z-10"
                title="清除圖片"
                id="clear-image-btn"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-950/60 text-blue-400 flex items-center justify-center mb-4 shadow-inner">
              <Upload size={24} className="stroke-[2]" />
            </div>
            
            <h3 className="text-slate-200 font-semibold text-lg mb-1.5 font-sans">
              上傳 UI 設計截圖或原型
            </h3>
            <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
              拖曳圖片到此處，或使用點選方式上傳。支援 PNG、JPG、WebP 檔案。
            </p>

            <span className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2">
              <ImageIcon size={16} />
              選擇檔案
            </span>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                <Sparkles size={20} className="animate-pulse" />
              </div>
            </div>
            <h4 className="text-slate-100 font-semibold text-base mb-1">
              AI 正在深入診斷您的 UI 設計...
            </h4>
            <p className="text-slate-400 text-xs max-w-xs animate-pulse">
              正在分析畫面留白、字體比例、色彩對稱與可存取性，並重組最佳線框結構。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
