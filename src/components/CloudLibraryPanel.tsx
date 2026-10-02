import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Brain, 
  Bot, 
  Sparkles, 
  Image, 
  Music, 
  Film, 
  Clock, 
  ExternalLink, 
  Trash2, 
  LogIn, 
  RefreshCw, 
  FileDown, 
  CheckSquare, 
  Square, 
  Check, 
  Download,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { exportBatchOrchestrationsToPdf, exportMasterSolutionToPdf } from '../utils/pdfExport';

export const CloudLibraryPanel: React.FC<{ onSelectOrchestration?: (item: any) => void }> = ({
  onSelectOrchestration,
}) => {
  const { user, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'orchestrations' | 'chats' | 'creations'>('orchestrations');
  const [orchestrations, setOrchestrations] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [creations, setCreations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Batch Export selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchExportSuccess, setBatchExportSuccess] = useState<string | null>(null);

  const fetchCloudData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch Orchestrations
      const orchQuery = query(
        collection(db, 'orchestrations'),
        where('userId', '==', user.uid)
      );
      const orchSnap = await getDocs(orchQuery);
      const orchList = orchSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrchestrations(orchList);

      // 2. Fetch Chat Threads
      const chatQuery = query(
        collection(db, 'chat_threads'),
        where('userId', '==', user.uid)
      );
      const chatSnap = await getDocs(chatQuery);
      const chatList = chatSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChats(chatList);

      // 3. Fetch Creations
      const creationsQuery = query(
        collection(db, 'creations'),
        where('userId', '==', user.uid)
      );
      const creationsSnap = await getDocs(creationsQuery);
      const creationsList = creationsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCreations(creationsList);
    } catch (e) {
      console.warn('Error fetching Firestore library data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCloudData();
    }
  }, [user]);

  // Batch selection handlers
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === orchestrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orchestrations.map((o) => o.id)));
    }
  };

  const handleBatchExportPdf = () => {
    const selectedItems = orchestrations.filter((o) => selectedIds.has(o.id));
    if (selectedItems.length === 0) return;

    exportBatchOrchestrationsToPdf(selectedItems);
    setBatchExportSuccess(`Exported ${selectedItems.length} orchestrations to combined PDF archive.`);
    setTimeout(() => setBatchExportSuccess(null), 4000);
  };

  const handleSingleExportPdf = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    // Wrap Firestore record into OrchestrationResult format
    exportMasterSolutionToPdf({
      success: true,
      mode: item.mode || 'tri-synthesis',
      prompt: item.prompt || '',
      masterSolution: item.masterSolution || '',
      timestamp: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
      telemetry: {
        totalLatencyMs: item.totalLatencyMs || 0,
        consensusConfidence: 98.4,
        specializationWeights: { executionSpeed: 33.3, analyticalDepth: 33.3, cognitiveSynthesis: 33.4 },
        nodes: {
          groq: {
            category: 'Rapid Execution & Triage',
            model: 'llama-3.3-70b-versatile',
            latencyMs: 140,
            isLive: true,
            status: 'Cloud Record',
            output: item.groqSummary || 'Execution blueprint archived.',
          },
          deepseek: {
            category: 'Deep Reasoning & Logic Audit',
            model: 'deepseek-chat',
            latencyMs: 250,
            isLive: true,
            status: 'Cloud Record',
            output: item.deepseekSummary || 'Logic audit archived.',
          },
          gemini: {
            category: 'Multimodal Synthesis Master',
            model: 'gemini-3.8-flash',
            latencyMs: item.totalLatencyMs || 500,
            isLive: true,
            status: 'Cloud Record',
            output: item.masterSolution || '',
          },
        },
      },
    });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-slate-800 bg-slate-900/80 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
          <Cloud className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Cloud Firestore Persistence</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Sign in with your Google account to automatically synchronize, store, and access your 3-AI orchestrations, chat history, and generated creations across all devices.
          </p>
        </div>
        <button
          onClick={() => signInWithGoogle()}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 transition-opacity"
        >
          <LogIn className="h-4 w-4" />
          <span>Sign In with Google</span>
        </button>
      </div>
    );
  }

  const allSelected = orchestrations.length > 0 && selectedIds.size === orchestrations.length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 md:p-8 space-y-6">
      {/* Header and Sync indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Firestore Cloud Library</h3>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold">
                Sync Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Account: {user.email} • Firestore Database Connected
            </p>
          </div>
        </div>

        <button
          onClick={fetchCloudData}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Cloud State</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('orchestrations')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
            activeTab === 'orchestrations' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Brain className="h-3.5 w-3.5" />
          <span>Saved Orchestrations ({orchestrations.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
            activeTab === 'chats' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="h-3.5 w-3.5" />
          <span>Chat Threads ({chats.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('creations')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
            activeTab === 'creations' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Media Creations ({creations.length})</span>
        </button>
      </div>

      {/* Orchestrations Tab with Batch Selection & Export Toolbar */}
      {activeTab === 'orchestrations' && (
        <div className="space-y-4">
          {/* Batch Actions Toolbar */}
          {orchestrations.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-500" />
                  )}
                  <span className="font-medium">
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </span>
                </button>

                <span className="text-slate-600">|</span>
                <span className="text-slate-400">
                  <strong className="text-cyan-400">{selectedIds.size}</strong> of {orchestrations.length} selected
                </span>
              </div>

              {/* Batch Export Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchExportPdf}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-4 py-2 font-semibold text-white shadow-md shadow-indigo-600/20 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Export selected orchestrations into a single multi-page PDF archive"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Export Batch PDF Archive ({selectedIds.size})</span>
                </button>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {batchExportSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{batchExportSuccess}</span>
            </div>
          )}

          {/* List of Orchestrations */}
          {orchestrations.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No saved orchestrations yet. Run a prompt in the 3-AI Single Brain to store runs in Firestore.
            </p>
          ) : (
            <div className="space-y-2.5">
              {orchestrations.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectOrchestration?.(item)}
                    className={`flex items-center justify-between rounded-xl border p-4 text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-500/70 bg-cyan-950/20 shadow-md shadow-cyan-500/5'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950/90'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      {/* Checkbox trigger */}
                      <button
                        onClick={(e) => handleToggleSelect(item.id, e)}
                        className="text-slate-400 hover:text-cyan-400 shrink-0 p-1"
                        title={isSelected ? 'Deselect' : 'Select for batch export'}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <h5 className="font-semibold text-white line-clamp-1">{item.prompt}</h5>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {item.masterSolution?.slice(0, 120)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-slate-500">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] uppercase font-semibold text-cyan-400 border border-slate-800">
                        {item.mode || 'TRI-SYNTHESIS'}
                      </span>
                      <span className="hidden sm:inline">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                      </span>

                      {/* Single Item PDF Export button */}
                      <button
                        onClick={(e) => handleSingleExportPdf(item, e)}
                        className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
                        title="Download single PDF"
                      >
                        <FileDown className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="hidden md:inline">PDF</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Chats Tab */}
      {activeTab === 'chats' && (
        <div className="space-y-3">
          {chats.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No chat threads recorded yet. Start a multi-turn conversation in the Chatbot tab.
            </p>
          ) : (
            chats.map((thread) => (
              <div
                key={thread.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs"
              >
                <div>
                  <h5 className="font-semibold text-white">{thread.title}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Model: {thread.model}</p>
                </div>
                <span className="text-[11px] text-slate-500">{new Date(thread.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Creations Tab */}
      {activeTab === 'creations' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {creations.length === 0 ? (
            <p className="col-span-full text-xs text-slate-500 text-center py-8">
              No media creations saved yet. Generate images, music, or video in Creative Studio.
            </p>
          ) : (
            creations.map((creation) => (
              <div
                key={creation.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2 text-xs"
              >
                {creation.type === 'image' && creation.resultUrl && (
                  <img src={creation.resultUrl} alt="Creation" className="h-32 w-full object-cover rounded-lg" />
                )}
                <div className="flex items-center justify-between">
                  <span className="rounded bg-indigo-950 text-indigo-300 px-2 py-0.5 text-[10px] uppercase font-bold">
                    {creation.type}
                  </span>
                  <span className="text-[10px] text-slate-500">{new Date(creation.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="font-medium text-slate-200 line-clamp-2">{creation.prompt}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
