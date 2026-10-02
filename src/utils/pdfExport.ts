import { jsPDF } from 'jspdf';
import { OrchestrationResult } from '../types/orchestrator';

export function exportMasterSolutionToPdf(result: OrchestrationResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      cursorY = margin;
      drawHeaderBanner(false);
    }
  };

  const drawHeaderBanner = (isFirstPage: boolean) => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, isFirstPage ? 28 : 14, 'F');

    doc.setFillColor(6, 182, 212); // cyan-500
    doc.rect(0, isFirstPage ? 27 : 13, pageWidth / 3, 1, 'F');
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.rect(pageWidth / 3, isFirstPage ? 27 : 13, pageWidth / 3, 1, 'F');
    doc.setFillColor(245, 158, 11); // amber-500
    doc.rect((pageWidth / 3) * 2, isFirstPage ? 27 : 13, pageWidth / 3, 1, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isFirstPage ? 14 : 9);
    doc.text(
      isFirstPage ? 'TRIBRAIN AI • MASTER SINGLE BRAIN SOLUTION' : 'TriBrain AI Orchestrator • Master Solution',
      margin,
      isFirstPage ? 12 : 9
    );

    if (isFirstPage) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Harmonized Synthesis: Gemini (Synthesis) + Groq (Speed) + DeepSeek (Logic)', margin, 19);

      doc.setFontSize(8);
      doc.setTextColor(56, 189, 248); // sky-400
      const dateStr = new Date(result.timestamp || Date.now()).toLocaleString();
      doc.text(`Generated: ${dateStr} | Mode: ${result.mode.toUpperCase()}`, margin, 24);

      cursorY = 34;
    } else {
      cursorY = 20;
    }
  };

  drawHeaderBanner(true);

  // 1. EXECUTIVE QUERY / PROMPT BOX
  checkPageBreak(30);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);

  const promptLines = doc.splitTextToSize(`Prompt Query: "${result.prompt}"`, contentWidth - 8);
  const promptBoxHeight = Math.max(14, promptLines.length * 4.5 + 8);
  doc.roundedRect(margin, cursorY, contentWidth, promptBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(promptLines, margin + 4, cursorY + 6);
  cursorY += promptBoxHeight + 6;

  // 2. 3-AI TELEMETRY SUMMARY STRIP
  if (result.telemetry?.nodes) {
    checkPageBreak(18);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentWidth, 14, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.text('GROQ LPU:', margin + 4, cursorY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${result.telemetry.nodes.groq.latencyMs}ms (Execution Blueprint)`, margin + 25, cursorY + 5.5);

    doc.setTextColor(109, 40, 217);
    doc.setFont('helvetica', 'bold');
    doc.text('DEEPSEEK:', margin + 4, cursorY + 10.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${result.telemetry.nodes.deepseek.latencyMs}ms (CoT & Invariant Proof)`, margin + 25, cursorY + 10.5);

    doc.setTextColor(14, 116, 144);
    doc.setFont('helvetica', 'bold');
    doc.text('GEMINI MASTER:', margin + 95, cursorY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${result.telemetry.nodes.gemini.latencyMs}ms (Synthesis)`, margin + 125, cursorY + 5.5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL LATENCY:', margin + 95, cursorY + 10.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${result.telemetry.totalLatencyMs}ms (Confidence: ${result.telemetry.consensusConfidence}%)`, margin + 125, cursorY + 10.5);

    cursorY += 20;
  }

  // 3. MASTER SOLUTION BODY
  renderMarkdownBody(doc, result.masterSolution, margin, contentWidth, pageHeight, checkPageBreak, () => cursorY, (newY) => { cursorY = newY; });

  // 4. FOOTER ON ALL PAGES
  applyFooters(doc, margin, pageWidth, pageHeight, 'TriBrain AI Orchestration Core • Unified Single Brain');

  doc.save(`tribrain-master-solution-${Date.now()}.pdf`);
}

// ---------------- BATCH EXPORT FUNCTION ----------------
export function exportBatchOrchestrationsToPdf(items: any[]): void {
  if (!items || items.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      cursorY = margin;
      drawBatchPageBanner();
    }
  };

  const drawBatchPageBanner = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 14, 'F');

    doc.setFillColor(6, 182, 212);
    doc.rect(0, 13, pageWidth / 3, 1, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(pageWidth / 3, 13, pageWidth / 3, 1, 'F');
    doc.setFillColor(245, 158, 11);
    doc.rect((pageWidth / 3) * 2, 13, pageWidth / 3, 1, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TRIBRAIN AI • MULTI-ORCHESTRATION ARCHIVE', margin, 9);
    cursorY = 20;
  };

  // 1. COVER / TABLE OF CONTENTS PAGE
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setFillColor(6, 182, 212);
  doc.rect(0, 35, pageWidth / 3, 1.2, 'F');
  doc.setFillColor(99, 102, 241);
  doc.rect(pageWidth / 3, 35, pageWidth / 3, 1.2, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect((pageWidth / 3) * 2, 35, pageWidth / 3, 1.2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TRIBRAIN AI • ORCHESTRATION BATCH ARCHIVE', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Consolidated intelligence dossier synthesized from Gemini, Groq, and DeepSeek', margin, 21);

  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248);
  const nowStr = new Date().toLocaleString();
  doc.text(`Generated: ${nowStr} | Total Orchestrations: ${items.length}`, margin, 28);

  cursorY = 44;

  // Table of Contents Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('ARCHIVE TABLE OF CONTENTS', margin, cursorY);
  cursorY += 6;

  items.forEach((item, index) => {
    checkPageBreak(14);
    doc.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cursorY, contentWidth, 11, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(14, 116, 144);
    doc.text(`#${index + 1}`, margin + 3, cursorY + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const shortPrompt = item.prompt?.length > 70 ? `${item.prompt.slice(0, 67)}...` : item.prompt;
    doc.text(shortPrompt || 'Untitled Query', margin + 14, cursorY + 6.5);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const itemDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
    const itemMode = (item.mode || 'TRI-SYNTHESIS').toUpperCase();
    doc.text(`${itemMode} • ${itemDate}`, pageWidth - margin - 45, cursorY + 6.5);

    cursorY += 13;
  });

  // 2. DETAILED ORCHESTRATION PAGES
  items.forEach((item, index) => {
    doc.addPage();
    cursorY = margin;
    drawBatchPageBanner();

    // Section Header Box
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);

    const promptText = `Record #${index + 1} of ${items.length}: "${item.prompt}"`;
    const promptLines = doc.splitTextToSize(promptText, contentWidth - 8);
    const boxHeight = Math.max(16, promptLines.length * 4.5 + 10);
    doc.roundedRect(margin, cursorY, contentWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(promptLines, margin + 4, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString() : '';
    const latencyStr = item.totalLatencyMs ? ` | Latency: ${item.totalLatencyMs}ms` : '';
    doc.text(`Mode: ${(item.mode || 'tri-synthesis').toUpperCase()}${latencyStr} | Date: ${dateStr}`, margin + 4, cursorY + boxHeight - 3);

    cursorY += boxHeight + 6;

    // Specialist Summaries strip if present
    if (item.groqSummary || item.deepseekSummary) {
      checkPageBreak(14);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, cursorY, contentWidth, 12, 1.5, 1.5, 'FD');

      doc.setFontSize(7.5);
      if (item.groqSummary) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text('Groq Blueprint:', margin + 4, cursorY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(`${item.groqSummary.slice(0, 40)}...`, margin + 27, cursorY + 7);
      }
      if (item.deepseekSummary) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(109, 40, 217);
        doc.text('DeepSeek Proof:', margin + 95, cursorY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(`${item.deepseekSummary.slice(0, 40)}...`, margin + 120, cursorY + 7);
      }
      cursorY += 16;
    }

    // Solution Body
    renderMarkdownBody(
      doc,
      item.masterSolution || 'No solution content stored.',
      margin,
      contentWidth,
      pageHeight,
      checkPageBreak,
      () => cursorY,
      (newY) => { cursorY = newY; }
    );
  });

  // Footer for all pages
  applyFooters(doc, margin, pageWidth, pageHeight, `TriBrain AI Orchestrator • Consolidated Archive (${items.length} Records)`);

  const filename = `tribrain-batch-archive-${items.length}-items-${Date.now()}.pdf`;
  doc.save(filename);
}

// ---------------- HELPER: RENDER MARKDOWN BODY ----------------
function renderMarkdownBody(
  doc: jsPDF,
  content: string,
  margin: number,
  contentWidth: number,
  pageHeight: number,
  checkPageBreak: (neededHeight: number) => void,
  getCursorY: () => number,
  setCursorY: (y: number) => void
) {
  let cursorY = getCursorY();
  const rawLines = content.split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        const codeText = codeBuffer.join('\n');
        const splitCode = doc.splitTextToSize(codeText, contentWidth - 8);
        const codeHeight = splitCode.length * 3.8 + 6;

        checkPageBreak(codeHeight);
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(margin, cursorY, contentWidth, codeHeight, 1.5, 1.5, 'FD');

        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text(splitCode, margin + 4, cursorY + 4.5);

        cursorY += codeHeight + 4;
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
      const headingText = line.replace(/^#+\s*/, '');
      checkPageBreak(12);

      doc.setFont('helvetica', 'bold');
      if (line.startsWith('# ')) {
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        cursorY += 3;
      } else if (line.startsWith('## ')) {
        doc.setFontSize(11);
        doc.setTextColor(14, 116, 144);
        cursorY += 2;
      } else {
        doc.setFontSize(9.5);
        doc.setTextColor(67, 56, 202);
      }

      const splitHeading = doc.splitTextToSize(headingText, contentWidth);
      doc.text(splitHeading, margin, cursorY);
      cursorY += splitHeading.length * 5 + 2;
      continue;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bulletText = line.trim().replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
      const splitBullet = doc.splitTextToSize(bulletText, contentWidth - 6);
      checkPageBreak(splitBullet.length * 4.2 + 2);

      doc.setFillColor(6, 182, 212);
      doc.circle(margin + 2, cursorY - 1, 0.8, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(splitBullet, margin + 5, cursorY);
      cursorY += splitBullet.length * 4.2 + 1.5;
      continue;
    }

    if (!line.trim()) {
      cursorY += 2.5;
      continue;
    }

    const cleanPara = line.replace(/\*\*/g, '');
    const splitPara = doc.splitTextToSize(cleanPara, contentWidth);
    checkPageBreak(splitPara.length * 4.2 + 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(splitPara, margin, cursorY);
    cursorY += splitPara.length * 4.2 + 2;
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    const codeText = codeBuffer.join('\n');
    const splitCode = doc.splitTextToSize(codeText, contentWidth - 8);
    const codeHeight = splitCode.length * 3.8 + 6;
    checkPageBreak(codeHeight);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, cursorY, contentWidth, codeHeight, 1.5, 1.5, 'FD');
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(splitCode, margin + 4, cursorY + 4.5);
    cursorY += codeHeight + 4;
  }

  setCursorY(cursorY);
}

// ---------------- HELPER: APPLY FOOTERS ----------------
function applyFooters(doc: jsPDF, margin: number, pageWidth: number, pageHeight: number, footerTitle: string) {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(footerTitle, margin, pageHeight - 6);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 6);
  }
}
