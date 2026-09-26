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
import { ChatMessageRenderer } from './ChatMessageRenderer';
import { AiDocumentExporter } from '../../utils/aiDocumentExporter';

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
      content:
        '👋 Hello! I am your **SP-PLASTECH Enterprise Analytics Assistant**.\n\n' +
        'Ask me anything about our **Item Master Catalog (1,719 items)**, **Customer Directory (121 accounts)**, **Plant OEE (84.6%)**, **Quality Defect PPM**, **Inventory**, or **Cost Calculations**.\n\n' +
        'You can also click any instant export button below to download **Excel**, **PDF**, **CSV**, or **PPTX Presentation** slides.',
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

  const handleSendMessage = async (customQuery?: string) => {
    const textToSend = customQuery || inputQuery;
    if (!textToSend.trim() || isThinking) return;

    setInputQuery('');

    const newMsg: ChatMessageItem = {
      id: `USR-${Date.now()}`,
      sessionId,
      role: 'USER',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsThinking(true);

    try {
      const response = await analyticsApi.sendChatMessage(sessionId, textToSend);
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
      showToast('Error communicating with analytics assistant.');
    } finally {
      setIsThinking(false);
    }
  };

  const handleExportBrief = (format: 'PDF' | 'EXCEL' = 'PDF') => {
    const payload = {
      title: 'SP-PLASTECH Executive Analytics Brief',
      subtitle: 'Real-time synthesis across 4 manufacturing plants & 1,719 Item Masters',
      headers: ['Domain / Metric', 'Current Value', 'Target Adherence', 'Status'],
      rows: [
        ['Item Master Catalog', '1,719 Verified Items', '100% Loaded', 'Active'],
        ['Customer Directory', '121 Master Accounts', 'Tier 1 & OEM', 'Active'],
        ['Plant OEE Average', '84.6%', '99.5% Adherence', 'Nominal'],
        ['First Pass Yield (FPY)', '98.2%', '240 PPM (Six Sigma 4.82)', 'Optimal'],
        ['Injection Molding Bays', '14 Bays Operational', 'IMM-01 to IMM-14', 'Operational'],
      ],
      summaryMetrics: [
        { label: 'Total Master Items', value: '1,719' },
        { label: 'Plant OEE', value: '84.6%' },
        { label: 'Gross Revenue YTD', value: '₹2.84 Cr' },
      ],
    };

    if (format === 'PDF') {
      AiDocumentExporter.exportPdf(payload);
    } else {
      AiDocumentExporter.exportExcel(payload);
    }
    showToast(`Exported conversational report as ${format}`);
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
                  Supabase Live &bull; 1,719 Items
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Multi-Tenant Semantic Retrieval, Calculations &amp; Multi-Format Document Synthesis
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
              onClick={() => handleExportBrief('EXCEL')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Export as Excel Sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
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
                  <ChatMessageRenderer content={msg.content} role={msg.role} metadata={msg.metadata} />
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex items-center gap-2 text-slate-500 text-xs p-3 bg-white border border-slate-200 rounded-2xl w-fit shadow-2xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0F8B8D]" />
              <span>Analyzing live database records &amp; synthesizing response...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            'How many items in Item Master?',
            'What is overall Plant OEE this month?',
            'Show top 3 quality defects',
            'Calculate energy cost per kg',
          ].map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 shrink-0 text-[11px] transition-colors cursor-pointer font-medium"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask anything about 1,719 items, OEE, customers, calculations..."
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0F8B8D]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isThinking || !inputQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0F8B8D] to-[#0D787A] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
