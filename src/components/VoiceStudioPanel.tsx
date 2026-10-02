import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, PhoneCall, PhoneOff, Radio, Volume2, Copy, Check, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

interface VoiceStudioPanelProps {
  onUseTranscriptInOrchestrator?: (text: string) => void;
}

export const VoiceStudioPanel: React.FC<VoiceStudioPanelProps> = ({ onUseTranscriptInOrchestrator }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'live' | 'transcribe'>('transcribe');

  // Live API States
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('Disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Transcription States
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveSession();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // ---------------- LIVE VOICE API SESSION ----------------
  const startLiveSession = async () => {
    try {
      setLiveStatus('Connecting to Gemini 3.8 Live API...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputAudioCtx;

      ws.onopen = async () => {
        setLiveStatus('Connected. Listening & Speaking...');
        setIsLiveActive(true);

        // Capture mic at 16kHz
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert Float32 to 16-bit PCM
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
            ws.send(JSON.stringify({ audio: base64 }));
          }
        };
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playRawPCM(outputAudioCtx, msg.audio);
          }
          if (msg.error) {
            setLiveStatus(`Error: ${msg.error}`);
          }
        } catch (e) {
          console.error('Incoming message parsing error:', e);
        }
      };

      ws.onclose = () => {
        setLiveStatus('Session Closed');
        setIsLiveActive(false);
      };

      ws.onerror = (e) => {
        console.error('WebSocket error:', e);
        setLiveStatus('Connection error. Verify server state.');
        setIsLiveActive(false);
      };
    } catch (err: any) {
      setLiveStatus(`Error accessing mic: ${err.message}`);
      setIsLiveActive(false);
    }
  };

  const playRawPCM = (ctx: AudioContext, base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      const audioBuffer = ctx.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.warn('PCM playback error:', e);
    }
  };

  const stopLiveSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsLiveActive(false);
    setLiveStatus('Disconnected');
  };

  // ---------------- AUDIO TRANSCRIPTION (gemini-3.5-transcribe) ----------------
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await processTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      alert(`Microphone permission error: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const res = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: 'audio/webm',
          }),
        });

        const data = await res.json();
        const text = data.transcript || 'No speech detected.';
        setTranscript(text);

        // Save to Firestore creations
        if (user) {
          try {
            await addDoc(collection(db, 'creations'), {
              id: `transcript-${Date.now()}`,
              userId: user.uid,
              type: 'transcription',
              prompt: 'Microphone speech transcription',
              textOutput: text,
              metadata: JSON.stringify({ model: 'gemini-3.5-transcribe' }),
              createdAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('Firestore creation save error:', e);
          }
        }
      };
    } catch (err: any) {
      setTranscript(`Transcription error: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-6 md:p-8 space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-amber-500 text-white shadow-md">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Voice & Audio Intelligence</h3>
              <span className="rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold">
                Live API & Transcribe
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Low-latency conversational voice conversations and instantaneous microphone transcription
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('transcribe')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'transcribe'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Audio Transcription (gemini-3.5-transcribe)</span>
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'live'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Real-time Voice Conversation (gemini-3.8-live)</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Transcription */}
      {activeTab === 'transcribe' && (
        <div className="space-y-5">
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-slate-800 bg-slate-950/60 text-center space-y-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 shadow-xl ${
                isRecording
                  ? 'bg-red-600 text-white ring-8 ring-red-500/30 animate-pulse'
                  : 'bg-cyan-600 text-white hover:bg-cyan-500'
              }`}
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>

            <div>
              <h4 className="text-sm font-bold text-white">
                {isRecording ? 'Listening & Recording...' : 'Tap Microphone to Speak'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {isRecording ? 'Tap again when finished to transcribe' : 'Speech is transcribed verbatim by gemini-3.5-transcribe'}
              </p>
            </div>
          </div>

          {isTranscribing && (
            <div className="flex items-center justify-center gap-2 text-xs text-cyan-400 py-3">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Transcribing audio stream with Gemini...</span>
            </div>
          )}

          {transcript && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase text-slate-400">Verbatim Transcription</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:text-white"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  {onUseTranscriptInOrchestrator && (
                    <button
                      onClick={() => onUseTranscriptInOrchestrator(transcript)}
                      className="flex items-center gap-1 rounded-lg bg-cyan-600/30 border border-cyan-500/40 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-600/40"
                    >
                      <span>Send to 3-AI Orchestrator</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Live API Real-Time Voice */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center p-10 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 text-center space-y-5">
            <div className="relative">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full transition-all duration-500 ${
                  isLiveActive
                    ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-2xl shadow-cyan-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Radio className="h-10 w-10" />
              </div>
              {isLiveActive && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Gemini 3.8 Live Voice Channel</h4>
              <p className="text-xs text-indigo-300/80 mt-1 max-w-md">
                Ultra low-latency bi-directional voice stream over WebSocket. Speak into your mic and hear Gemini respond with low-latency spoken voice.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isLiveActive ? (
                <button
                  onClick={stopLiveSession}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all"
                >
                  <PhoneOff className="h-4 w-4" />
                  <span>End Voice Session</span>
                </button>
              ) : (
                <button
                  onClick={startLiveSession}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 transition-all"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Start Live Voice Call</span>
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400 bg-slate-950/80 px-4 py-1.5 rounded-full border border-slate-800">
              Status: <strong className="text-slate-200">{liveStatus}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
