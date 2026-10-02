/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  Sparkles, 
  Send, 
  Key, 
  Layers, 
  RefreshCw, 
  History, 
  Check, 
  Sliders, 
  Share2, 
  ChevronRight, 
  Cpu, 
  ShieldCheck, 
  FileText,
  AlertTriangle,
  Flame,
  ArrowRight,
  MessageSquare,
  Globe,
  Radio,
  Palette,
  Cloud,
  FileDown
} from 'lucide-react';
import { 
  OrchestrationMode, 
  ApiKeys, 
  ModelSelection, 
  OrchestrationResult, 
  PRESET_PROMPTS,
  PresetPrompt 
} from './types/orchestrator';
import { BrainVisualizer } from './components/BrainVisualizer';
import { KeyVaultModal } from './components/KeyVaultModal';
import { SpecialistCard } from './components/SpecialistCard';
import { TelemetryHUD } from './components/TelemetryHUD';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { AuthHeader } from './components/AuthHeader';
import { ChatbotPanel } from './components/ChatbotPanel';
import { GroundingPanel } from './components/GroundingPanel';
import { VoiceStudioPanel } from './components/VoiceStudioPanel';
import { CreativeStudioPanel } from './components/CreativeStudioPanel';
import { CloudLibraryPanel } from './components/CloudLibraryPanel';
import { exportMasterSolutionToPdf } from './utils/pdfExport';
import { useAuth } from './firebase/AuthContext';
import { db } from './firebase/config';
import { collection, addDoc } from 'firebase/firestore';

const LOCAL_STORAGE_KEYS = 'tribrain_api_keys_v1';
const LOCAL_STORAGE_MODELS = 'tribrain_models_v1';

export default function App() {
  const { user } = useAuth();

  // Navigation state
  const [activeStudioTab, setActiveStudioTab] = useState<'orchestrator' | 'chatbot' | 'grounding' | 'voice' | 'creative' | 'library'>('orchestrator');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini: '',
    groq: '',
    deepseek: '',
  });

  const [models, setModels] = useState<ModelSelection>({
    gemini: 'gemini-3.8-flash',
    groq: 'llama-3.3-70b-versatile',
    deepseek: 'deepseek-chat',
  });

  const [hasEnvGemini, setHasEnvGemini] = useState<boolean>(false);
  const [isKeyVaultOpen, setIsKeyVaultOpen] = useState<boolean>(false);

  // Orchestrator states
  const [prompt, setPrompt] = useState<string>('');
  const [mode, setMode] = useState<OrchestrationMode>('tri-synthesis');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'master' | 'groq' | 'deepseek' | 'gemini' | 'telemetry'>('master');
  const [activeVisualizerNode, setActiveVisualizerNode] = useState<'all' | 'groq' | 'deepseek' | 'gemini'>('all');
  
  // Current and historical results
  const [currentResult, setCurrentResult] = useState<OrchestrationResult | null>(null);
  const [history, setHistory] = useState<OrchestrationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedMaster, setCopiedMaster] = useState<boolean>(false);
  const [executionStep, setExecutionStep] = useState<string>('');

  // Load stored keys on mount and check health
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem(LOCAL_STORAGE_KEYS);
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }
      const savedModels = localStorage.getItem(LOCAL_STORAGE_MODELS);
      if (savedModels) {
        setModels(JSON.parse(savedModels));
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }

    // Health check
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasEnvGemini) {
          setHasEnvGemini(true);
        }
      })
      .catch((err) => console.error('Health check failed', err));
  }, []);

  const handleSaveKeys = (newKeys: ApiKeys) => {
    setApiKeys(newKeys);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS, JSON.stringify(newKeys));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  };

  const handleSaveModels = (newModels: ModelSelection) => {
    setModels(newModels);
    try {
      localStorage.setItem(LOCAL_STORAGE_MODELS, JSON.stringify(newModels));
    } catch (e) {
      console.warn('Could not save models to localStorage', e);
    }
  };

  const handleSelectPreset = (preset: PresetPrompt) => {
    setPrompt(preset.prompt);
    setMode(preset.mode);
  };

  const handleCopyMaster = () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(currentResult.masterSolution);
    setCopiedMaster(true);
    setTimeout(() => setCopiedMaster(false), 2000);
  };

  const handleExecute = async () => {
    if (!prompt.trim() || isProcessing) return;

    setError(null);
    setIsProcessing(true);
    setExecutionStep('Initializing 3-AI Single Brain synapse matrix...');

    const timer1 = setTimeout(() => {
      setExecutionStep('Parallel Execution: Groq (LPU Speed) & DeepSeek (Math Rigor)...');
    }, 400);

    const timer2 = setTimeout(() => {
      setExecutionStep('Stage 2: Gemini Core synthesizing outputs into Master Brain solution...');
    }, 1800);

    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode,
          apiKeys,
          models,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: OrchestrationResult = await response.json();
      data.timestamp = Date.now();
      setCurrentResult(data);
      setHistory((prev) => [data, ...prev.slice(0, 9)]);
      setActiveTab('master');

      // Automatically persist to Firestore for logged in users
      if (user) {
        try {
          await addDoc(collection(db, 'orchestrations'), {
            id: `orch-${Date.now()}`,
            userId: user.uid,
            prompt: prompt.trim(),
            mode,
            masterSolution: data.masterSolution,
            groqSummary: data.telemetry.nodes.groq.output.slice(0, 1000),
            deepseekSummary: data.telemetry.nodes.deepseek.output.slice(0, 1000),
            totalLatencyMs: data.telemetry.totalLatencyMs,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Could not save orchestration run to Firestore:', e);
        }
      }
    } catch (err: any) {
      console.error('Orchestration failed:', err);
      setError(err.message || 'An unexpected error occurred during multi-AI orchestration.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsProcessing(false);
      setExecutionStep('');
    }
  };

  const isGroqConfigured = Boolean(apiKeys.groq && apiKeys.groq.trim().length > 0);
  const isDeepSeekConfigured = Boolean(apiKeys.deepseek && apiKeys.deepseek.trim().length > 0);
  const isGeminiConfigured = Boolean((apiKeys.gemini && apiKeys.gemini.trim().length > 0) || hasEnvGemini);

  const configuredCount = [isGroqConfigured, isDeepSeekConfigured, isGeminiConfigured].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Ambient Glow Mesh */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[1000px] rounded-full bg-gradient-to-b from-indigo-500/15 via-cyan-500/10 to-transparent blur-3xl" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-amber-500 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Brain className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">TriBrain AI</h1>
                <span className="rounded-md bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                  Full 10-Feature Suite
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Gemini • Groq • DeepSeek • Veo 3 • Lyria • Live Voice • Firestore
              </p>
            </div>
          </div>

          {/* Auth Header with Google Sign-in & Key Vault */}
          <AuthHeader
            onOpenVault={() => setIsKeyVaultOpen(true)}
            configuredCount={configuredCount}
          />
        </div>

        {/* Global Studio Tabs */}
        <div className="border-t border-slate-800/60 bg-slate-950/60 px-4 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto py-2 text-xs no-scrollbar">
            <button
              onClick={() => setActiveStudioTab('orchestrator')}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                activeStudioTab === 'orchestrator'
                  ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              <span>3-AI Single Brain</span>
            </button>

            <button
              onClick={() => setActiveStudioTab('chatbot')}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                activeStudioTab === 'chatbot'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Gemini Chatbot</span>
            </button>

            <button
              onClick={() => setActiveStudioTab('grounding')}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                activeStudioTab === 'grounding'
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Search & Maps Grounding</span>
            </button>

            <button
              onClick={() => setActiveStudioTab('voice')}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                activeStudioTab === 'voice'
                  ? 'bg-gradient-to-r from-indigo-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Live Voice & Transcribe</span>
            </button>

            <button
              onClick={() => setActiveStudioTab('creative')}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                activeStudioTab === 'creative'
                  ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Creative Studio (Veo • Lyria • Image)</span>
            </button>

            <button
              onClick={() => setActiveStudioTab('library')}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-1.5 font-semibold transition-all ${
                activeStudioTab === 'library'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Cloud className="h-3.5 w-3.5" />
              <span>Cloud Library</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* VIEW 1: 3-AI SINGLE BRAIN ORCHESTRATION */}
        {activeStudioTab === 'orchestrator' && (
          <div className="space-y-8">
            {/* Brain Visualizer Core */}
            <BrainVisualizer
              isProcessing={isProcessing}
              apiKeys={apiKeys}
              hasEnvGemini={hasEnvGemini}
              activeNode={activeVisualizerNode}
              onSelectNode={setActiveVisualizerNode}
              latencies={
                currentResult
                  ? {
                      groq: currentResult.telemetry.nodes.groq.latencyMs,
                      deepseek: currentResult.telemetry.nodes.deepseek.latencyMs,
                      gemini: currentResult.telemetry.nodes.gemini.latencyMs,
                    }
                  : undefined
              }
            />

            {/* Input & Orchestration Controls Panel */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-2xl space-y-5">
              {/* Orchestration Mode Protocol Selector */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                    Select Synchronization Protocol:
                  </label>
                  <span className="text-xs text-slate-400">
                    Single Brain synchronizes Groq (Speed) + DeepSeek (Logic) + Gemini (Master Synthesis)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMode('tri-synthesis')}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      mode === 'tri-synthesis'
                        ? 'border-cyan-500 bg-cyan-950/30 text-white shadow-lg shadow-cyan-500/10'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-white">
                      <span>🌀 Tri-Mind Synthesis</span>
                      {mode === 'tri-synthesis' && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Parallel execution fused into one authoritative solution.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('specialist-routing')}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      mode === 'specialist-routing'
                        ? 'border-indigo-500 bg-indigo-950/30 text-white shadow-lg shadow-indigo-500/10'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-white">
                      <span>🎯 Autonomous Router</span>
                      {mode === 'specialist-routing' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Assigns lead engine by domain with peer verification.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('debate-consensus')}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      mode === 'debate-consensus'
                        ? 'border-purple-500 bg-purple-950/30 text-white shadow-lg shadow-purple-500/10'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-white">
                      <span>⚖️ Debate & Consensus</span>
                      {mode === 'debate-consensus' && <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Cross-audits trade-offs and forms unanimous verdict.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('parallel-swarm')}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      mode === 'parallel-swarm'
                        ? 'border-amber-500 bg-amber-950/30 text-white shadow-lg shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-white">
                      <span>⚡ Parallel Swarm</span>
                      {mode === 'parallel-swarm' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Side-by-side specialist breakdown and fused matrix.
                    </p>
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                  <span>Domain Benchmark Presets:</span>
                  <span className="text-[11px] text-indigo-400">Click any preset to test the 3-mind pipeline</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {PRESET_PROMPTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 text-left hover:border-slate-700 hover:bg-slate-900 transition-all text-xs group"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 group-hover:text-cyan-400 transition-colors">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                          {p.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{p.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Prompt Textarea */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleExecute();
                    }
                  }}
                  placeholder="Ask anything complex: distributed architecture designs, mathematical proofs, high-performance algorithm implementations, or strategic dilemmas..."
                  className="w-full resize-y rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 leading-relaxed font-sans shadow-inner"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Press <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">Cmd+Enter</kbd> to launch</span>
                    <span>•</span>
                    <span>Synchronous 3-node computation</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {prompt && (
                      <button
                        onClick={() => setPrompt('')}
                        className="rounded-xl px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={!prompt.trim() || isProcessing}
                      onClick={handleExecute}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Synchronizing 3 Minds...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Engage Single Brain</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Execution Step Banner */}
              {isProcessing && (
                <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 text-xs text-indigo-300 animate-pulse">
                  <RefreshCw className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
                  <span>{executionStep || 'TriBrain nodes computing in parallel...'}</span>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-red-200">Orchestration Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Results Workspace */}
            {currentResult && (
              <div className="space-y-6">
                <TelemetryHUD
                  result={currentResult}
                  onCopyMaster={handleCopyMaster}
                  copiedMaster={copiedMaster}
                />

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveTab('master')}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        activeTab === 'master'
                          ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-amber-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Brain className="h-4 w-4" />
                      <span>Master Single Brain Solution</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('groq')}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                        activeTab === 'groq'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-lg'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span>Groq (Speed & Blueprint)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('deepseek')}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                        activeTab === 'deepseek'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-lg'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Cpu className="h-3.5 w-3.5 text-purple-400" />
                      <span>DeepSeek (Logic & Proofs)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('gemini')}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                        activeTab === 'gemini'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Gemini (Synthesis Core)</span>
                    </button>
                  </div>
                </div>

                {activeTab === 'master' && (
                  <div className="relative overflow-hidden rounded-2xl border border-indigo-500/40 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-900 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/20">
                          <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                            <Brain className="h-6 w-6 text-cyan-400" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white tracking-tight">
                              The Single Brain Master Solution
                            </h3>
                            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                              100% Unified
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Harmonized output combining Groq execution speed, DeepSeek mathematical rigor, and Gemini holistic synthesis.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => exportMasterSolutionToPdf(currentResult)}
                          className="flex items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 px-3.5 py-2 text-xs font-semibold text-cyan-200 hover:border-cyan-400 hover:text-white transition-all shadow-md shadow-cyan-500/10"
                          title="Download Master Single Brain Solution as formatted PDF"
                        >
                          <FileDown className="h-4 w-4 text-cyan-400" />
                          <span>Download PDF</span>
                        </button>

                        <button
                          onClick={handleCopyMaster}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-white transition-all shadow-sm"
                        >
                          {copiedMaster ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 text-cyan-400" />
                              <span>Copy Solution</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-950/60 p-6 border border-slate-800/80 shadow-inner">
                      <MarkdownRenderer content={currentResult.masterSolution} />
                    </div>
                  </div>
                )}

                {activeTab === 'groq' && (
                  <SpecialistCard type="groq" data={currentResult.telemetry.nodes.groq} isExpanded={true} />
                )}
                {activeTab === 'deepseek' && (
                  <SpecialistCard type="deepseek" data={currentResult.telemetry.nodes.deepseek} isExpanded={true} />
                )}
                {activeTab === 'gemini' && (
                  <SpecialistCard type="gemini" data={currentResult.telemetry.nodes.gemini} isExpanded={true} />
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: MULTI-TURN GEMINI CHATBOT */}
        {activeStudioTab === 'chatbot' && <ChatbotPanel />}

        {/* VIEW 3: SEARCH & MAPS GROUNDING */}
        {activeStudioTab === 'grounding' && <GroundingPanel />}

        {/* VIEW 4: LIVE VOICE & TRANSCRIPTION */}
        {activeStudioTab === 'voice' && (
          <VoiceStudioPanel
            onUseTranscriptInOrchestrator={(text) => {
              setPrompt(text);
              setActiveStudioTab('orchestrator');
            }}
          />
        )}

        {/* VIEW 5: CREATIVE STUDIO (IMAGE, VEO, LYRIA) */}
        {activeStudioTab === 'creative' && <CreativeStudioPanel />}

        {/* VIEW 6: FIRESTORE CLOUD LIBRARY */}
        {activeStudioTab === 'library' && (
          <CloudLibraryPanel
            onSelectOrchestration={(item) => {
              setPrompt(item.prompt);
              setMode(item.mode);
              setActiveStudioTab('orchestrator');
            }}
          />
        )}
      </main>

      {/* Key Vault Modal */}
      <KeyVaultModal
        isOpen={isKeyVaultOpen}
        onClose={() => setIsKeyVaultOpen(false)}
        apiKeys={apiKeys}
        onSaveKeys={handleSaveKeys}
        models={models}
        onChangeModels={handleSaveModels}
        hasEnvGemini={hasEnvGemini}
      />
    </div>
  );
}
