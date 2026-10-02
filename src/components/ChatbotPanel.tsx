import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  Sliders, 
  Cloud, 
  MessageSquarePlus, 
  Layers
} from 'lucide-react';
import { useAuth } from '../firebase/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { MarkdownRenderer } from './MarkdownRenderer';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

const ROLE_PRESETS = [
  {
    id: 'general',
    name: 'General Assistant',
    model: 'gemini-3.5-flash',
    instruction: 'You are a versatile, highly intelligent AI assistant ready to assist with any general task.',
  },
  {
    id: 'fast',
    name: 'High-Speed Triage',
    model: 'gemini-3.1-flash-lite',
    instruction: 'You are a lightning-fast triage AI. Provide razor-sharp, actionable answers with zero fluff.',
  },
  {
    id: 'architect',
    name: 'Lead Software Architect',
    model: 'gemini-3.5-flash',
    instruction: 'You are a Principal Software Architect. Focus on distributed systems, security, maintainability, and clean code.',
  },
  {
    id: 'reasoner',
    name: 'Deep Math & Logic Specialist',
    model: 'gemini-3.1-pro-preview',
    instruction: 'You are an elite theoretical computer scientist and mathematician. Provide rigorous proofs, analyze invariants, and verify boundary constraints.',
  },
];

export const ChatbotPanel: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Hello! I am your multi-turn Gemini chatbot. Choose a role or model and ask me anything.',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLE_PRESETS[0]);
  const [model, setModel] = useState('gemini-3.5-flash');
  const [systemInstruction, setSystemInstruction] = useState(ROLE_PRESETS[0].instruction);
  const [threadId, setThreadId] = useState<string>(() => `thread-${Date.now()}`);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRoleChange = (preset: typeof ROLE_PRESETS[0]) => {
    setSelectedRole(preset);
    setModel(preset.model);
    setSystemInstruction(preset.instruction);
  };

  const handleNewChat = () => {
    const newId = `thread-${Date.now()}`;
    setThreadId(newId);
    setMessages([
      {
        role: 'model',
        content: `New session started with role "${selectedRole.name}". How can I help you today?`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, text: m.content })),
          model,
          systemInstruction,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const modelMessage: Message = {
        role: 'model',
        content: data.text || 'No response returned.',
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, modelMessage];
      setMessages(finalMessages);

      // Persist to Cloud Firestore if signed in
      if (user) {
        try {
          const threadRef = doc(db, 'chat_threads', threadId);
          await setDoc(threadRef, {
            id: threadId,
            userId: user.uid,
            title: userMessage.content.slice(0, 40) || 'Chat Session',
            model,
            systemInstruction,
            createdAt: new Date(newMessages[0].timestamp).toISOString(),
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          const msgCollection = collection(db, 'chat_threads', threadId, 'messages');
          await addDoc(msgCollection, {
            id: `msg-${Date.now()}`,
            threadId,
            userId: user.uid,
            role: 'user',
            content: userMessage.content,
            createdAt: new Date(userMessage.timestamp).toISOString(),
          });
          await addDoc(msgCollection, {
            id: `msg-${Date.now() + 1}`,
            threadId,
            userId: user.uid,
            role: 'model',
            content: modelMessage.content,
            createdAt: new Date(modelMessage.timestamp).toISOString(),
          });
        } catch (e) {
          console.warn('Could not persist chat message to Firestore:', e);
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: `⚠️ Chat Error: ${err.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[750px] rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/70 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Gemini Multi-Turn Chatbot</h3>
              <span className="rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold">
                Contextual Thread
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Role-guided multi-turn conversation with memory and model switcher
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-cyan-400" />
            <span>New Thread</span>
          </button>
        </div>
      </div>

      {/* Role & Model Configurations Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/40 px-6 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium">Role:</span>
          {ROLE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleRoleChange(p)}
              className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                selectedRole.id === p.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Model:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="gemini-3.5-flash">Gemini 3.5 Flash (General / Fast)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (High Throughput)</option>
            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Complex Reasoning)</option>
          </select>
        </div>
      </div>

      {/* Scrollable Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, index) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={index}
              className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isUser
                    ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-cyan-400'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`relative rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 border-b border-white/10 pb-1">
                  <span className="font-semibold text-[11px] opacity-75">
                    {isUser ? 'You' : `Gemini (${model.replace('-preview', '')})`}
                  </span>
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(m.content, index)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Copy response"
                    >
                      {copiedIdx === index ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>

                <div className="mt-1">
                  {isUser ? <p className="whitespace-pre-wrap">{m.content}</p> : <MarkdownRenderer content={m.content} />}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Gemini is generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="border-t border-slate-800 bg-slate-950 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or instruction for Gemini..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 disabled:opacity-50 transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
