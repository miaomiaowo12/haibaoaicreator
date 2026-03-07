export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  generatedImage?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'poster_ai_conversations';

export function getConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('保存对话失败:', error);
  }
}

export function createConversation(): Conversation {
  return {
    id: `conv-${Date.now()}`,
    title: '新对话',
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: '你好！我是AI海报生成助手 ✨\n\n你可以这样描述：\n• 春节祝福海报，阖家欢乐万事如意，中国风，发在朋友圈\n• 新店开业宣传，奶茶店，温馨风格，发在小红书\n• 或者直接告诉我你的想法，我来帮你实现~',
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function updateConversation(
  conversations: Conversation[],
  conversationId: string,
  messages: Message[]
): Conversation[] {
  return conversations.map((conv) => {
    if (conv.id === conversationId) {
      const userMessages = messages.filter(m => m.role === 'user');
      const title = userMessages.length > 0 
        ? userMessages[0].content.slice(0, 20) + (userMessages[0].content.length > 20 ? '...' : '')
        : '新对话';
      return {
        ...conv,
        messages,
        title,
        updatedAt: Date.now(),
      };
    }
    return conv;
  });
}

export function deleteConversation(
  conversations: Conversation[],
  conversationId: string
): Conversation[] {
  return conversations.filter((conv) => conv.id !== conversationId);
}
