import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { analyticsApi } from '../../services/analytics/analytics.api';
import { ChatMessageItem } from '../../types/analyticsTypes';
import { ChatMessageRenderer } from './ChatMessageRenderer';

interface FixedBottomChatWidgetProps {
  showToast?: (msg: string) => void;
  defaultTenantId?: string;
}

export const FixedBottomChatWidget: React.FC<FixedBottomChatWidgetProps> = ({
  showToast = () => {},
  defaultTenantId = 'TENANT-ALPHA-IND',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'MSG-INIT',
      sessionId: 'SESS-LIVE-FLOAT',
      role: 'ASSISTANT',
      content:
        '👋 Welcome to **SP-PLASTECH AI Assistant**.\n\n' +
        'Ask me anything about **Item Master Catalog (1,719 items)**, **Customer Accounts (121)**, **Plant OEE Telemetry**, **Quality PPM**, or **Calculations**.\n\n' +
        'You can also click any download button below to instantly export **Excel**, **PDF**, **CSV**, or **PPTX Presentation** decks.',
      createdAt: new Date().toISOString(),
    },
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isThinking) return;

    setInputQuery('');
    const userMsg: ChatMessageItem = {
      id: `USR-${Date.now()}`,
      sessionId: 'SESS-LIVE-FLOAT',
      role: 'USER',
      content: query,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await analyticsApi.sendChatMessage('SESS-LIVE-FLOAT', query);
      const botMsg: ChatMessageItem = {
        id: `AST-${Date.now()}`,
        sessionId: 'SESS-LIVE-FLOAT',
        role: 'ASSISTANT',
        content: response.reply,
        metadata: response.metadata,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      showToast('AI Query processing fallback.');
    } finally {
      setIsThinking(false);
    }
  };

  const quickPrompts = [
    'How many items in Item Master?',
    'What is overall Plant OEE this month?',
    'Show top quality scrap defects',
    'Calculate energy cost per kg',
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Chat Drawer */}
      {isOpen && (
        <div
          className={`w-[360px] sm:w-[440px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 mb-3 ${
            isMinimized ? 'h-14' : 'h-[560px]'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-[#14213D] to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>AI Copilot &bull; ERP Brain</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-slate-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Sub-50ms Supabase Connected &bull; 1,719 Items</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Content */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs bg-slate-50/50">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${m.role === 'USER' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                        m.role === 'USER'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gradient-to-tr from-teal-600 to-emerald-600 text-white shadow-xs'
                      }`}
                    >
                      {m.role === 'USER' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl shadow-2xs leading-relaxed ${
                        m.role === 'USER'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      <ChatMessageRenderer content={m.content} role={m.role} metadata={m.metadata} />
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs italic p-2.5 bg-white rounded-xl border border-slate-200 w-fit">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    <span>Analyzing live database records...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Pills */}
              <div className="px-3 py-1.5 bg-slate-100/80 border-t border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(qp)}
                    className="px-2.5 py-1 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 shrink-0 transition-colors cursor-pointer font-medium"
                  >
                    {qp}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about 1,719 items, OEE, customers..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isThinking || !inputQuery.trim()}
                  className="p-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#0F8B8D] via-[#0D787A] to-[#14213D] hover:scale-105 text-white rounded-full shadow-2xl border-2 border-teal-400/40 transition-all duration-200 cursor-pointer"
        title="Open AI ERP Assistant"
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
        <span className="text-xs font-bold tracking-wide">Ask AI Assistant</span>
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
        </span>
      </button>
    </div>
  );
};
