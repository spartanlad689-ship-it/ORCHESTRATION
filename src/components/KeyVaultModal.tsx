import React, { useState } from 'react';
import { 
  Key, 
  X, 
  Eye, 
  EyeOff, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  Zap, 
  Brain, 
  Sparkles,
  Trash2
} from 'lucide-react';
import { ApiKeys, ModelSelection, AVAILABLE_MODELS } from '../types/orchestrator';

interface KeyVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeys;
  onSaveKeys: (keys: ApiKeys) => void;
  models: ModelSelection;
  onChangeModels: (models: ModelSelection) => void;
  hasEnvGemini: boolean;
}

export const KeyVaultModal: React.FC<KeyVaultModalProps> = ({
  isOpen,
  onClose,
  apiKeys,
  onSaveKeys,
  models,
  onChangeModels,
  hasEnvGemini,
}) => {
  const [localKeys, setLocalKeys] = useState<ApiKeys>(apiKeys);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [useEnvGemini, setUseEnvGemini] = useState<boolean>(!apiKeys.gemini && hasEnvGemini);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    [key: string]: { success: boolean; message: string; timestamp: number };
  }>({});

  if (!isOpen) return null;

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleKeyChange = (provider: keyof ApiKeys, value: string) => {
    setLocalKeys((prev) => ({ ...prev, [provider]: value }));
  };

  const handleSave = () => {
    const keysToSave = {
      ...localKeys,
      gemini: useEnvGemini ? '' : localKeys.gemini,
    };
    onSaveKeys(keysToSave);
    onClose();
  };

  const handleClearAll = () => {
    const emptyKeys = { gemini: '', groq: '', deepseek: '' };
    setLocalKeys(emptyKeys);
    onSaveKeys(emptyKeys);
    setTestResults({});
  };

  const handleTestKey = async (provider: 'gemini' | 'groq' | 'deepseek') => {
    setTestingProvider(provider);
    const keyToTest = provider === 'gemini' && useEnvGemini ? '' : localKeys[provider];

    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: keyToTest,
          model: models[provider],
        }),
      });

      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: data.success,
          message: data.message || (data.success ? 'Connection verified.' : 'Verification failed.'),
          timestamp: Date.now(),
        },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          message: err.message || 'Network error communicating with backend.',
          timestamp: Date.now(),
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleTestAll = async () => {
    await Promise.all([
      handleTestKey('gemini'),
      handleTestKey('groq'),
      handleTestKey('deepseek'),
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">TriBrain API Key Vault</h3>
              <p className="text-xs text-slate-400">
                Configure your API keys for Gemini, Groq, and DeepSeek. Stored safely in your local browser session.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-300">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <p className="font-semibold text-emerald-200">Zero Public Exposure Architecture</p>
              <p className="text-emerald-300/80">
                Keys are retained securely in your browser's local state and forwarded via protected backend proxies directly to Google, Groq, and DeepSeek endpoints. If any key is omitted, TriBrain operates in Sandbox Mode so you can still evaluate the multi-agent cognitive architecture.
              </p>
            </div>
          </div>

          {/* 1. Google Gemini Config */}
          <div className="rounded-xl border border-cyan-500/30 bg-slate-950/60 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    1. Google Gemini Key
                    <span className="text-[10px] rounded bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 font-medium border border-cyan-500/30">
                      Synthesis Master
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">Powers multimodal reasoning and master cognitive fusion.</p>
                </div>
              </div>

              {hasEnvGemini && (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <input
                    type="checkbox"
                    checked={useEnvGemini}
                    onChange={(e) => setUseEnvGemini(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span>Use AI Studio System Secret</span>
                </label>
              )}
            </div>

            {!useEnvGemini && (
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type={showKeys['gemini'] ? 'text' : 'password'}
                    value={localKeys.gemini || ''}
                    onChange={(e) => handleKeyChange('gemini', e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('gemini')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showKeys['gemini'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Model:</span>
                <select
                  value={models.gemini}
                  onChange={(e) => onChangeModels({ ...models, gemini: e.target.value })}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  {AVAILABLE_MODELS.gemini.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                >
                  Get Key <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  disabled={testingProvider === 'gemini'}
                  onClick={() => handleTestKey('gemini')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/40 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-600/30 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${testingProvider === 'gemini' ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
              </div>
            </div>

            {testResults['gemini'] && (
              <div
                className={`text-xs px-3 py-2 rounded-lg border ${
                  testResults['gemini'].success
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/30 text-red-300'
                }`}
              >
                {testResults['gemini'].message}
              </div>
            )}
          </div>

          {/* 2. Groq Config */}
          <div className="rounded-xl border border-amber-500/30 bg-slate-950/60 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    2. Groq API Key
                    <span className="text-[10px] rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.5 font-medium border border-amber-500/30">
                      Rapid Execution LPU
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">Powers sub-second prompt decomposition and rapid blueprints.</p>
                </div>
              </div>

              <span className="text-xs text-amber-400/80 bg-amber-950/40 border border-amber-500/20 px-2.5 py-1 rounded-full">
                500+ tok/s Hardware
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type={showKeys['groq'] ? 'text' : 'password'}
                  value={localKeys.groq || ''}
                  onChange={(e) => handleKeyChange('groq', e.target.value)}
                  placeholder="gsk_..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('groq')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showKeys['groq'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Free tier available at console.groq.com. If left blank, Sandbox Mode simulates the LPU blueprint node.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Model:</span>
                <select
                  value={models.groq}
                  onChange={(e) => onChangeModels({ ...models, groq: e.target.value })}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  {AVAILABLE_MODELS.groq.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
                >
                  Get Free Key <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  disabled={testingProvider === 'groq'}
                  onClick={() => handleTestKey('groq')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600/20 border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-600/30 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${testingProvider === 'groq' ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
              </div>
            </div>

            {testResults['groq'] && (
              <div
                className={`text-xs px-3 py-2 rounded-lg border ${
                  testResults['groq'].success
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/30 text-red-300'
                }`}
              >
                {testResults['groq'].message}
              </div>
            )}
          </div>

          {/* 3. DeepSeek Config */}
          <div className="rounded-xl border border-purple-500/30 bg-slate-950/60 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Brain className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    3. DeepSeek API Key
                    <span className="text-[10px] rounded bg-purple-500/20 text-purple-300 px-1.5 py-0.5 font-medium border border-purple-500/30">
                      Deep Logic & Reasoning
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">Powers chain-of-thought proofs, mathematical rigor, and invariants.</p>
                </div>
              </div>

              <span className="text-xs text-purple-400/80 bg-purple-950/40 border border-purple-500/20 px-2.5 py-1 rounded-full">
                R1 CoT & V3
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type={showKeys['deepseek'] ? 'text' : 'password'}
                  value={localKeys.deepseek || ''}
                  onChange={(e) => handleKeyChange('deepseek', e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('deepseek')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showKeys['deepseek'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Obtain from platform.deepseek.com. If omitted, Sandbox Mode simulates the deep reasoning node.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Model:</span>
                <select
                  value={models.deepseek}
                  onChange={(e) => onChangeModels({ ...models, deepseek: e.target.value })}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  {AVAILABLE_MODELS.deepseek.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-purple-400 hover:underline"
                >
                  Get Key <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  disabled={testingProvider === 'deepseek'}
                  onClick={() => handleTestKey('deepseek')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600/20 border border-purple-500/40 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-600/30 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${testingProvider === 'deepseek' ? 'animate-spin' : ''}`} />
                  Test Connection
                </button>
              </div>
            </div>

            {testResults['deepseek'] && (
              <div
                className={`text-xs px-3 py-2 rounded-lg border ${
                  testResults['deepseek'].success
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/30 text-red-300'
                }`}
              >
                {testResults['deepseek'].message}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset All
            </button>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              disabled={Boolean(testingProvider)}
              onClick={handleTestAll}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Ping All 3 Nodes
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-opacity"
            >
              <Check className="h-4 w-4" />
              Arm Single Brain & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
