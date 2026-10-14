import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Terminal, FileCode } from 'lucide-react';

export interface CompiledPromptViewerProps {
  compiledPrompt: string;
  tokenCount?: number;
  className?: string;
  defaultExpanded?: boolean;
}

/**
 * Modular AI Prompt Builder: Compiled Prompt Viewer
 * Provides auditable preview of compiled system instructions, injected context, and user payload.
 */
export const CompiledPromptViewer: React.FC<CompiledPromptViewerProps> = ({
  compiledPrompt,
  tokenCount,
  className = '',
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  // Approximate token calculation if not provided (1 token ~= 4 characters)
  const estimatedTokens = tokenCount ?? Math.ceil(compiledPrompt.length / 4);

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border border-[#E4E0D6] bg-white overflow-hidden shadow-xs ${className}`}>
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#F6F4EF] border-b border-[#E4E0D6]">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-[#0F8B8D]" />
          <span className="text-xs font-bold text-[#14213D] truncate">
            Compiled Prompt Payload Preview
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            ~{estimatedTokens} Tokens
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] font-semibold text-[#0F8B8D] hover:underline flex items-center gap-1 cursor-pointer px-2 py-1 rounded border border-[#0F8B8D]/30 hover:bg-[#0F8B8D]/10 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-200 cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 bg-[#14213D] text-slate-200">
          <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-72 select-all">
            {compiledPrompt || '(No prompt compiled yet)'}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CompiledPromptViewer;
