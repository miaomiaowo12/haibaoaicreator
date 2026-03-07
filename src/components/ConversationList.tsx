'use client';

import { Conversation } from '@/lib/conversationStore';

interface ConversationListProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}

export default function ConversationList({
  conversations,
  currentId,
  onSelect,
  onDelete,
  onNew,
  onClose,
}: ConversationListProps) {
  const nonEmptyConversations = conversations.filter(conv => conv.messages.length > 0);
  const sortedConversations = [...nonEmptyConversations].sort((a, b) => b.updatedAt - a.updatedAt);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 animate-fade-in" onClick={onClose}>
      <div 
        className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white flex flex-col animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">历史对话</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <button
          onClick={onNew}
          className="m-4 p-3 btn-primary rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建对话
        </button>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {sortedConversations.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">
              暂无历史对话
            </div>
          ) : (
            sortedConversations.map((conv) => (
              <div
                key={conv.id}
                className={`relative p-3 rounded-xl cursor-pointer transition-all ${
                  currentId === conv.id
                    ? 'bg-purple-50 border-2 border-purple-200'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
                onClick={() => onSelect(conv.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">{conv.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(conv.updatedAt)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定要删除这个对话吗？')) {
                        onDelete(conv.id);
                      }
                    }}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    title="删除对话"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
