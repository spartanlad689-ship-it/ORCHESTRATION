import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Globe, Compass, Sparkles, Send, RefreshCw } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useAuth } from '../firebase/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

export const GroundingPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeType, setActiveType] = useState<'search' | 'maps'>('search');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [places, setPlaces] = useState<{ title: string; uri: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!prompt.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    setResultText('');
    setSources([]);
    setPlaces([]);

    const endpoint = activeType === 'search' ? '/api/gemini/search' : '/api/gemini/maps';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResultText(data.text || 'No response returned.');
      if (data.sources) setSources(data.sources);
      if (data.places) setPlaces(data.places);

      // Save to Firestore Creations
      if (user) {
        try {
          await addDoc(collection(db, 'creations'), {
            id: `grounding-${Date.now()}`,
            userId: user.uid,
            type: 'grounding',
            prompt: prompt.trim(),
            textOutput: data.text || '',
            metadata: JSON.stringify({
              type: activeType,
              sourcesCount: data.sources?.length || data.places?.length || 0,
            }),
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Could not save grounding to Firestore:', e);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Grounding request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 md:p-8 space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-white shadow-md">
            {activeType === 'search' ? <Globe className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Google Grounding Studio</h3>
              <span className="rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold">
                gemini-3.5-flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live web fact-checking and geographical location verification
            </p>
          </div>
        </div>

        {/* Search vs Maps Toggle */}
        <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveType('search')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeType === 'search'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Google Search Grounding</span>
          </button>
          <button
            onClick={() => setActiveType('maps')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeType === 'maps'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Google Maps Grounding</span>
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-medium">Try:</span>
        {activeType === 'search' ? (
          <>
            <button
              onClick={() => setPrompt('What are the latest AI hardware chip announcements this week?')}
              className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-slate-300 hover:border-cyan-500 hover:text-white"
            >
              Latest AI hardware announcements
            </button>
            <button
              onClick={() => setPrompt('Current stock market performance for semiconductor companies')}
              className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-slate-300 hover:border-cyan-500 hover:text-white"
            >
              Semiconductor market performance
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setPrompt('Find top-rated coffee shops near Shibuya, Tokyo with fast WiFi')}
              className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-slate-300 hover:border-emerald-500 hover:text-white"
            >
              Coffee shops in Shibuya with WiFi
            </button>
            <button
              onClick={() => setPrompt('Best scenic hiking trails in Banff National Park with parking details')}
              className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-slate-300 hover:border-emerald-500 hover:text-white"
            >
              Hiking trails in Banff
            </button>
          </>
        )}
      </div>

      {/* Input box */}
      <div className="flex gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
          placeholder={
            activeType === 'search'
              ? 'Ask for real-time web news, facts, current events, or live data...'
              : 'Search for places, restaurants, coordinates, routes, or local points of interest...'
          }
          className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <button
          onClick={handleExecute}
          disabled={!prompt.trim() || isLoading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 disabled:opacity-50 transition-all"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Grounding...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Query Google</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">
          ⚠️ {error}
        </div>
      )}

      {/* Results View */}
      {resultText && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Grounded Response ({activeType === 'search' ? 'Google Search' : 'Google Maps'})
            </h4>
          </div>

          <div className="prose-invert text-xs leading-relaxed text-slate-200">
            <MarkdownRenderer content={resultText} />
          </div>

          {/* Web Sources / Places list */}
          {(sources.length > 0 || places.length > 0) && (
            <div className="border-t border-slate-800/80 pt-4 space-y-2">
              <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {activeType === 'search' ? 'Verified Citations & Sources' : 'Grounded Places'}
              </h5>
              <div className="flex flex-wrap gap-2">
                {(activeType === 'search' ? sources : places).map((item, idx) => (
                  <a
                    key={idx}
                    href={item.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-cyan-300 hover:border-cyan-500 hover:text-white transition-colors"
                  >
                    <span>{item.title}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
