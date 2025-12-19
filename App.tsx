
import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';
import { 
  Building2, 
  BarChart3, 
  Settings2, 
  Info, 
  CheckCircle2, 
  Circle,
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  Zap,
  X,
  Download,
  Copy,
  FileText,
  Printer
} from 'lucide-react';
import { CustomSlider } from './components/CustomSlider';
import { TickMeter } from './components/TickMeter';
import { 
  IndustrySector, 
  SolutionSelections, 
  ExpenseAllocations,
  RiskTolerance
} from './types';
import { 
  EXPENSE_CATEGORIES, 
  SOLUTIONS_LIST, 
  DEFAULT_EXPENSES,
  INDUSTRY_MULTIPLIERS
} from './constants';
import { calculateROI } from './utils/calculations';
import { buildAiReportPayload, type SupportedAiReportModel } from './utils/reportPayload';

// --- Helper Components ---

const Money: React.FC<{ value: number; compact?: boolean; className?: string }> = ({ value, compact, className = '' }) => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0
  }).format(value);
  return <span className={`font-mono ${className}`}>{formatted}</span>;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const DEFAULT_REVENUE = 5_000_000_000;
const MIN_REVENUE = 1_000_000;
const MAX_REVENUE = 10_000_000_000;
const MIN_REVENUE_EXP = Math.log10(MIN_REVENUE);
const MAX_REVENUE_EXP = Math.log10(MAX_REVENUE);

const DEFAULT_SOLUTIONS: SolutionSelections = {
  demandForecasting: true,
  inventoryPlanning: true,
  supplierLeadTime: false,
  skuRationalization: false,
  warehouseSlotting: true,
  cycleCounting: false,
  orderOptimization: false,
  inventoryVisibility: true,
  obsolescenceControl: false
};

const formatRevenueCompact = (v: number) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${Math.round(v).toLocaleString('en-US')}`;
};

const formatRevenueInput = (v: number) => Math.round(v).toLocaleString('en-US');
const parseRevenueInput = (raw: string) => {
  const cleaned = raw.replace(/[$,\s]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const buildReportHtmlDocument = (title: string, bodyHtml: string) => {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 32px; }
      h1, h2, h3 { margin: 18px 0 8px; }
      p { margin: 8px 0; line-height: 1.45; }
      ul, ol { margin: 8px 0 8px 22px; }
      table { border-collapse: collapse; width: 100%; margin: 12px 0; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
      th { background: #f1f5f9; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; background: #f1f5f9; padding: 1px 4px; border-radius: 4px; }
      @media print { body { margin: 16mm; } }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;
};

const markdownToSafeHtml = (md: string) => {
  // Prevent raw HTML coming from the model from being interpreted during export.
  const escaped = md.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return marked.parse(escaped, { gfm: true, breaks: true }) as string;
};

const downloadTextFile = (filename: string, mime: string, content: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// --- Main App ---

export default function App() {
  // State
  const [revenue, setRevenue] = useState<number>(DEFAULT_REVENUE);
  const [revenueText, setRevenueText] = useState<string>(formatRevenueInput(DEFAULT_REVENUE));
  const [isEditingRevenue, setIsEditingRevenue] = useState(false);
  const [opExPercent, setOpExPercent] = useState<number>(() => {
    const total = (Object.values(DEFAULT_EXPENSES) as number[]).reduce((a, b) => a + b, 0);
    return Number((total * 100).toFixed(1));
  });
  const [industry, setIndustry] = useState<IndustrySector>('Industrial Distribution');
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('Moderate');
  
  // Expenses State
  const [allocations, setAllocations] = useState<ExpenseAllocations>({ ...DEFAULT_EXPENSES });

  // Solutions State
  const [solutions, setSolutions] = useState<SolutionSelections>({ ...DEFAULT_SOLUTIONS });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'solutions'>('dashboard');

  const [reportModel, setReportModel] = useState<SupportedAiReportModel>('gpt-5.2-2025-12-11');
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [reportError, setReportError] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportLoadingStatus, setReportLoadingStatus] = useState<string>('');

  const [reportEmail, setReportEmail] = useState<string>('');
  const [reportEmailStatus, setReportEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [reportEmailError, setReportEmailError] = useState<string>('');

  const [reportVoucher, setReportVoucher] = useState<string>('');
  const [reportAccessVoucher, setReportAccessVoucher] = useState<string>('');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Preprocess markdown to fix Setext header issues
  // In Markdown, text followed by "---" on the next line becomes an H2 (Setext style)
  // This causes paragraphs ending before --- separators to render as headers
  const processedReportMarkdown = useMemo(() => {
    if (!reportMarkdown) return '';
    
    // Ensure --- horizontal rules are always preceded by a blank line
    // This prevents Setext-style header interpretation
    let result = reportMarkdown;
    result = result.replace(/([^\n])\n---(\n|$)/g, '$1\n\n---$2');
    result = result.replace(/([^\n])\n===(\n|$)/g, '$1\n\n===$2');
    
    return result;
  }, [reportMarkdown]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && reportModalOpen) setReportModalOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [reportModalOpen]);

  // Log-scale revenue slider maps exponent -> revenue
  const revenueExp = useMemo(() => {
    const safe = clamp(revenue, MIN_REVENUE, MAX_REVENUE);
    return clamp(Math.log10(safe), MIN_REVENUE_EXP, MAX_REVENUE_EXP);
  }, [revenue]);

  useEffect(() => {
    if (!isEditingRevenue) setRevenueText(formatRevenueInput(revenue));
  }, [revenue, isEditingRevenue]);

  const resetAll = () => {
    setRevenue(DEFAULT_REVENUE);
    setRevenueText(formatRevenueInput(DEFAULT_REVENUE));
    setIsEditingRevenue(false);
    setIndustry('Industrial Distribution');
    setRiskTolerance('Moderate');
    setAllocations({ ...DEFAULT_EXPENSES });
    setSolutions({ ...DEFAULT_SOLUTIONS });
    setActiveTab('dashboard');
    const total = (Object.values(DEFAULT_EXPENSES) as number[]).reduce((a, b) => a + b, 0);
    setOpExPercent(Number((total * 100).toFixed(1)));

    setReportMarkdown('');
    setReportError('');
    setReportLoading(false);
    setReportEmail('');
    setReportEmailStatus('idle');
    setReportEmailError('');
    setReportVoucher('');
    setReportAccessVoucher('');
  };

  const handleOpExChange = (newTotalPercent: number) => {
    setOpExPercent(newTotalPercent);
    const currentTotal = (Object.values(allocations) as number[]).reduce((a, b) => a + b, 0);
    if (currentTotal === 0) return;
    
    const scale = (newTotalPercent / 100) / currentTotal;
    const newAllocations = { ...allocations };
    (Object.keys(newAllocations) as (keyof ExpenseAllocations)[]).forEach(k => {
      newAllocations[k] = newAllocations[k] * scale;
    });
    setAllocations(newAllocations);
  };

  const handleAllocationChange = (key: keyof ExpenseAllocations, newVal: number) => {
    const newAllocations = { ...allocations, [key]: newVal };
    setAllocations(newAllocations);
    const newTotal = (Object.values(newAllocations) as number[]).reduce((a, b) => a + b, 0);
    setOpExPercent(Number((newTotal * 100).toFixed(1)));
  };

  const toggleSolution = (key: keyof SolutionSelections) => {
    setSolutions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const results = useMemo(() => {
    return calculateROI(revenue, allocations, solutions, riskTolerance, industry);
  }, [revenue, allocations, solutions, riskTolerance, industry]);

  async function generateAiReport() {
    setReportError('');
    setReportLoading(true);
    setReportLoadingStatus('');
    setReportEmailStatus('idle');
    setReportEmailError('');
    
    // Status messages that are technically true
    const statusMessages = [
      'Assembling your custom report...',
      'Applying industry benchmarks...',
      'Calculating savings projections...',
      'Formatting analysis...',
      'Preparing document...',
    ];
    
    try {
      const voucher = reportVoucher.trim();
      if (!voucher) throw new Error('Voucher code required to view the report in-app.');
      
      // Get selected solution keys
      const selectedSolutions = (Object.keys(solutions) as (keyof SolutionSelections)[])
        .filter(k => solutions[k]);
      
      // Build payload for assembled report
      const assembledPayload = {
        industry,
        companySize: revenue >= 500_000_000 ? 'Enterprise ($500M+)' : 
                     revenue >= 50_000_000 ? 'Mid-Market ($50M-$500M)' : 
                     'Small ($10M-$50M)',
        annualRevenue: revenue,
        riskTolerance,
        selectedSolutions,
        totalSavings: results.totalSavingsTarget,
        savingsRangeLow: results.totalSavingsLow,
        savingsRangeHigh: results.totalSavingsHigh,
        opexReductionPct: results.totalCostReductionTarget * 100,
        voucher,
      };
      
      // "Magic feeling" - progressive status updates with slight delay
      const totalDelay = 3000 + Math.random() * 2000; // 3-5 seconds
      const statusInterval = totalDelay / statusMessages.length;
      
      let statusIndex = 0;
      const statusTimer = setInterval(() => {
        if (statusIndex < statusMessages.length) {
          setReportLoadingStatus(statusMessages[statusIndex]);
          statusIndex++;
        }
      }, statusInterval);
      
      // Make the actual request (will be fast since it's just assembly)
      const respPromise = fetch('/api/report/assembled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assembledPayload),
      });
      
      // Wait for both the delay and the response
      const [resp] = await Promise.all([
        respPromise,
        new Promise(resolve => setTimeout(resolve, totalDelay)),
      ]);
      
      clearInterval(statusTimer);
      setReportLoadingStatus('');
      
      const json = (await (resp as Response).json()) as { markdown?: string; error?: string };
      if (!(resp as Response).ok) throw new Error(json.error || `Request failed (${(resp as Response).status})`);
      setReportMarkdown(json.markdown || '');
      setReportAccessVoucher(voucher);
      // Auto-open the modal for that "wow" moment
      if (json.markdown) setReportModalOpen(true);
    } catch (e) {
      setReportMarkdown('');
      setReportAccessVoucher('');
      setReportError(e instanceof Error ? e.message : 'Unknown error');
      setReportLoadingStatus('');
    } finally {
      setReportLoading(false);
    }
  }

  async function emailReport() {
    setReportEmailStatus('sending');
    setReportEmailError('');
    try {
      const payload = buildAiReportPayload({
        revenue,
        industry,
        riskTolerance,
        allocations,
        solutions,
        results,
      });

      // If the report is already unlocked via voucher, email the unlocked markdown
      // to avoid re-running the model (server requires voucher for this path).
      const useUnlocked = !!reportMarkdown && !!reportAccessVoucher;

      const resp = await fetch('/api/report/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: reportEmail,
          title: 'ROI Detailed Report',
          subject: 'Your ROI Detailed Report',
          ...(useUnlocked
            ? { markdown: reportMarkdown, voucher: reportAccessVoucher }
            : { model: reportModel, data: payload }),
        }),
      });

      const json = (await resp.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!resp.ok) throw new Error(json?.error || `Email request failed (${resp.status})`);
      setReportEmailStatus('sent');
    } catch (e) {
      setReportEmailStatus('error');
      setReportEmailError(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  async function copyReport() {
    if (!reportMarkdown) return;
    const html = markdownToSafeHtml(reportMarkdown);

    try {
      // Prefer rich-text copy when available.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ClipboardItemAny = (window as any).ClipboardItem as unknown;
      if (ClipboardItemAny && navigator.clipboard?.write) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = new (ClipboardItemAny as any)({
          'text/plain': new Blob([reportMarkdown], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        });
        await navigator.clipboard.write([item]);
        return;
      }

      await navigator.clipboard.writeText(reportMarkdown);
    } catch {
      // Ignore clipboard errors (permissions, unsupported, etc.)
    }
  }

  function exportReportWord() {
    if (!reportMarkdown) return;
    if (!reportAccessVoucher) return;
    void (async () => {
      try {
        const resp = await fetch('/api/report/docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'ROI Detailed Report',
            markdown: reportMarkdown,
            voucher: reportAccessVoucher,
          }),
        });

        if (!resp.ok) {
          const json = (await resp.json().catch(() => null)) as { error?: string } | null;
          throw new Error(json?.error || `DOCX request failed (${resp.status})`);
        }

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'roi-detailed-report.docx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        // Fallback: download legacy .doc (HTML) if server fails
        const htmlBody = markdownToSafeHtml(reportMarkdown);
        const doc = buildReportHtmlDocument('ROI Detailed Report', htmlBody);
        downloadTextFile('roi-detailed-report.doc', 'application/msword', doc);
      }
    })();
  }

  function exportReportPdf() {
    if (!reportMarkdown) return;
    if (!reportAccessVoucher) return;
    void (async () => {
      try {
        const resp = await fetch('/api/report/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'ROI Detailed Report',
            markdown: reportMarkdown,
            voucher: reportAccessVoucher,
          }),
        });

        if (!resp.ok) {
          const json = (await resp.json().catch(() => null)) as { error?: string } | null;
          throw new Error(json?.error || `PDF request failed (${resp.status})`);
        }

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'roi-detailed-report.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch {
        // Fallback: open print dialog if server-side PDF isn't available.
        const htmlBody = markdownToSafeHtml(reportMarkdown);
        const doc = buildReportHtmlDocument('ROI Detailed Report', htmlBody);
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.open();
        w.document.write(doc);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 250);
      }
    })();
  }

  const selectedCount = Object.values(solutions).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
          {/* Left: AAXIS Logo */}
          <div className="flex items-center">
            <img src="/aaxislogo.png" alt="AAXIS" className="h-12 w-auto" />
          </div>
          
          {/* Center: Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">Proof of Value <span className="text-slate-500 font-normal">Calculator</span></h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Distribution & Logistics ROI</p>
          </div>
          
          {/* Right: Savings & Configure */}
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-center">
                <span className="text-[10px] uppercase text-emerald-500 font-bold tracking-wider">Estimated Savings ({riskTolerance})</span>
                <div className="text-xl font-bold text-white font-mono">
                  <Money value={results.totalSavingsTarget} compact />
                </div>
             </div>
             <button 
                onClick={() => setActiveTab(activeTab === 'dashboard' ? 'solutions' : 'dashboard')}
               aria-pressed={activeTab === 'solutions'}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all
                  ${activeTab === 'solutions' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}
                `}
             >
               <Settings2 className="w-4 h-4" />
               <span className="hidden sm:inline">Configure ({selectedCount})</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Inputs & Solutions */}
        <div className={`lg:col-span-3 flex flex-col gap-6 ${activeTab === 'solutions' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Company Profile Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-blue-500" /> Company Profile
              </h2>
              <button
                type="button"
                onClick={resetAll}
                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-600"
              >
                Reset
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Industry Sector</label>
                <select 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as IndustrySector)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                >
                  <option>Industrial Distribution</option>
                  <option>Food & Beverage</option>
                  <option>Retail/E-commerce</option>
                  <option>Pharmaceutical</option>
                  <option>Technology/Electronics</option>
                  <option>Fashion/Apparel</option>
                  <option>CPG</option>
                </select>
                <div className="mt-2 text-[10px] text-slate-500 font-mono">
                  Industry factor: {(INDUSTRY_MULTIPLIERS[industry] ?? 1).toFixed(2)}x
                </div>
              </div>

              <CustomSlider 
                label="Annual Revenue" 
                ariaLabel="Annual revenue"
                value={revenueExp}
                min={MIN_REVENUE_EXP}
                max={MAX_REVENUE_EXP}
                step={0.01}
                onChange={(exp) => {
                  const rev = clamp(Math.pow(10, exp), MIN_REVENUE, MAX_REVENUE);
                  // Round to keep the UI stable while sliding.
                  const rounded = Math.round(rev / 10_000) * 10_000;
                  setRevenue(rounded);
                }}
                formatValue={(exp) => formatRevenueCompact(Math.pow(10, exp))}
              />

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Exact Revenue</label>
                <div className="flex items-center gap-2">
                  <div className="text-slate-500 text-sm font-mono select-none">$</div>
                  <input
                    inputMode="numeric"
                    value={revenueText}
                    onFocus={() => setIsEditingRevenue(true)}
                    onBlur={() => {
                      setIsEditingRevenue(false);
                      const n = parseRevenueInput(revenueText);
                      const safe = clamp(n ?? revenue, MIN_REVENUE, MAX_REVENUE);
                      setRevenue(safe);
                      setRevenueText(formatRevenueInput(safe));
                    }}
                    onChange={(e) => {
                      const next = e.target.value;
                      setRevenueText(next);
                      const n = parseRevenueInput(next);
                      if (n === null) return;
                      setRevenue(clamp(n, MIN_REVENUE, MAX_REVENUE));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    placeholder="1,000,000"
                    aria-label="Enter exact revenue"
                  />
                </div>
                <div className="mt-1 text-[10px] text-slate-600 font-mono">
                  Range: $1,000,000 – $10,000,000,000
                </div>
              </div>

              <CustomSlider 
                label="Total OpEx"
                subLabel="% of Revenue"
                value={opExPercent} 
                min={5} 
                max={60} 
                step={0.5}
                onChange={handleOpExChange}
                formatValue={(v) => `${v}%`}
              />

              {/* Risk Tolerance Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Risk Tolerance</label>
                <div className="grid grid-cols-3 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {(['Conservative', 'Moderate', 'Aggressive'] as RiskTolerance[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setRiskTolerance(level)}
                      className={`text-[10px] font-bold py-1.5 rounded transition-all flex flex-col items-center justify-center gap-1
                        ${riskTolerance === level 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'text-slate-500 hover:text-slate-300'}
                      `}
                    >
                      {level === 'Conservative' && <ShieldCheck className="w-3 h-3" />}
                      {level === 'Moderate' && <ShieldAlert className="w-3 h-3" />}
                      {level === 'Aggressive' && <Zap className="w-3 h-3" />}
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Solutions Toggle Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col min-h-[400px] max-h-[540px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100 uppercase tracking-wider">
                <Settings2 className="w-4 h-4 text-cyan-500" /> Solutions Engine
              </h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {selectedCount} Active
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {SOLUTIONS_LIST.map((sol) => (
                <button
                  key={sol.key}
                  onClick={() => toggleSolution(sol.key)}
                  aria-pressed={solutions[sol.key]}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group
                    ${solutions[sol.key] 
                      ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 transition-colors ${solutions[sol.key] ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-500'}`}>
                      {solutions[sol.key] ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${solutions[sol.key] ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                        {sol.label}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        {sol.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Panel: Results Grid */}
        <div className={`lg:col-span-9 flex flex-col gap-6 ${activeTab === 'dashboard' ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Main Table Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-slate-950/30 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="col-span-3 pl-2">Expense Categories</div>
              <div className="col-span-3 text-center">Allocation (% Revenue)</div>
              <div className="col-span-2 text-right pr-4">Annual Spend</div>
              <div className="col-span-2 text-center">Efficiency Gain</div>
              <div className="col-span-2 text-right pr-2">Est. Savings</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-800/50">
              {results.categories.map((cat) => {
                const isPositive = cat.savingsTarget > 0;
                const isNegative = cat.savingsTarget < 0;
                const benchmarkRange = EXPENSE_CATEGORIES.find(c => c.key === cat.categoryKey)?.benchmarkRange;
                
                return (
                  <div key={cat.categoryKey} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/30 transition-colors group">
                    
                    {/* Category Name */}
                    <div className="col-span-3 pl-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 group-hover:text-white transition-colors">
                          <span className="text-sm font-medium text-slate-300 truncate" title={cat.name}>{cat.name}</span>
                        <div className="group/tooltip relative">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                            aria-label={`Info for ${cat.name}`}
                            aria-describedby={`tooltip-${cat.categoryKey}`}
                          >
                            <Info className="w-3 h-3 text-slate-600 hover:text-blue-400" aria-hidden="true" />
                          </button>
                          <div
                            id={`tooltip-${cat.categoryKey}`}
                            role="tooltip"
                            className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-slate-300 text-xs rounded shadow-xl border border-slate-700 opacity-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 pointer-events-none transition-opacity z-10"
                          >
                            {EXPENSE_CATEGORIES.find(c => c.key === cat.categoryKey)?.tooltip}
                          </div>
                        </div>
                      </div>

                        {cat.categoryKey === 'salesMarketingCS' && isNegative && (
                          <div className="inline-flex items-center gap-2 w-fit px-2 py-1 rounded-md border border-blue-900/40 bg-blue-950/30 text-blue-200/90 text-[10px] leading-snug">
                            <span className="font-bold uppercase tracking-wider text-blue-300/90">Strategic note</span>
                            <span className="text-blue-200/70">Negative savings = service investment that drives growth.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Allocation Slider */}
                    <div className="col-span-3 px-2">
                      <CustomSlider 
                        label=""
                        ariaLabel={`Allocation for ${cat.name}`}
                        value={cat.allocationPercent}
                        min={0}
                        max={0.30} 
                        step={0.001}
                        onChange={(val) => handleAllocationChange(cat.categoryKey, val)}
                        formatValue={(v) => `${(v*100).toFixed(1)}%`}
                        benchmarkRange={benchmarkRange}
                      />
                    </div>

                    {/* Annual Spend */}
                    <div className="col-span-2 text-right pr-4">
                      <div className="text-sm font-mono text-slate-300">
                        <Money value={cat.currentDollars} compact />
                      </div>
                    </div>

                    {/* Efficiency Meter */}
                    <div className="col-span-2">
                      <TickMeter low={cat.efficiencyLow} high={cat.efficiencyHigh} target={cat.efficiencyTarget} />
                    </div>

                    {/* Savings */}
                    <div className="col-span-2 text-right pr-2">
                      <div className={`text-sm font-mono font-bold ${isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-300' : 'text-slate-600'}`}>
                        <Money value={cat.savingsTarget} compact />
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Range: <Money value={cat.savingsLow} compact /> - <Money value={cat.savingsHigh} compact />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Table Footer / Totals */}
            <div className="bg-slate-950/50 border-t border-slate-800 p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-slate-900 border border-slate-800">
                    <PieChart className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Target OpEx Reduction ({riskTolerance})</div>
                    <div className="text-2xl font-bold text-white tabular-nums">
                      {(results.totalCostReductionTarget * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="h-12 w-px bg-slate-800 hidden md:block"></div>

                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-emerald-950/30 border border-emerald-900/50">
                    <DollarSign className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-emerald-600/80 uppercase font-bold tracking-wider">Est. Annual Savings</div>
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tabular-nums font-mono drop-shadow-sm">
                       <Money value={results.totalSavingsTarget} compact />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mt-1">
                      Sensitivity: <Money value={results.totalSavingsLow} compact /> - <Money value={results.totalSavingsHigh} compact />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <TrendingUp className="w-24 h-24 text-blue-500" />
               </div>
               <h3 className="text-lg font-bold text-white mb-2">Detailed Report</h3>
               <p className="text-slate-400 text-sm mb-4 max-w-md">
                 Generate a comprehensive PDF report including methodology for {riskTolerance} projections.
               </p>
               <div className="space-y-3 relative z-10">
                 <div>
                   <label className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">
                     Email address
                   </label>
                   <div className="flex items-center gap-2">
                     <input
                       value={reportEmail}
                       onChange={(e) => {
                         setReportEmail(e.target.value);
                         if (reportEmailStatus !== 'sending') setReportEmailStatus('idle');
                       }}
                       placeholder="you@company.com"
                       inputMode="email"
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                       aria-label="Email address"
                     />
                     <button
                       type="button"
                       onClick={emailReport}
                       disabled={reportEmailStatus === 'sending' || !reportEmail.trim()}
                       className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
                     >
                       {reportEmailStatus === 'sending' ? 'Sending…' : 'Email report'}
                     </button>
                   </div>
                   {reportEmailStatus === 'sent' ? (
                     <div className="text-sm text-emerald-300 mt-2">Sent!</div>
                   ) : null}
                   {reportEmailStatus === 'error' ? (
                     <div className="text-sm text-rose-300 mt-2">{reportEmailError}</div>
                   ) : null}
                 </div>

                 <div>
                   <label className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">
                     Voucher code (override)
                   </label>
                   <div className="flex items-center gap-2">
                     <input
                       value={reportVoucher}
                       onChange={(e) => setReportVoucher(e.target.value)}
                       placeholder="Enter voucher"
                       className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                       aria-label="Voucher code"
                     />
                     <button
                       type="button"
                       onClick={generateAiReport}
                       disabled={reportLoading}
                       className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-md border border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
                     >
                       {reportLoading ? 'Unlocking…' : 'Unlock report'}
                     </button>
                   </div>
                   {reportError ? <div className="text-sm text-rose-300 mt-2">{reportError}</div> : null}
                   {reportLoading && reportLoadingStatus && (
                     <div className="text-sm text-blue-300 mt-2 flex items-center gap-2">
                       <svg className="animate-spin h-4 w-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       {reportLoadingStatus}
                     </div>
                   )}
                 </div>
               </div>
             </div>

             <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-900/30 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h3 className="text-lg font-bold text-white mb-2">Book a Value Assessment</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Turn this estimate into an implementation roadmap.
                </p>
                <ul className="text-slate-300 text-sm space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    Validate with your actual data
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    Prioritize by payback speed
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    Scope Phase 1 quick wins
                  </li>
                </ul>
                <p className="text-slate-500 text-xs mb-4">60 minutes. No commitment.</p>
                <a 
                  href="https://calendly.com/aaxis-discovery" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 transition-all"
                >
                  Schedule Discovery
                </a>
             </div>

             {reportMarkdown ? (
               <div className="md:col-span-2 bg-gradient-to-br from-emerald-900/30 to-slate-900 border border-emerald-800/50 rounded-xl p-6 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                 <div className="flex items-center justify-between gap-4">
                   <div>
                     <h3 className="text-lg font-bold text-white flex items-center gap-2">
                       <FileText className="w-5 h-5 text-emerald-400" />
                       Your Report is Ready
                     </h3>
                     <p className="text-slate-400 text-sm mt-1">Comprehensive ROI analysis based on your selections</p>
                   </div>
                   <div className="flex items-center gap-3">
                     <button
                       type="button"
                       onClick={() => setReportModalOpen(true)}
                       className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2"
                     >
                       <FileText className="w-4 h-4" />
                       View Report
                     </button>
                     <button
                       type="button"
                       onClick={() => { setReportMarkdown(''); setReportAccessVoucher(''); }}
                       className="text-slate-400 hover:text-white transition-colors p-2"
                       title="Clear report"
                     >
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                 </div>
               </div>
             ) : null}
          </div>

        </div>

      </main>

      {/* Professional Report Modal */}
      {reportModalOpen && reportMarkdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setReportModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full h-full max-w-6xl max-h-[95vh] m-4 flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl shadow-2xl shadow-black/50 border border-slate-700/50 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-5 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">ROI Analysis Report</h2>
                  <p className="text-slate-400 text-sm">Prepared for {industry} • {formatRevenueCompact(revenue)} Revenue</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                {/* PDF and Word export buttons - disabled for now
                <button
                  type="button"
                  onClick={exportReportPdf}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                  title="Export as PDF"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button
                  type="button"
                  onClick={exportReportWord}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                  title="Export as Word"
                >
                  <Download className="w-4 h-4" />
                  Word
                </button>
                */}
                <div className="w-px h-6 bg-slate-700 mx-2" />
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-auto">
              <div className="max-w-6xl mx-auto px-12 py-1">
                {/* Report Content with Premium Typography */}
                <article className="report-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: (p) => <h1 className="text-3xl font-bold text-white mt-6 mb-4 pb-3 border-b border-slate-700/50" {...p} />,
                      h2: (p) => <h2 className="text-2xl font-bold text-white mt-8 mb-4" {...p} />,
                      h3: (p) => <h3 className="text-xl font-semibold text-slate-100 mt-6 mb-2" {...p} />,
                      h4: (p) => <h4 className="text-lg font-semibold text-slate-200 mt-4 mb-2" {...p} />,
                      p: (p) => <p className="text-slate-300 text-base leading-relaxed mb-4" {...p} />,
                      ul: (p) => <ul className="list-disc pl-6 text-slate-300 mb-4 space-y-2" {...p} />,
                      ol: (p) => <ol className="list-decimal pl-6 text-slate-300 mb-4 space-y-2" {...p} />,
                      li: (p) => <li className="text-base leading-relaxed" {...p} />,
                      strong: (p) => <strong className="text-slate-100 font-semibold" {...p} />,
                      em: (p) => <em className="text-slate-200" {...p} />,
                      blockquote: (p) => (
                        <blockquote className="border-l-4 border-blue-500 pl-6 py-2 my-6 bg-slate-800/50 rounded-r-lg" {...p} />
                      ),
                      hr: () => <hr className="border-slate-700/50 my-8" />,
                      table: (p) => (
                        <div className="overflow-x-auto my-6 rounded-xl border border-slate-700/50 shadow-lg">
                          <table className="w-full border-collapse text-sm" {...p} />
                        </div>
                      ),
                      thead: (p) => <thead className="bg-slate-800/80" {...p} />,
                      th: (p) => <th className="px-4 py-3 text-left text-white font-semibold border-b border-slate-700/50" {...p} />,
                      td: (p) => <td className="px-4 py-3 text-slate-300 border-b border-slate-800/50" {...p} />,
                      tr: (p) => <tr className="hover:bg-slate-800/30 transition-colors" {...p} />,
                      code: (p) => (
                        <code className="text-emerald-400 bg-slate-800 px-2 py-0.5 rounded text-sm font-mono" {...p} />
                      ),
                      pre: (p) => (
                        <pre className="bg-slate-800 rounded-xl p-4 overflow-x-auto my-4 border border-slate-700/50" {...p} />
                      ),
                      a: (p) => (
                        <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors" {...p} />
                      ),
                    }}
                  >
                    {processedReportMarkdown}
                  </ReactMarkdown>
                </article>
                
                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-slate-700/50">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <p>Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p>Powered by AAXIS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
