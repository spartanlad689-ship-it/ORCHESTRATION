import React, { useState } from 'react';
import { 
  Zap, 
  Brain, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Activity, 
  CheckCircle2, 
  ShieldAlert,
  Gauge
} from 'lucide-react';
import { SpecialistNodeTelemetry } from '../types/orchestrator';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SpecialistCardProps {
  type: 'groq' | 'deepseek' | 'gemini';
  data: SpecialistNodeTelemetry;
  isExpanded?: boolean;
}

export const SpecialistCard: React.FC<SpecialistCardProps> = ({
  type,
  data,
  isExpanded: defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTheme = () => {
    switch (type) {
      case 'groq':
        return {
          icon: <Zap className="h-5 w-5 text-amber-400" />,
          title: 'GROQ LPU Node',
          badge: 'Category 1: Rapid Execution & Triage',
          badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          borderClass: 'border-amber-500/40 hover:border-amber-500/60',
          bgClass: 'bg-gradient-to-b from-amber-950/20 to-slate-900/60',
          accentText: 'text-amber-400',
          metricLabel: 'LPU Rate',
          metricVal: '~560 tok/s',
        };
      case 'deepseek':
        return {
          icon: <Brain className="h-5 w-5 text-purple-400" />,
          title: 'DEEPSEEK Node',
          badge: 'Category 2: Deep Math & Invariant Logic',
          badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          borderClass: 'border-purple-500/40 hover:border-purple-500/60',
          bgClass: 'bg-gradient-to-b from-purple-950/20 to-slate-900/60',
          accentText: 'text-purple-400',
          metricLabel: 'Reasoning Mode',
          metricVal: 'Formal CoT Proof',
        };
      case 'gemini':
      default:
        return {
          icon: <Sparkles className="h-5 w-5 text-cyan-400" />,
          title: 'GEMINI Core',
          badge: 'Category 3: Multimodal & Synthesis Master',
          badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          borderClass: 'border-cyan-500/40 hover:border-cyan-500/60',
          bgClass: 'bg-gradient-to-b from-cyan-950/20 to-slate-900/60',
          accentText: 'text-cyan-400',
          metricLabel: 'Integration Score',
          metricVal: '100% Unified',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`rounded-2xl border ${theme.borderClass} ${theme.bgClass} overflow-hidden shadow-xl backdrop-blur-md transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 px-5 py-4 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
            {theme.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">{theme.title}</h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.badgeClass}`}>
                {theme.badge}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Model: <strong className="text-slate-300">{data.model}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {data.isLive ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Live Hardware
                  </span>
                ) : (
                  <span className="text-amber-400/80 flex items-center gap-1 font-medium">
                    <ShieldAlert className="h-3 w-3" /> Sandbox Node
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry pill & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800/80">
            <span className="flex items-center gap-1 text-slate-400">
              <Activity className="h-3.5 w-3.5 text-indigo-400" />
              Latency: <strong className={theme.accentText}>{data.latencyMs}ms</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Gauge className="h-3.5 w-3.5 text-slate-400" />
              {theme.metricLabel}: <strong className="text-slate-200">{theme.metricVal}</strong>
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Copy specialist output"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Output Content */}
      <div className={`p-5 transition-all duration-300 ${expanded ? 'block' : 'max-h-64 overflow-hidden relative'}`}>
        <MarkdownRenderer content={data.output} />

        {!expanded && (
          <div className="absolute inset-x-0 bottom-0 flex h-24 items-end justify-center bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pb-3">
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-lg hover:bg-slate-800 transition-colors"
            >
              <span>Expand Specialist Analysis</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
