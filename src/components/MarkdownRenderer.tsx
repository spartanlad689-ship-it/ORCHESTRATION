import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse markdown into blocks
  const parseBlocks = (raw: string) => {
    const lines = raw.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let codeLang = '';
    let blockIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start / end
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          const fullCode = codeBuffer.join('\n');
          const currentIdx = blockIndex++;
          elements.push(
            <div key={`code-${currentIdx}`} className="relative my-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 py-2 text-xs">
                <span className="font-mono text-cyan-400 font-semibold tracking-wider uppercase">
                  {codeLang || 'code'}
                </span>
                <button
                  onClick={() => handleCopyCode(fullCode, currentIdx)}
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  {copiedIndex === currentIdx ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
                <code>{fullCode}</code>
              </pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
          codeLang = '';
        } else {
          inCodeBlock = true;
          codeLang = line.trim().replace(/^```/, '').trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${blockIndex++}`} className="mt-6 mb-3 text-base font-bold text-cyan-300 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            {formatInlineText(line.replace('### ', ''))}
          </h3>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${blockIndex++}`} className="mt-7 mb-3 text-lg font-bold text-white border-b border-slate-800/80 pb-2">
            {formatInlineText(line.replace('## ', ''))}
          </h2>
        );
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${blockIndex++}`} className="mt-8 mb-4 text-xl font-extrabold text-white">
            {formatInlineText(line.replace('# ', ''))}
          </h1>
        );
        continue;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={`quote-${blockIndex++}`} className="my-3 border-l-4 border-indigo-500/80 bg-indigo-950/20 pl-4 py-2 text-xs italic text-indigo-200 rounded-r-lg">
            {formatInlineText(line.replace(/^>\s*/, ''))}
          </blockquote>
        );
        continue;
      }

      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const text = line.trim().replace(/^[-*]\s*/, '');
        elements.push(
          <li key={`li-${blockIndex++}`} className="ml-5 my-1 list-disc text-xs text-slate-300 leading-relaxed">
            {formatInlineText(text)}
          </li>
        );
        continue;
      }

      // Numbered items (1. 2.)
      if (/^\s*\d+\.\s/.test(line)) {
        const text = line.replace(/^\s*\d+\.\s*/, '');
        elements.push(
          <li key={`nli-${blockIndex++}`} className="ml-5 my-1.5 list-decimal text-xs text-slate-300 leading-relaxed">
            {formatInlineText(text)}
          </li>
        );
        continue;
      }

      // Empty line
      if (!line.trim()) {
        elements.push(<div key={`sp-${blockIndex++}`} className="h-2" />);
        continue;
      }

      // Regular paragraph
      elements.push(
        <p key={`p-${blockIndex++}`} className="my-2 text-xs leading-relaxed text-slate-300">
          {formatInlineText(line)}
        </p>
      );
    }

    // Flush any leftover code block
    if (inCodeBlock && codeBuffer.length > 0) {
      elements.push(
        <div key={`code-${blockIndex++}`} className="relative my-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-slate-200">
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        </div>
      );
    }

    return elements;
  };

  // Helper for inline bold, code, and links
  const formatInlineText = (text: string): React.ReactNode => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[11px] text-amber-300 border border-slate-700/60">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className={`prose-invert max-w-none text-slate-300 ${className}`}>
      {parseBlocks(content)}
    </div>
  );
};
