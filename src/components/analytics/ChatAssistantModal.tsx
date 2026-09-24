import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';
import { analyticsApi } from '../../services/analytics/analytics.api';
import { ChatMessageItem } from '../../types/analyticsTypes';

interface ChatAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string) => void;
}

export const ChatAssistantModal: React.FC<ChatAssistantModalProps> = ({
  isOpen,
  onClose,
  showToast = (_m: string) => {},
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'MSG-INIT',
      sessionId: 'SESS-LIVE',
      role: 'ASSISTANT',
      content: `Hello! I am your SP-PLASTECH Enterprise Analytics Assistant. Ask me anything about plant OEE, quality PPM, inventory aging, SCM OTIF, ESG metrics, or maintenance MTBF/MTTR to generate customized executive reports.`,
      metadata: { isSystemGreeting: true },
      createdAt: new Date().toISOString(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string>('SESS-LIVE');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if (!inputQuery.trim() || isThinking) return;

    const userText = inputQuery.trim();
    setInputQuery('');

    const newMsg: ChatMessageItem = {
      id: `USR-${Date.now()}`,
      sessionId,
      role: 'USER',
      content: userText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsThinking(true);

    try {
      const response = await analyticsApi.sendChatMessage(sessionId, userText);
      const assistantMsg: ChatMessageItem = {
        id: `AST-${Date.now()}`,
        sessionId,
        role: 'ASSISTANT',
        content: response.reply,
        metadata: response.metadata,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      showToast('Error communicating with RAG assistant.');
    } finally {
      setIsThinking(false);
    }
  };

  const handleExportBrief = async (format: 'PDF' | 'EXCEL' = 'PDF') => {
    try {
      await analyticsApi.exportChatToDocument(sessionId, {
        format,
        documentTitle: 'SP-PLASTECH AI Executive Brief',
      });
      showToast(`Exported conversational report as ${format}`);
    } catch {
      showToast('Export failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px] max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-teal-50/80 via-white to-orange-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F8B8D] to-[#E8622C] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>SP-PLASTECH RAG Analytics Assistant</span>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded-full">
                  Live RAG v2.4
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Multi-Tenant Semantic Retrieval &amp; AI Document Synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleExportBrief('PDF')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Export Conversation as PDF Report"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/40">
          {messages.map((msg) => {
            const isUser = msg.role === 'USER';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser ? 'bg-[#14213D] text-white' : 'bg-[#0F8B8D] text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#14213D] text-white rounded-tr-none shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Document Structure Card Preview if available */}
                  {!isUser && msg.metadata?.documentStructure && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5 text-[11px]">
                      <div className="font-bold text-[#0F8B8D] flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Synthesized Executive Sections:</span>
                      </div>
                      <div className="space-y-1 pl-2">
                        {msg.metadata.documentStructure.sections?.map((sec: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E8622C]" />
                            <strong>{sec.title}:</strong>
                            <span className="truncate max-w-[340px] text-slate-500">{sec.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={`text-[9px] mt-1.5 text-right font-mono ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex gap-2.5 mr-auto max-w-[80%] items-center text-xs text-slate-500 p-2">
              <div className="w-7 h-7 rounded-xl bg-[#0F8B8D]/20 text-[#0F8B8D] flex items-center justify-center animate-pulse">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-2xl shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-[#0F8B8D] animate-ping" />
                <span className="font-medium text-slate-600">Querying semantic vector index...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Question Prompts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] text-slate-600">
          <span className="font-bold text-slate-400 shrink-0">Suggestions:</span>
          {[
            'OEE Breakdown for Press 04',
            'Quality Defect PPM Root Cause',
            'Slow-Moving Inventory Over 90 Days',
            'Scope 1-3 Carbon Footprint Summary',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => setInputQuery(prompt)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-[#0F8B8D] hover:text-[#0F8B8D] whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Query Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Ask AI assistant about OEE, defects, inventory aging, or sustainability..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#0F8B8D] transition-all"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputQuery.trim() || isThinking}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0F8B8D] to-[#0D787A] text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 shadow-sm cursor-pointer disabled:opacity-40 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
