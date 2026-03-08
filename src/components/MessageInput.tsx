'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder: string;
  onImageUpload?: (imageDataUrl: string) => void;
}

export default function MessageInput({ onSend, disabled, placeholder, onImageUpload }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (input.trim() && !disabled && !isSending) {
      setIsSending(true);
      onSend(input);
      setInput('');
      setTimeout(() => setIsSending(false), 1000); // 1秒后允许再次发送
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled && !isSending) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (onImageUpload && dataUrl) {
        onImageUpload(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  const canSend = input.trim() && !disabled && !isSending;

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <button
        onClick={handleUploadClick}
        disabled={disabled}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-purple-600 transition-all disabled:opacity-50"
        title="上传参考图"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 bg-transparent resize-none text-base leading-6 focus:outline-none disabled:opacity-50 min-h-[24px] max-h-[100px] placeholder:text-gray-400"
      />
      <button
        onClick={handleSend}
        disabled={!canSend}
        className={`flex-shrink-0 w-6 h-6 flex items-center justify-center transition-all ${
          canSend ? 'text-purple-600' : 'text-gray-300'
        }`}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
