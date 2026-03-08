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
  createEmptyConversation,
  updateConversation,
  deleteConversation,
  EMPTY_CONVERSATION_ID
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
  const [loadingThumbnail, setLoadingThumbnail] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedConversations = getConversations();
    const nonEmptyConversations = savedConversations.filter(c => c.id !== EMPTY_CONVERSATION_ID && c.messages.length > 0);
    
    // 检查是否需要创建空对话
    // 只有在没有保存的会话时才创建空对话
    if (nonEmptyConversations.length === 0) {
      const emptyConv = createEmptyConversation();
      setConversations([emptyConv]);
      setCurrentConversationId(emptyConv.id);
      setMessages(emptyConv.messages);
    } else {
      // 如果有保存的会话，加载最新的会话，不创建空对话
      const sortedConversations = [...nonEmptyConversations].sort((a, b) => b.updatedAt - a.updatedAt);
      const latestConv = sortedConversations[0];
      setConversations(sortedConversations);
      setCurrentConversationId(latestConv.id);
      setMessages(latestConv.messages);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoading) {
        // 用户返回页面且正在生成中，给出提示
        console.log('用户返回页面，继续等待生成结果...');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 防止页面休眠（保持唤醒）
    const wakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isLoading) {
          // @ts-ignore
          await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock 请求失败:', err);
      }
    };
    
    if (isLoading) {
      wakeLock();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveMessages = (newMessages: Message[]) => {
    if (!currentConversationId) return;
    if (newMessages.length === 0) return;
    
    let updatedConversations = updateConversation(conversations, currentConversationId, newMessages);
    
    // 如果当前是空会话，将其转换为普通会话（改变ID）
    if (currentConversationId === EMPTY_CONVERSATION_ID) {
      const currentConv = updatedConversations.find(c => c.id === EMPTY_CONVERSATION_ID);
      if (currentConv) {
        // 创建一个新的普通会话（不固定ID）
        const realConv: Conversation = {
          ...currentConv,
          id: `conv-${Date.now()}`,
        };
        
        // 替换空会话，不创建新的空会话
        const otherConversations = updatedConversations.filter(c => c.id !== EMPTY_CONVERSATION_ID);
        updatedConversations = [realConv, ...otherConversations];
        
        // 更新当前会话ID，保持在当前会话
        setCurrentConversationId(realConv.id);
      }
    }
    
    setConversations(updatedConversations);
    // 只保存有内容的会话（不包括空会话）
    saveConversations(updatedConversations.filter(c => c.id !== EMPTY_CONVERSATION_ID));
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

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
  };

  const handleImageUpload = async (dataUrl: string) => {
    try {
      setIsUploadingImage(true);
      
      // 适中压缩：800px, 0.7质量，保持较好画质
      const compressedDataUrl = await compressImage(dataUrl, 800, 0.7);
      console.log('图片压缩完成，大小:', compressedDataUrl.length);
      
      // 转换为 File 对象
      const response = await fetch(compressedDataUrl);
      let blob = await response.blob();
      
      // 如果还太大（>300KB），再次压缩到 600px, 0.6质量
      if (blob.size > 300 * 1024) {
        console.log('文件较大，再次压缩到 600px...');
        const mediumCompressed = await compressImage(dataUrl, 600, 0.6);
        const mediumResponse = await fetch(mediumCompressed);
        blob = await mediumResponse.blob();
        console.log('二次压缩后大小:', blob.size);
        
        // 如果还太大（>200KB），最后压缩到 512px, 0.5质量
        if (blob.size > 200 * 1024) {
          console.log('文件仍大，最终压缩到 512px...');
          const finalCompressed = await compressImage(dataUrl, 512, 0.5);
          const finalResponse = await fetch(finalCompressed);
          blob = await finalResponse.blob();
          console.log('最终压缩后大小:', blob.size);
        }
      }
      
      // 如果图片还很大，提示用户
      if (blob.size > 400 * 1024) {
        alert('图片较大，上传可能需要较长时间。建议上传较小的图片以获得更快体验。');
      }
      
      const file = new File([blob], `upload-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // 上传到 TOS
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const uploadData = await uploadResponse.json();
      console.log('上传响应:', uploadData);
      
      if (!uploadResponse.ok || uploadData.error) {
        throw new Error(uploadData.details || uploadData.error || '上传失败');
      }
      
      if (!uploadData.url) {
        throw new Error('未返回图片 URL');
      }
      
      console.log('图片已上传到 TOS:', uploadData.url);
      setBackgroundImage(uploadData.url);
      
    } catch (err) {
      console.error('图片上传失败:', err);
      alert(`图片上传失败：${err instanceof Error ? err.message : '请重试'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const compressImage = (dataUrl: string, maxWidth: number = 1024, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    });
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
      // 步骤 1: 提交异步任务
      console.log('提交异步生成任务...');
      const submitResponse = await fetch('/api/generate-async', {
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
          mode: backgroundImage ? 'single' : 'thumbnails',
        }),
      });

      if (!submitResponse.ok) {
        throw new Error(`提交任务失败: ${submitResponse.status}`);
      }

      const { jobId } = await submitResponse.json();
      console.log('任务已提交，jobId:', jobId);
      setLoadingStatus('任务已提交，正在启动生成...');

      // 步骤 2: 轮询查询状态（每3秒查询一次，最多60次 = 3分钟）
      const maxAttempts = 60;
      const pollInterval = 3000; // 3秒
      let attempts = 0;
      let result = null;

      while (attempts < maxAttempts) {
        attempts++;
        
        // 更新进度显示
        const elapsedSeconds = attempts * 3;
        if (attempts <= 5) {
          setLoadingStatus(`正在启动生成任务... (${elapsedSeconds}秒)`);
        } else if (attempts <= 15) {
          setLoadingStatus(`AI正在生成海报，请稍候... (${elapsedSeconds}秒)`);
        } else {
          setLoadingStatus(`正在优化海报细节... (${elapsedSeconds}秒)`);
        }
        
        console.log(`轮询第 ${attempts}/${maxAttempts} 次...`);

        // 等待3秒
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        // 查询状态
        const statusResponse = await fetch(`/api/job-status?jobId=${jobId}`);
        
        if (!statusResponse.ok) {
          console.error('查询状态失败:', statusResponse.status);
          continue; // 继续轮询
        }

        const jobStatus = await statusResponse.json();
        console.log('任务状态:', jobStatus.status);

        if (jobStatus.status === 'completed') {
          result = jobStatus.result;
          break; // 完成，跳出循环
        } else if (jobStatus.status === 'failed') {
          throw new Error(jobStatus.error || '生成失败');
        }
        // pending 或 processing，继续轮询
      }

      if (!result) {
        throw new Error('生成超时，请重试');
      }

      // 步骤 3: 显示结果
      console.log('生成完成，结果:', result);

      if (backgroundImage) {
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: '海报已生成！点击图片可放大查看',
          generatedImage: result.url,
        };
        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);
        saveMessages(finalMessages);
      } else {
        // 缩略图模式，这里简化处理，实际应该支持多图
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: '海报已生成！点击图片可放大查看',
          generatedImage: result.url,
        };
        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);
        saveMessages(finalMessages);
      }

    } catch (error) {
      console.error('生成失败:', error);
      let errorMsg = '未知错误';
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `生成失败：${errorMsg}`,
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectThumbnail = async (thumbnailUrl: string, messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message || !message.thumbnails) return;

    setLoadingThumbnail(thumbnailUrl);

    const hdMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '高清海报已生成！点击图片可放大查看',
      generatedImage: thumbnailUrl,
    };

    const newMessages = [...messages, hdMessage];
    setMessages(newMessages);
    saveMessages(newMessages);
    setLoadingThumbnail(null);
  };

  const handleRegenerateThumbnails = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex <= 0) return;

    const userMessage = messages[messageIndex - 1];
    if (userMessage.role !== 'user') return;

    const loadingMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '正在重新生成方案，请稍候...',
    };

    const newMessages = [...messages.slice(0, messageIndex), loadingMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage.content.replace('（已上传背景图）', ''),
          posterType: selectedType,
          colorScheme: selectedColorScheme,
          typography: selectedTypography,
          messages: messages.slice(0, messageIndex).map(m => ({
            role: m.role,
            content: m.content,
          })),
          mode: 'thumbnails',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const thumbnails = data.data?.map((img: { url: string }) => img.url) || [];
      
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '已重新生成海报，请选择一个生成高清图：',
        thumbnails: thumbnails,
      };

      const finalMessages = [...newMessages.slice(0, -1), assistantMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `重新生成失败：${error instanceof Error ? error.message : '未知错误'}`,
      };
      const finalMessages = [...newMessages.slice(0, -1), errorMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    const nonEmptyConversations = conversations.filter(c => c.id !== EMPTY_CONVERSATION_ID);
    const emptyConv = createEmptyConversation();
    const updatedConversations = [emptyConv, ...nonEmptyConversations];
    
    setConversations(updatedConversations);
    setCurrentConversationId(emptyConv.id);
    setMessages(emptyConv.messages);
    setBackgroundImage(null);
    setShowConversationList(false);
    
    setTimeout(() => {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleSelectConversation = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentConversationId(id);
      setMessages(conv.messages);
      setBackgroundImage(null);
      setShowConversationList(false);
      
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleDeleteConversation = (id: string) => {
    const updatedConversations = deleteConversation(conversations, id);
    const nonEmptyConversations = updatedConversations.filter(c => c.id !== EMPTY_CONVERSATION_ID);
    
    if (currentConversationId === id) {
      const emptyConv = createEmptyConversation();
      const finalConversations = [emptyConv, ...nonEmptyConversations];
      setConversations(finalConversations);
      setCurrentConversationId(emptyConv.id);
      setMessages(emptyConv.messages);
      saveConversations(nonEmptyConversations);
    } else {
      const emptyConv = createEmptyConversation();
      const finalConversations = [emptyConv, ...nonEmptyConversations];
      setConversations(finalConversations);
      saveConversations(nonEmptyConversations);
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
                  {message.thumbnails && message.thumbnails.length > 0 && (
                    <div className="mt-3">
                      <div className="grid grid-cols-2 gap-3">
                        {message.thumbnails.map((thumb, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setLoadingThumbnail(thumb);
                              handleSelectThumbnail(thumb, messages.findIndex(m => m.id === message.id));
                            }}
                            disabled={loadingThumbnail !== null}
                            className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 transition-all disabled:opacity-70"
                          >
                            <img
                              src={thumb}
                              alt={`海报 ${idx + 1}`}
                              className="w-full aspect-square object-cover"
                            />
                            {loadingThumbnail === thumb && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-white text-xs">生成高清图中...</span>
                                </div>
                              </div>
                            )}
                            {loadingThumbnail !== thumb && (
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-purple-600 px-3 py-1.5 rounded">
                                  生成高清图
                                </span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleRegenerateThumbnails(message.id)}
                        disabled={loadingThumbnail !== null}
                        className="mt-3 w-full py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        对所有海报都不满意？重新生成
                      </button>
                    </div>
                  )}
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
                <div className="message-assistant rounded-2xl px-4 py-3 shadow-message max-w-[90%]">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 text-sm">{loadingStatus || '海报生成中，请耐心等待'}</span>
                      <div className="flex items-center gap-1 h-4">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">正在生成中，请保持页面打开（最多3分钟）</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-area p-4 safe-area-bottom flex-shrink-0 shadow-input">
          {isUploadingImage && (
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>图片上传完成后才可以输入内容</span>
            </div>
          )}
          
          {backgroundImage && !isUploadingImage && (
            <div className="mb-3 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              <img 
                src={backgroundImage} 
                alt="背景图预览" 
                className="w-12 h-12 object-cover rounded border border-gray-200"
              />
              <span className="text-sm text-gray-600">已上传完成，可以开始生成</span>
              <button
                onClick={handleRemoveBackground}
                className="text-red-500 hover:text-red-700 text-sm ml-auto"
              >
                移除
              </button>
            </div>
          )}
          
          <MessageInput
            onSend={handleSendMessage}
            disabled={isLoading || isUploadingImage}
            placeholder={isUploadingImage ? "图片上传中，请稍候..." : "告诉我你的海报需求，比如用途、文案、风格以及发布平台"}
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
