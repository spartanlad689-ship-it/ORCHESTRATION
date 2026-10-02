import React from 'react';
import { Zap, Brain, Sparkles, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ApiKeys } from '../types/orchestrator';

interface BrainVisualizerProps {
  isProcessing: boolean;
  apiKeys: ApiKeys;
  hasEnvGemini: boolean;
  activeNode: 'all' | 'groq' | 'deepseek' | 'gemini';
  onSelectNode: (node: 'all' | 'groq' | 'deepseek' | 'gemini') => void;
  latencies?: {
    groq?: number;
    deepseek?: number;
    gemini?: number;
  };
}

export const BrainVisualizer: React.FC<BrainVisualizerProps> = ({
  isProcessing,
  apiKeys,
  hasEnvGemini,
  activeNode,
  onSelectNode,
  latencies,
}) => {
  const isGroqLive = Boolean(apiKeys.groq && apiKeys.groq.trim().length > 0);
  const isDeepSeekLive = Boolean(apiKeys.deepseek && apiKeys.deepseek.trim().length > 0);
  const isGeminiLive = Boolean((apiKeys.gemini && apiKeys.gemini.trim().length > 0) || hasEnvGemini);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-900/95 p-6 backdrop-blur-xl shadow-2xl">
      {/* Background ambient glow effects */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Brain className={`h-5 w-5 text-cyan-400 ${isProcessing ? 'animate-pulse' : ''}`} />
            </div>
            {isProcessing && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white">TriBrain Cognitive Core</h2>
              <span className="inline-flex items-center rounded-full bg-indigo-950/80 px-2.5 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-800/50">
                Single Unified Mind
              </span>
            </div>
            <p className="text-xs text-slate-400">
              3 Specialized Intelligence Nodes synchronized in parallel orchestration
            </p>
          </div>
        </div>

        {/* Global status pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 px-3 py-1.5 border border-slate-800 text-slate-300">
            <Activity className={`h-3.5 w-3.5 ${isProcessing ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
            <span className="font-medium">{isProcessing ? 'Synchronizing Minds...' : 'Cortex Idle & Armed'}</span>
          </span>
          <button
            onClick={() => onSelectNode('all')}
            className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeNode === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Show All
          </button>
        </div>
      </div>

      {/* Interactive 3-AI Neural Grid */}
      <div className="relative mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Node 1: GROQ */}
        <div
          onClick={() => onSelectNode(activeNode === 'groq' ? 'all' : 'groq')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-4.5 transition-all duration-300 ${
            activeNode === 'groq'
              ? 'border-amber-500/80 bg-amber-950/30 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/50'
              : 'border-slate-800/80 bg-slate-900/50 hover:border-amber-500/40 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner group-hover:scale-105 transition-transform">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white tracking-wide">GROQ</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    LPU Core
                  </span>
                </div>
                <p className="text-xs text-amber-400/90 font-medium">Category 1: Rapid Execution & Triage</p>
              </div>
            </div>
            
            <div className="text-right">
              {isGroqLive ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Live Key
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/80">
                  <ShieldAlert className="h-3 w-3" /> Sandbox
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-400 leading-relaxed">
            Specialized in ultra-low latency prompt decomposition, atomic architectural blueprints, and high-speed execution.
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Throughput: <strong className="text-slate-200">500+ tok/s</strong>
            </span>
            <span>
              Latency: <strong className="text-amber-300">{latencies?.groq ? `${latencies.groq}ms` : '--'}</strong>
            </span>
          </div>
        </div>

        {/* Node 2: DEEPSEEK */}
        <div
          onClick={() => onSelectNode(activeNode === 'deepseek' ? 'all' : 'deepseek')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-4.5 transition-all duration-300 ${
            activeNode === 'deepseek'
              ? 'border-purple-500/80 bg-purple-950/30 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/50'
              : 'border-slate-800/80 bg-slate-900/50 hover:border-purple-500/40 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 shadow-inner group-hover:scale-105 transition-transform">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white tracking-wide">DEEPSEEK</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    R1 / V3
                  </span>
                </div>
                <p className="text-xs text-purple-400/90 font-medium">Category 2: Deep Math & Logic</p>
              </div>
            </div>

            <div className="text-right">
              {isDeepSeekLive ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Live Key
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-400/80">
                  <ShieldAlert className="h-3 w-3" /> Sandbox
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-400 leading-relaxed">
            Specialized in rigorous chain-of-thought proofs, mathematical invariant analysis, and exhaustive edge-case audits.
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              Reasoning: <strong className="text-slate-200">Formal Verification</strong>
            </span>
            <span>
              Latency: <strong className="text-purple-300">{latencies?.deepseek ? `${latencies.deepseek}ms` : '--'}</strong>
            </span>
          </div>
        </div>

        {/* Node 3: GEMINI */}
        <div
          onClick={() => onSelectNode(activeNode === 'gemini' ? 'all' : 'gemini')}
          className={`group relative cursor-pointer overflow-hidden rounded-xl border p-4.5 transition-all duration-300 ${
            activeNode === 'gemini'
              ? 'border-cyan-500/80 bg-cyan-950/30 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/50'
              : 'border-slate-800/80 bg-slate-900/50 hover:border-cyan-500/40 hover:bg-slate-900/80'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-inner group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white tracking-wide">GEMINI</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Master Core
                  </span>
                </div>
                <p className="text-xs text-cyan-400/90 font-medium">Category 3: Multimodal Synthesis</p>
              </div>
            </div>

            <div className="text-right">
              {isGeminiLive ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Live Engine
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400/80">
                  <ShieldAlert className="h-3 w-3" /> Needs Key
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-400 leading-relaxed">
            Specialized in cognitive synthesis, massive context comprehension, architecture unification, and definitive answers.
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Role: <strong className="text-slate-200">Unified Orchestrator</strong>
            </span>
            <span>
              Latency: <strong className="text-cyan-300">{latencies?.gemini ? `${latencies.gemini}ms` : '--'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Synapse Connection Pipeline Flow Indicator */}
      <div className="relative mt-5 rounded-xl border border-slate-800/70 bg-slate-950/70 p-3.5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 font-medium">Groq (Speed)</span>
          </div>
          <span className="text-slate-600 font-bold">+</span>
          <div className="flex items-center space-x-1.5">
            <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-300 font-medium">DeepSeek (Logic)</span>
          </div>
          <span className="text-slate-600 font-bold">➔</span>
          <div className="flex items-center space-x-1.5">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-300 font-medium">Gemini (Master Synthesis)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="hidden sm:inline">Brain Synchronization:</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Harmonized Tri-Mind Active
          </span>
        </div>
      </div>
    </div>
  );
};
