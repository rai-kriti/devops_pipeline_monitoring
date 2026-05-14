import React, { useState } from 'react';
import { Bot, Loader2, X, Activity, Sparkles, AlertTriangle, ExternalLink, Terminal } from 'lucide-react';
import { autoDiagnose } from '../services/api';

const WorkflowBadge = ({ run, username, repoName }) => {
  const statusConfig = {
    success: { color: 'text-accent-success', bg: 'bg-accent-success/10', border: 'border-accent-success/20' },
    failure: { color: 'text-accent-failure', bg: 'bg-accent-failure/10', border: 'border-accent-failure/20' },
    in_progress: { color: 'text-accent-warning', bg: 'bg-accent-warning/10', border: 'border-accent-warning/20' },
    queued: { color: 'text-accent-info', bg: 'bg-accent-info/10', border: 'border-accent-info/20' },
    skipped: { color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' }
  };

  const getStatusKey = () => {
    if (run.status === 'in_progress' || run.status === 'queued') return run.status;
    if (run.conclusion === 'success') return 'success';
    if (run.conclusion === 'failure') return 'failure';
    if (run.conclusion === 'skipped') return 'skipped';
    return 'queued';
  };

  const config = statusConfig[getStatusKey()];

  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleDiagnose = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
    if (diagnosis) return;

    setIsDiagnosing(true);
    setError(null);
    try {
      const data = await autoDiagnose(username, repoName, run.id);
      setDiagnosis(data.explanation);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to auto-diagnose. Logs might be expired.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 mb-1 group/badge">
        <a 
          href={run.html_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.color} ${config.border} hover:bg-white/10 transition-all`}
          title={run.name}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${config.color === 'text-gray-400' ? 'bg-gray-400' : config.color.replace('text-', 'bg-')} ${run.status === 'in_progress' ? 'animate-pulse' : ''}`}></div>
          {getStatusKey().replace('_', ' ')}
        </a>
        {run.conclusion === 'failure' && (
          <button
            onClick={handleDiagnose}
            className="flex items-center justify-center w-5 h-5 rounded-md bg-accent-failure/20 hover:bg-accent-failure/40 text-accent-failure transition-all border border-accent-failure/30"
            title="AI Root Cause Analysis"
          >
            <Sparkles size={10} />
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-md" onClick={() => setShowModal(false)}>
          <div 
            className="glass-panel max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border-white/10 ai-glow" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-accent-failure/20 text-accent-failure border border-accent-failure/20">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Failure Diagnostic Trace
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{run.name}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto bg-brand-bg/40">
              {isDiagnosing ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-accent-primary/20 blur-xl rounded-full"></div>
                    <Loader2 className="animate-spin h-12 w-12 text-accent-primary relative" />
                  </div>
                  <h4 className="text-white font-bold mb-1">Engaging AI Diagnostic Engines</h4>
                  <p className="text-xs text-gray-500 max-w-xs">Scanning remote execution environments and log streams for failure markers...</p>
                </div>
              ) : error ? (
                <div className="bg-accent-failure/10 border border-accent-failure/20 p-6 rounded-2xl flex gap-4">
                  <AlertTriangle className="h-6 w-6 text-accent-failure flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">Diagnostic System Fault</h3>
                    <p className="text-sm text-gray-400">{error}</p>
                  </div>
                </div>
              ) : diagnosis ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-success/10 border border-accent-success/20 rounded-lg w-fit">
                    <Bot size={14} className="text-accent-success" />
                    <span className="text-[10px] font-bold text-accent-success uppercase tracking-widest">Oracle Analysis Complete</span>
                  </div>
                  
                  <div className="space-y-6">
                    {typeof diagnosis === 'object' && diagnosis !== null ? (
                      <>
                        <div className="p-4 bg-white/5 border-l-4 border-accent-failure rounded-r-xl">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Critical Summary</h4>
                          <p className="text-sm font-bold text-white">{diagnosis.summary}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Root Cause Analysis</h4>
                            <p className="text-xs text-gray-300 leading-relaxed">{diagnosis.root_cause}</p>
                          </div>
                          <div className="p-4 bg-accent-primary/10 rounded-xl border border-accent-primary/20">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent-primary mb-2">Action Required</h4>
                            <p className="text-xs font-bold text-white leading-relaxed">{diagnosis.action_required}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                            <Terminal size={12} /> Fix Instructions
                          </h4>
                          <ul className="space-y-2">
                            {diagnosis.fix_instructions?.map((step, i) => (
                              <li key={i} className="text-[11px] text-gray-400 flex gap-3">
                                <span className="text-accent-primary font-bold">{i + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Severity:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              diagnosis.severity === 'high' ? 'bg-accent-failure text-white' : 
                              diagnosis.severity === 'medium' ? 'bg-accent-warning text-black' : 'bg-accent-success text-white'
                            }`}>
                              {diagnosis.severity}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="terminal-box bg-black/60 border-white/5 text-xs text-gray-300 leading-relaxed shadow-2xl">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5 opacity-50">
                          <Terminal size={12} />
                          <span className="text-[10px] uppercase font-bold tracking-tighter">Diagnostic Report v1.0.4</span>
                        </div>
                        <p>{diagnosis}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <a 
                      href={run.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-bold text-accent-primary hover:text-white transition-colors"
                    >
                      Inspect Raw Logs <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkflowBadge;
