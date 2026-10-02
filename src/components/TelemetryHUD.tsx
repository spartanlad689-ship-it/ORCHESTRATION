import React from 'react';
import { Clock, Zap, ShieldCheck, Download, Share2, Layers, FileDown } from 'lucide-react';
import { OrchestrationResult } from '../types/orchestrator';
import { exportMasterSolutionToPdf } from '../utils/pdfExport';

interface TelemetryHUDProps {
  result: OrchestrationResult;
  onCopyMaster: () => void;
  copiedMaster: boolean;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  result,
  onCopyMaster,
  copiedMaster,
}) => {
  const { telemetry, mode } = result;
  const sequentialTime =
    telemetry.nodes.groq.latencyMs +
    telemetry.nodes.deepseek.latencyMs +
    telemetry.nodes.gemini.latencyMs;
  const timeSaved = Math.max(0, sequentialTime - telemetry.totalLatencyMs);
  const speedupPercent = sequentialTime > 0 ? Math.round((timeSaved / sequentialTime) * 100) : 0;

  const handleExportPdf = () => {
    exportMasterSolutionToPdf(result);
  };

  const handleDownloadReport = () => {
    const report = `# TriBrain AI Orchestration Synthesis Report
Date: ${new Date().toISOString()}
Mode: ${mode}
Prompt: ${result.prompt}

---

## ⚡ Master Single-Brain Unified Solution (Synthesized by Gemini Core)
${result.masterSolution}

---

## 🧠 Groq LPU Specialist Node (Category 1: Rapid Execution & Triage)
Model: ${telemetry.nodes.groq.model} | Latency: ${telemetry.nodes.groq.latencyMs}ms | Status: ${telemetry.nodes.groq.status}
${telemetry.nodes.groq.output}

---

## 🔬 DeepSeek Specialist Node (Category 2: Deep Math & Invariant Logic)
Model: ${telemetry.nodes.deepseek.model} | Latency: ${telemetry.nodes.deepseek.latencyMs}ms | Status: ${telemetry.nodes.deepseek.status}
${telemetry.nodes.deepseek.output}

---

## 📊 Orchestration Telemetry
- Total Parallel Turnaround: ${telemetry.totalLatencyMs}ms
- Theoretical Sequential Time: ${sequentialTime}ms
- Parallel Pipeline Speedup: ${speedupPercent}%
- Consensus Confidence: ${telemetry.consensusConfidence}%
`;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tribrain-orchestration-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            TriBrain Synchronization Telemetry
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onCopyMaster}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <span>{copiedMaster ? 'Copied Master!' : 'Copy Master Solution'}</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-600/20 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-600/30 transition-colors shadow-sm"
            title="Download Master Solution as formatted PDF"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Markdown</span>
          </button>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Latency */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Orchestration Turnaround</span>
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 text-lg font-bold text-white">
            {telemetry.totalLatencyMs} <span className="text-xs text-slate-400 font-normal">ms</span>
          </div>
          <p className="text-[10px] text-emerald-400 mt-0.5">
            Parallel Stage 1 + Stage 2 Synthesis
          </p>
        </div>

        {/* Pipeline Acceleration */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Parallel Speedup</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-1 text-lg font-bold text-amber-300">
            {speedupPercent}% <span className="text-xs text-slate-400 font-normal">faster</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Saved {timeSaved}ms vs sequential execution
          </p>
        </div>

        {/* Consensus Confidence */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Consensus Confidence</span>
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="mt-1 text-lg font-bold text-purple-300">
            {telemetry.consensusConfidence}%
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            3-node cross-verification alignment
          </p>
        </div>

        {/* Specialization Mix */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Specialization Balance</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-200">
            33% Speed • 33% Logic • 34% Synthesis
          </div>
          <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="w-1/3 bg-amber-400" title="Groq: Speed & Execution" />
            <div className="w-1/3 bg-purple-500" title="DeepSeek: Logic & Reasoning" />
            <div className="w-1/3 bg-cyan-400" title="Gemini: Synthesis" />
          </div>
        </div>
      </div>
    </div>
  );
};
