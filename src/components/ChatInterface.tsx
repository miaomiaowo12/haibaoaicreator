'use client';

import { useState, useRef, useEffect } from 'react';
import MessageInput from './MessageInput';
import PosterTypeSelector from './PosterTypeSelector';
import DesignOptions from './DesignOptions';
import ImageViewer from './ImageViewer';
import ConversationList from './ConversationList';
import { 
  Conversation, 
  Message, 
  getConversations, 
  saveConversations, 
  createConversation,
  updateConversation,
  deleteConversation
} from '@/lib/conversationStore';

const POSTER_TYPES = [
  { id: 'promotion', label: '商业促销', emoji: '🏷️' },
  { id: 'recruitment', label: '招聘求职', emoji: '💼' },
  { id: 'opening', label: '开业庆典', emoji: '🎉' },
  { id: 'festival', label: '节日祝福', emoji: '🎊' },
  { id: 'event', label: '活动宣传', emoji: '🎪' },
  { id: 'product', label: '产品推广', emoji: '📦' },
  { id: 'food', label: '餐饮美食', emoji: '🍜' },
  { id: 'travel', label: '旅游出行', emoji: '✈️' },
  { id: 'wedding', label: '婚庆喜事', emoji: '💒' },
  { id: 'education', label: '教育培训', emoji: '📚' },
  { id: 'other', label: '其他', emoji: '🎨' },
];

let messageIdCounter = 0;

function generateId(): string {
  if (typeof window === 'undefined') {
    messageIdCounter++;
    return `msg-server-${messageIdCounter}`;
  }
  messageIdCounter++;
  return `msg-client-${Date.now()}-${messageIdCounter}`;
}

export default function ChatInterface() {
  const [mounted, setMounted] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColorScheme, setSelectedColorScheme] = useState<string | null>(null);
  const [selectedTypography, setSelectedTypography] = useState<string | null>(null);
  const [showDesignOptions, setShowDesignOptions] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedConversations = getConversations();
    const newConv = createConversation();
    
    if (savedConversations.length === 0) {
      setConversations([newConv]);
    } else {
      setConversations([newConv, ...savedConversations]);
    }
    
    setCurrentConversationId(newConv.id);
    setMessages(newConv.messages);
    saveConversations([newConv, ...savedConversations]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveMessages = (newMessages: Message[]) => {
    if (!currentConversationId) return;
    const updatedConversations = updateConversation(conversations, currentConversationId, newMessages);
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
  };

  const handleImageUpload = (dataUrl: string) => {
    setBackgroundImage(dataUrl);
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBackgroundImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: backgroundImage ? `${content}（已上传背景图）` : content,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: content,
          posterType: selectedType,
          colorScheme: selectedColorScheme,
          typography: selectedTypography,
          backgroundImage: backgroundImage,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '海报已生成！点击图片可放大查看',
        generatedImage: data.data?.[0]?.url || data.url,
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `生成失败：${error instanceof Error ? error.message : '未知错误'}`,
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    const newConv = createConversation();
    const updatedConversations = [newConv, ...conversations];
    setConversations(updatedConversations);
    setCurrentConversationId(newConv.id);
    setMessages(newConv.messages);
    saveConversations(updatedConversations);
    setShowConversationList(false);
  };

  const handleSelectConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentConversationId(id);
      setMessages(conv.messages);
      setShowConversationList(false);
    }
  };

  const handleDeleteConversation = (id: string) => {
    const updatedConversations = deleteConversation(conversations, id);
    setConversations(updatedConversations);
    saveConversations(updatedConversations);

    if (currentConversationId === id) {
      if (updatedConversations.length > 0) {
        const latestConv = updatedConversations.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        setCurrentConversationId(latestConv.id);
        setMessages(latestConv.messages);
      } else {
        handleNewConversation();
      }
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-col h-screen">
        <header className="card border-b border-gray-100 px-4 py-3 safe-area-top">
          <h1 className="text-lg font-semibold text-gray-900">AI海报生成器</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-sm">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="card border-b border-gray-100 px-4 py-3 safe-area-top flex-shrink-0 flex items-center justify-between">
        <button
          onClick={() => setShowConversationList(true)}
          className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">AI海报生成器</h1>
        <button
          onClick={handleNewConversation}
          className="w-9 h-9 flex items-center justify-center text-purple-600 hover:text-purple-700 transition-colors rounded-lg hover:bg-purple-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col max-w-3xl mx-auto w-full">
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="card p-4 mx-4 mt-4 rounded-2xl shadow-soft">
            <PosterTypeSelector
              types={POSTER_TYPES}
              selectedType={selectedType}
              onSelect={setSelectedType}
            />
            <button
              onClick={() => setShowDesignOptions(!showDesignOptions)}
              className="mt-3 text-sm text-purple-600 font-medium"
            >
              {showDesignOptions ? '收起配色与排版 ▲' : '展开配色与排版 ▼'}
            </button>
          </div>

          {showDesignOptions && (
            <div className="mx-4 mt-2">
              <DesignOptions
                selectedColorScheme={selectedColorScheme}
                selectedTypography={selectedTypography}
                onColorSchemeChange={setSelectedColorScheme}
                onTypographyChange={setSelectedTypography}
              />
            </div>
          )}

          <div className="p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-message relative ${
                    message.role === 'user' ? 'message-user' : 'message-assistant'
                  }`}
                >
                  <button
                    onClick={() => handleCopyMessage(message.id, message.content)}
                    className="absolute top-2 right-2 p-1.5 rounded transition-colors"
                    title="复制"
                  >
                    {copiedMessageId === message.id ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed pr-8">{message.content}</p>
                  {message.generatedImage && (
                    <img
                      src={message.generatedImage}
                      alt="生成的海报"
                      className="mt-2 max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setViewerImage(message.generatedImage || null)}
                    />
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="message-assistant rounded-2xl px-4 py-3 shadow-message">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-area p-4 safe-area-bottom flex-shrink-0 shadow-input">
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*"
            onChange={handleBgUpload}
            style={{ display: 'none' }}
          />
          
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => bgInputRef.current?.click()}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
            >
              + 添加背景图
            </button>
            
            {backgroundImage && (
              <div className="flex items-center gap-2 flex-1">
                <img 
                  src={backgroundImage} 
                  alt="背景图预览" 
                  className="w-12 h-12 object-cover rounded border border-gray-200"
                />
                <span className="text-sm text-gray-500">已上传背景图</span>
                <button
                  onClick={handleRemoveBackground}
                  className="text-red-500 hover:text-red-700 text-sm ml-auto"
                >
                  移除
                </button>
              </div>
            )}
          </div>
          
          <MessageInput
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder="告诉我你的海报需求，比如用途、文案、风格以及发布平台"
            onImageUpload={handleImageUpload}
          />
        </div>
      </div>

      {showConversationList && (
        <ConversationList
          conversations={conversations}
          currentId={currentConversationId}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
          onNew={handleNewConversation}
          onClose={() => setShowConversationList(false)}
        />
      )}

      {viewerImage && (
        <ImageViewer
          src={viewerImage}
          alt="海报预览"
          onClose={() => setViewerImage(null)}
        />
      )}
    </div>
  );
}
