import React, { useState, useRef, useEffect } from 'react';
import { 
  Clipboard, 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  ShieldAlert,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  BarChart3,
  Plus,
  RotateCcw,
  ArrowLeft,
  Clock,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { generateTestCases, generatePrompt, auditRequirement } from './services/geminiService';
import { TestGenerationResult, TestCase, Priority, HistoryItem, AuditResult } from './types';
import { RequirementAuditor } from './components/RequirementAuditor';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4'];
const HISTORY_RETENTION_DAYS = 30;
const STORAGE_KEY = 'testmind_history';

export default function App() {
  const [requirement, setRequirement] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aborted, setAborted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditing, setAuditing] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        const parsedHistory: HistoryItem[] = JSON.parse(savedHistory);
        const thirtyDaysAgo = Date.now() - (HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
        // Filter out items older than 30 days
        const filteredHistory = parsedHistory.filter(item => item.timestamp > thirtyDaysAgo);
        setHistory(filteredHistory);
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const resultsRef = useRef<HTMLDivElement>(null);
  const abortTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const generationIdRef = useRef<number>(0);

  function handleNewRequirement() {
    if (result) {
      setShowConfirmModal(true);
    } else {
      setRequirement('');
      setError(null);
      setAuditResult(null);
      setAborted(false);
      generationIdRef.current = 0;
      if (abortTimeoutRef.current) clearTimeout(abortTimeoutRef.current);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function confirmNewRequirement() {
    handleExportCSV();
    setResult(null);
    setRequirement('');
    setError(null);
    setAuditResult(null);
    setAborted(false);
    generationIdRef.current = 0;
    if (abortTimeoutRef.current) clearTimeout(abortTimeoutRef.current);
    setShowConfirmModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelNewRequirement() {
    setShowConfirmModal(false);
  }

  function handleBackToInput() {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleAudit() {
    if (!requirement.trim()) return;
    
    const auditId = Date.now();
    generationIdRef.current = auditId;

    setAuditing(true);
    setError(null);
    setAborted(false);

    try {
      const result = await auditRequirement(requirement);
      if (generationIdRef.current === auditId) {
        setAuditResult(result);
      }
    } catch (err: any) {
      if (generationIdRef.current === auditId) {
        setError(err.message || 'Failed to audit requirement.');
      }
    } finally {
      if (generationIdRef.current === auditId) {
        setAuditing(false);
      }
    }
  }

  async function handleGenerate() {
    if (!requirement.trim()) return;
    
    const generationId = Date.now();
    generationIdRef.current = generationId;

    // Clear any existing abort messages or errors
    if (abortTimeoutRef.current) {
      clearTimeout(abortTimeoutRef.current);
      abortTimeoutRef.current = null;
    }

    setLoading(true);
    setError(null);
    setAborted(false);

    try {
      const data = await generateTestCases(requirement);
      
      // Only update if this is still the active generation
      if (generationIdRef.current === generationId) {
        setResult(data);
        
        // Add to history
        const newHistoryItem: HistoryItem = {
          id: generationId.toString(),
          requirement: requirement,
          results: data,
          timestamp: generationId
        };
        setHistory(prev => [newHistoryItem, ...prev]);

        // Scroll to results after a short delay for animation
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err: any) {
      // Only update error if this is still the active generation
      if (generationIdRef.current === generationId) {
        setError(err.message || 'Failed to generate test cases. Please try again.');
      }
    } finally {
      // Only clear loading if this is still the active generation
      if (generationIdRef.current === generationId) {
        setLoading(false);
      }
    }
  }

  function handleAbort() {
    generationIdRef.current = 0;
    setLoading(false);
    setAuditing(false);
    setResult(null);
    setError(null);
    setAborted(true);
    
    if (abortTimeoutRef.current) clearTimeout(abortTimeoutRef.current);
    abortTimeoutRef.current = setTimeout(() => {
      setAborted(false);
      abortTimeoutRef.current = null;
    }, 5000);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function loadHistoryItem(item: HistoryItem) {
    setRequirement(item.requirement);
    setResult(item.results);
    setError(null);
    setAuditResult(null);
    setAborted(false);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const copyToClipboard = () => {
    if (!result) return;
    const text = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-cases.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const normalizeHeader = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .toUpperCase();
  };

  const escapeCSV = (val: any) => {
    const str = String(val ?? '');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    if (!result) return;

    const generateSection = (title: string, data: any[]) => {
      if (!data || data.length === 0) return '';
      
      const keys = Object.keys(data[0]);
      const headers = keys.map(normalizeHeader).join(',');
      
      const rows = data.map(item => 
        keys.map(key => {
          const val = (item as any)[key];
          if (Array.isArray(val)) return escapeCSV(val.join('; '));
          return escapeCSV(val);
        }).join(',')
      );

      return `SECTION: ${title.toUpperCase()}\n${headers}\n${rows.join('\n')}\n\n`;
    };

    const csvContent = 
      generateSection('Test Cases', result.testCases) + 
      generateSection('Edge Case & Boundary Analysis', result.edgeCases);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-mind-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH: return 'bg-[#FF5F5F] text-black border-black';
      case Priority.MEDIUM: return 'bg-[#FFBD59] text-black border-black';
      case Priority.LOW: return 'bg-[#4ADE80] text-black border-black';
      default: return 'bg-white text-black border-black';
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black font-sans selection:bg-indigo-200 flex">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-80 bg-white border-r-3 border-black shadow-neubrutal z-[70] flex flex-col"
            >
              <div className="p-6 border-b-3 border-black flex items-center justify-between bg-indigo-50">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">History</h2>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 border-2 border-black hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-block p-4 border-2 border-black bg-slate-50 mb-4">
                      <Clock className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No history yet</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="w-full text-left p-4 border-3 border-black bg-white shadow-neubrutal-sm hover:-translate-y-0.5 hover:shadow-none transition-all group"
                    >
                      <p className="text-sm font-black line-clamp-2 mb-2 group-hover:text-indigo-600">
                        {item.requirement.length > 30 
                          ? item.requirement.substring(0, 30) + '...' 
                          : item.requirement}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                          {item.results.testCases.length} Cases
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="p-6 border-t-3 border-black bg-slate-50">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                  History retained for 30 days
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-grow">
        {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white border-3 border-black shadow-neubrutal max-w-md w-full p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-[#FFBD59] border-2 border-black shadow-neubrutal-sm">
                  <AlertTriangle className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Export Results?</h3>
              </div>
              
              <p className="text-slate-600 mb-8 font-medium text-lg leading-snug">
                You have generated results. Would you like to export them to CSV before starting a new requirement?
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={confirmNewRequirement}
                  className="flex-1 px-6 py-3 bg-indigo-500 text-white border-3 border-black shadow-neubrutal-sm font-bold uppercase hover:-translate-y-0.5 hover:shadow-none transition-all active:translate-y-0.5"
                >
                  Yes, Export & Reset
                </button>
                <button
                  onClick={cancelNewRequirement}
                  className="flex-1 px-6 py-3 bg-white text-black border-3 border-black shadow-neubrutal-sm font-bold uppercase hover:-translate-y-0.5 hover:shadow-none transition-all active:translate-y-0.5"
                >
                  No, Stay Here
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b-3 border-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="bg-indigo-500 border-2 border-black p-2 shadow-neubrutal-sm group-hover:-translate-y-0.5 group-hover:shadow-none transition-all">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">TestMind <span className="text-indigo-600">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-black uppercase tracking-widest text-black bg-white border-3 border-black shadow-neubrutal-sm hover:-translate-y-0.5 hover:shadow-none transition-all active:translate-y-0.5"
              title="Session History"
            >
              <Clock className="w-5 h-5" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 border border-black ml-1">
                  {history.length}
                </span>
              )}
            </button>

            {result && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-white bg-black border-2 border-black shadow-neubrutal-sm hover:-translate-y-0.5 hover:shadow-none transition-all active:translate-y-0.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={copyToClipboard}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-black bg-white border-2 border-black shadow-neubrutal-sm hover:-translate-y-0.5 hover:shadow-none transition-all active:translate-y-0.5"
                >
                  <Clipboard className="w-4 h-4" />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
            
            <button
              onClick={handleNewRequirement}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-black uppercase tracking-widest text-indigo-600 bg-white border-3 border-black shadow-neubrutal-sm hover:-translate-y-0.5 hover:shadow-none transition-all active:translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              New
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-black mb-6 tracking-tighter uppercase sm:text-7xl"
          >
            Generate Test Cases <br/><span className="text-indigo-600">In Seconds</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600 max-w-2xl mx-auto font-medium"
          >
            Paste your product requirements and let our AI engine create structured test cases, identify edge cases, and analyze risks.
          </motion.p>
        </div>

        {/* Input Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="nb-card mb-12"
        >
          <div className="p-8">
            <label htmlFor="requirement" className="block text-sm font-black uppercase tracking-widest text-black mb-4">
              Product Requirement / User Story
            </label>
            <textarea
              id="requirement"
              rows={6}
              className="w-full p-6 border-3 border-black shadow-neubrutal focus:ring-0 focus:border-black transition-all resize-none bg-white text-lg font-medium placeholder:text-slate-400"
              placeholder="As a user I should be able to reset my password using email verification..."
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
            />
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 hover:text-black transition-colors"
                >
                  {showPrompt ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  {showPrompt ? 'Hide Prompt' : 'Show Prompt'}
                </button>

                <button
                  onClick={handleNewRequirement}
                  className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 hover:text-rose-600 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Clear
                </button>
              </div>

              <button
                onClick={auditing ? handleAbort : handleAudit}
                disabled={loading || !requirement.trim()}
                className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 font-black uppercase tracking-widest transition-all border-3 border-black shadow-neubrutal hover:-translate-y-1 hover:shadow-none active:translate-y-0.5 ${
                  auditing 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-indigo-500 text-white'
                }`}
              >
                {auditing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Stop
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-6 h-6" />
                    Validate Requirement
                  </>
                )}
              </button>

              <button
                onClick={loading ? handleAbort : handleGenerate}
                disabled={!requirement.trim()}
                className={`w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 font-black uppercase tracking-widest transition-all border-3 border-black shadow-neubrutal hover:-translate-y-1 hover:shadow-none active:translate-y-0.5 ${
                  loading 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-indigo-500 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Stop
                  </>
                ) : (
                  <>
                    {auditResult && !auditResult.isValid ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-300" />
                    ) : (
                      <Play className="w-5 h-5 fill-current" />
                    )}
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showPrompt && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-black border-t-3 border-black"
              >
                <div className="p-8">
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4">AI Prompt Preview</h3>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-slate-900 p-6 border-2 border-slate-800">
                    {generatePrompt(requirement || '[Your requirement will appear here]')}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        {aborted && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 text-amber-700"
          >
            <RotateCcw className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Process Aborted. You can start a new requirement below.</p>
          </motion.div>
        )}

        {/* Results Section */}
        <div ref={resultsRef}>
          {/* Requirement Auditor Result */}
          {auditResult && <div className="max-w-5xl mx-auto px-4 mb-8"><RequirementAuditor audit={auditResult} /></div>}
          
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-16"
              >
                {/* Section 1: Test Cases Table */}
                <section className="nb-card overflow-hidden">
                  <div className="p-8 border-b-3 border-black bg-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-500 border-2 border-black p-2 shadow-neubrutal-sm">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Test Cases</h3>
                    </div>
                    <span className="text-sm font-black text-black bg-[#FFBD59] border-2 border-black px-4 py-1 uppercase tracking-widest">
                      {result.testCases.length} Cases
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white text-black text-xs font-black uppercase tracking-[0.2em]">
                          <th className="px-8 py-6 border-b border-slate-200">ID</th>
                          <th className="px-8 py-6 border-b border-slate-200">Rule</th>
                          <th className="px-8 py-6 border-b border-slate-200">Scenario</th>
                          <th className="px-8 py-6 border-b border-slate-200">Steps</th>
                          <th className="px-8 py-6 border-b border-slate-200">Expected</th>
                          <th className="px-8 py-6 border-b border-slate-200">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {result.testCases.map((tc) => (
                          <tr key={tc.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-6 text-sm font-black text-indigo-600 align-top">{tc.id}</td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-500 align-top max-w-[150px] italic leading-relaxed">{tc.ruleTested}</td>
                            <td className="px-8 py-6 text-base font-black text-black align-top max-w-xs leading-tight">{tc.scenario}</td>
                            <td className="px-8 py-6 text-sm text-slate-600 align-top">
                              <ul className="list-decimal list-inside space-y-2">
                                {tc.steps.map((step, idx) => (
                                  <li key={idx} className="leading-relaxed font-medium">{step}</li>
                                ))}
                              </ul>
                            </td>
                            <td className="px-8 py-6 text-sm text-slate-600 align-top leading-relaxed font-medium">{tc.expectedResult}</td>
                            <td className="px-8 py-6 align-top">
                              <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 ${getPriorityColor(tc.priority)}`}>
                                {tc.priority}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section 2: Edge Case & Boundary Analysis Table */}
                <section className="nb-card overflow-hidden">
                  <div className="p-8 border-b-3 border-black bg-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#FFBD59] border-2 border-black p-2 shadow-neubrutal-sm">
                        <AlertTriangle className="w-6 h-6 text-black" />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Edge Cases</h3>
                    </div>
                    <span className="text-sm font-black text-black bg-[#4ADE80] border-2 border-black px-4 py-1 uppercase tracking-widest">
                      {result.edgeCases.length} Scenarios
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white text-black text-xs font-black uppercase tracking-[0.2em]">
                          <th className="px-8 py-6 border-b border-slate-200">ID</th>
                          <th className="px-8 py-6 border-b border-slate-200">Rule</th>
                          <th className="px-8 py-6 border-b border-slate-200">Variable</th>
                          <th className="px-8 py-6 border-b border-slate-200">Scenario</th>
                          <th className="px-8 py-6 border-b border-slate-200">Expected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {result.edgeCases.map((ec) => (
                          <tr key={ec.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-6 text-sm font-black text-amber-600 align-top">{ec.id}</td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-500 align-top italic leading-relaxed">{ec.ruleTested}</td>
                            <td className="px-8 py-6 text-base font-black text-black align-top leading-tight">{ec.variableTested}</td>
                            <td className="px-8 py-6 text-sm text-slate-600 align-top leading-relaxed font-medium">{ec.scenario}</td>
                            <td className="px-8 py-6 text-sm text-slate-600 align-top leading-relaxed font-medium">{ec.expectedResult}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Grid for remaining sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Section 3: Test Data */}
                  <section className="nb-card overflow-hidden flex flex-col">
                    <div className="p-6 border-b-3 border-black bg-white flex items-center gap-4">
                      <div className="bg-[#4ADE80] border-2 border-black p-2 shadow-neubrutal-sm">
                        <Database className="w-6 h-6 text-black" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">Test Data</h3>
                    </div>
                    <div className="p-8 flex-grow bg-white">
                      <ul className="space-y-4">
                        {result.testDataSuggestions.map((item, idx) => (
                          <li key={idx} className="flex gap-4 text-base text-slate-600 leading-snug font-medium">
                            <ChevronRight className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  {/* Section 4: Risk Analysis */}
                  <section className="nb-card overflow-hidden flex flex-col">
                    <div className="p-6 border-b-3 border-black bg-white flex items-center gap-4">
                      <div className="bg-[#FF5F5F] border-2 border-black p-2 shadow-neubrutal-sm">
                        <ShieldAlert className="w-6 h-6 text-black" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">Risks</h3>
                    </div>
                    <div className="p-8 flex-grow bg-white">
                      <ul className="space-y-4">
                        {result.riskAnalysis.map((item, idx) => (
                          <li key={idx} className="flex gap-4 text-base text-slate-600 leading-snug font-medium">
                            <ChevronRight className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                </div>

                {/* Section 5: Test Coverage Analysis Graph */}
                <section className="nb-card overflow-hidden">
                  <div className="p-8 border-b-3 border-black bg-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-500 border-2 border-black p-2 shadow-neubrutal-sm">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Coverage Analysis</h3>
                    </div>
                  </div>
                  <div className="p-12 bg-white">
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={result.coverageMetrics}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="category" 
                            axisLine={{ stroke: '#000', strokeWidth: 2 }} 
                            tickLine={false} 
                            tick={{ fill: '#000', fontSize: 12, fontWeight: 800 }}
                            dy={15}
                            angle={-15}
                            textAnchor="end"
                          />
                          <YAxis 
                            axisLine={{ stroke: '#000', strokeWidth: 2 }} 
                            tickLine={false} 
                            tick={{ fill: '#000', fontSize: 12, fontWeight: 800 }}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip 
                            cursor={{ fill: '#f1f5f9' }}
                            contentStyle={{ 
                              backgroundColor: '#fff',
                              border: '3px solid #000',
                              boxShadow: '4px 4px 0px 0px #000',
                              borderRadius: '0px',
                              padding: '16px'
                            }}
                            itemStyle={{ fontWeight: 800, color: '#000' }}
                            labelStyle={{ fontWeight: 900, marginBottom: '8px', textTransform: 'uppercase' }}
                            formatter={(value: number) => [`${value}%`, 'Coverage']}
                          />
                          <Bar 
                            dataKey="percentage" 
                            radius={[4, 4, 0, 0]} 
                            barSize={60}
                            stroke="#000"
                            strokeWidth={2}
                          >
                            {result.coverageMetrics.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
                      {result.coverageMetrics.map((metric, index) => (
                        <div key={index} className="p-6 border-3 border-black shadow-neubrutal-sm bg-white text-center">
                          <div className="text-3xl font-black" style={{ color: COLORS[index % COLORS.length] }}>
                            {metric.percentage}%
                          </div>
                          <div className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-2">
                            {metric.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-32 border-t-3 border-black py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span className="text-2xl font-black text-black tracking-tighter uppercase">TestMind AI</span>
          </div>
          <p className="text-base text-slate-600 font-medium max-w-md mx-auto">
            Empowering QA engineers with intelligent test automation and neubrutalist precision.
          </p>
          <div className="mt-12 flex justify-center gap-8 text-sm font-bold uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  </div>
);
}
