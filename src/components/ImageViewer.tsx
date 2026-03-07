'use client';

import { useEffect } from 'react';

interface ImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <p className="text-white/70 text-sm">长按图片可保存</p>
        <button
          onClick={onClose}
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white active:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <img
        src={src}
        alt={alt}
        className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
