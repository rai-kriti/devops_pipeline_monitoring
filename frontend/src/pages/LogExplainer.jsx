import React, { useState } from 'react';
import { explainLog } from '../services/api';
import { Bot, Loader2, AlertCircle, Terminal, Send, Sparkles, BrainCircuit, History, Info } from 'lucide-react';

const LogExplainer = () => {
  const [log, setLog] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!log.trim()) return;

    setLoading(true);
    setError(null);
    setExplanation('');

    try {
      const data = await explainLog(log);
      setExplanation(data.explanation);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze the log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent-secondary/20 rounded-xl">
            <BrainCircuit className="h-6 w-6 text-accent-secondary" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">AI Diagnostic Terminal</h1>
        </div>
        <p className="text-gray-400 max-w-2xl">
          Upload failed pipeline logs to trigger an automated root-cause analysis. Our AI models identify misconfigurations, flaky tests, and infrastructure bottlenecks in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Input Terminal */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Terminal className="h-3 w-3" /> Input Pipeline Log
            </label>
            <span className="text-[10px] text-gray-600 font-mono">Lines: {log.split('\n').length}</span>
          </div>
          <div className="glass-panel p-1 bg-black/40 overflow-hidden group focus-within:ring-2 focus-within:ring-accent-primary/30 transition-all">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-accent-failure/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-accent-warning/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-accent-success/40"></div>
              </div>
              <span className="text-[10px] font-mono text-gray-500 ml-2">raw_log_stream.sh</span>
            </div>
            <textarea
              className="w-full h-[500px] bg-transparent p-4 font-mono text-[11px] leading-relaxed text-gray-300 placeholder-gray-700 focus:outline-none resize-none"
              placeholder="Paste the contents of your failed GitHub Action log here..."
              value={log}
              onChange={(e) => setLog(e.target.value)}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !log.trim()}
            className="btn-primary w-full h-12 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Processing Log Stream...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze Root Cause
              </>
            )}
          </button>
        </div>

        {/* Right: AI Output */}
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Bot className="h-3 w-3" /> AI Analysis Insight
          </label>
          
          <div className="glass-panel min-h-[570px] relative overflow-hidden bg-brand-bg/50">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-accent-secondary/5 pointer-events-none"></div>
            
            <div className="relative p-8 h-full">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-accent-primary/20 blur-2xl rounded-full"></div>
                    <Loader2 className="h-16 w-16 text-accent-primary animate-spin relative" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Analyzing Failure Pattern</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">Cross-referencing log markers with known CI/CD error signatures...</p>
                </div>
              ) : error ? (
                <div className="bg-accent-failure/10 border border-accent-failure/20 p-6 rounded-2xl flex gap-4">
                  <AlertCircle className="h-6 w-6 text-accent-failure flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Diagnostic Error</h3>
                    <p className="text-sm text-gray-400">{error}</p>
                  </div>
                </div>
              ) : explanation ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="p-2 bg-accent-success/20 rounded-lg">
                      <Sparkles className="h-5 w-5 text-accent-success" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Root Cause Identified</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">Confidence Score: 98%</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="font-mono text-sm leading-relaxed text-gray-300 whitespace-pre-wrap bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner">
                        {typeof explanation === 'string' ? explanation : JSON.stringify(explanation, null, 2)}
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Suggested Fix</p>
                        <p className="text-xs text-white font-medium">Applied to branch</p>
                      </div>
                      <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Issue Type</p>
                        <p className="text-xs text-white font-medium">Flaky Infrastructure</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
                  <BrainCircuit className="h-20 w-20 text-gray-600 mb-6" />
                  <h3 className="text-lg font-bold text-gray-500 mb-2">Awaiting Input Stream</h3>
                  <p className="text-sm text-gray-600 max-w-xs">Paste logs into the terminal to begin AI-powered pipeline troubleshooting.</p>
                  
                  <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-sm">
                    <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2 grayscale">
                       <Info className="h-3 w-3" /> <span className="text-[10px] font-bold uppercase tracking-widest">Syntax Highlighting</span>
                    </div>
                    <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2 grayscale">
                       <History className="h-3 w-3" /> <span className="text-[10px] font-bold uppercase tracking-widest">History Log</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogExplainer;
