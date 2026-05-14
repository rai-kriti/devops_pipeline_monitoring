import React, { useState, useEffect } from 'react';
import { Star, GitBranch, Activity, Calendar, RefreshCcw, AlertOctagon, ChevronDown, ChevronUp, BarChart2, ExternalLink, Cpu, Timer, CheckCircle2, XCircle, PlayCircle, SkipForward, Info } from 'lucide-react';
import WorkflowBadge from './WorkflowBadge';
import DoraMetrics from './DoraMetrics';
import { analyzePattern } from '../services/api';

const RepoCard = ({ repo, username }) => {
  const [pattern, setPattern] = useState(null);
  const [isAnalyzingPattern, setIsAnalyzingPattern] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const detectPattern = async () => {
      if (!repo.workflows) return;
      const failedRunIds = repo.workflows
        .filter(w => w.conclusion === 'failure')
        .map(w => w.id);

      if (failedRunIds.length >= 2) {
        setIsAnalyzingPattern(true);
        try {
          const data = await analyzePattern(username, repo.name, failedRunIds);
          if (data.pattern) setPattern(data.pattern);
        } catch (e) {
          console.error(e);
        } finally {
          setIsAnalyzingPattern(false);
        }
      }
    };
    detectPattern();
  }, [repo.workflows, username, repo.name]);

  const calculateHealthScore = () => {
    if (!repo.workflows || repo.workflows.length === 0) return null;
    const successes = repo.workflows.filter(w => w.conclusion === 'success').length;
    const completed = repo.workflows.filter(w => w.status === 'completed').length;
    if (completed === 0) return 0;
    return Math.round((successes / completed) * 100);
  };

  const healthScore = calculateHealthScore();

  const getHealthColor = (score) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-accent-success';
    if (score >= 50) return 'text-accent-warning';
    return 'text-accent-failure';
  };

  const getHealthBg = (score) => {
    if (score === null) return 'bg-gray-500/10';
    if (score >= 80) return 'bg-accent-success/10 border-accent-success/20';
    if (score >= 50) return 'bg-accent-warning/10 border-accent-warning/20';
    return 'bg-accent-failure/10 border-accent-failure/20';
  };

  const hasMetrics = repo.workflows && repo.workflows.length > 0;

  // Count workflow states
  const stats = {
    success: repo.workflows?.filter(w => w.conclusion === 'success').length || 0,
    failed: repo.workflows?.filter(w => w.conclusion === 'failure').length || 0,
    running: repo.workflows?.filter(w => w.status === 'in_progress' || w.status === 'queued').length || 0,
    skipped: repo.workflows?.filter(w => w.conclusion === 'skipped').length || 0,
  };

  return (
    <div className={`glass-card group overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-2 ring-accent-primary/20' : ''}`}>
      {/* Top Header Section */}
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center border border-white/5 group-hover:border-accent-primary/30 transition-all">
            <GitBranch className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white truncate group-hover:text-accent-primary transition-colors">
                <a href={`https://github.com/${username}/${repo.name}`} target="_blank" rel="noopener noreferrer">
                  {repo.name}
                </a>
              </h3>
              <a href={`https://github.com/${username}/${repo.name}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 text-gray-600 hover:text-white transition-colors" />
              </a>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {repo.language && (
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                  {repo.language}
                </span>
              )}
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Star className="h-3 w-3" /> {repo.stargazers_count}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Timer className="h-3 w-3" /> {new Date(repo.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Workflow Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="flex bg-black/20 p-1 rounded-lg border border-white/5" title="Workflow Executions">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-accent-success uppercase" title="Successes">
              <CheckCircle2 className="h-3 w-3" /> {stats.success}
              <span className="hidden lg:inline text-[8px] opacity-50 ml-0.5">Success</span>
            </div>
            <div className="w-[1px] h-3 bg-white/5 self-center mx-1"></div>
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-accent-failure uppercase" title="Failures">
              <XCircle className="h-3 w-3" /> {stats.failed}
              <span className="hidden lg:inline text-[8px] opacity-50 ml-0.5">Failed</span>
            </div>
            <div className="w-[1px] h-3 bg-white/5 self-center mx-1"></div>
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-accent-info uppercase" title="In Progress / Queued">
              <PlayCircle className="h-3 w-3" /> {stats.running}
              <span className="hidden lg:inline text-[8px] opacity-50 ml-0.5">Active</span>
            </div>
          </div>

          <div
            className={`flex flex-col items-center justify-center min-w-[70px] h-12 rounded-lg border ${getHealthBg(healthScore)} transition-all relative group/health`}
          >
            <span className={`text-lg font-black leading-none ${getHealthColor(healthScore)}`}>
              {healthScore !== null ? `${healthScore}%` : 'N/A'}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mt-1 flex items-center gap-1">
              Stability
              <Info size={8} className="text-gray-600" />
            </span>
            
            {/* Tooltip for Stability */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-gray-900 border border-white/10 rounded-lg text-[9px] text-gray-400 opacity-0 group-hover/health:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
              <p className="font-bold text-white mb-1 uppercase tracking-widest">Reliability Score</p>
              Percentage of successful workflow completions. Higher indicates a more stable delivery pipeline.
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-accent-primary text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
              }`}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100 border-t border-white/5' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="p-6 space-y-8 bg-brand-bg/30">
          {/* AI Insights Bar */}
          {(isAnalyzingPattern || pattern) && (
            <div className={`glass-panel p-5 border-l-4 ${
              isAnalyzingPattern ? 'border-accent-secondary' : 
              pattern.priority === 'critical' || pattern.priority === 'high' ? 'border-accent-failure' : 'border-accent-warning'
            } bg-black/40 shadow-2xl ai-glow`}>
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${
                  isAnalyzingPattern ? 'bg-accent-secondary/20 text-accent-secondary' : 
                  pattern.priority === 'critical' || pattern.priority === 'high' ? 'bg-accent-failure/20 text-accent-failure' : 'bg-accent-warning/20 text-accent-warning'
                }`}>
                  <Activity className={`h-5 w-5 ${isAnalyzingPattern ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
                      Systemic Failure Audit
                      {isAnalyzingPattern && <RefreshCcw className="h-3 w-3 animate-spin text-gray-500" />}
                    </h4>
                    {!isAnalyzingPattern && pattern.priority && (
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        pattern.priority === 'critical' ? 'bg-accent-failure text-white' : 
                        pattern.priority === 'high' ? 'bg-accent-failure/50 text-white' : 'bg-accent-warning text-black'
                      }`}>
                        {pattern.priority} Priority
                      </span>
                    )}
                  </div>
                  
                  {isAnalyzingPattern ? (
                    <p className="text-sm text-gray-500 italic">Performing cluster analysis on telemetry streams...</p>
                  ) : typeof pattern === 'object' ? (
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-white leading-relaxed">{pattern.pattern_summary}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Likely Causes</h5>
                          <ul className="space-y-1">
                            {pattern.likely_causes?.map((cause, i) => (
                              <li key={i} className="text-xs text-gray-400 flex gap-2">
                                <span className="text-accent-secondary">•</span> {cause}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Permanent Fix</h5>
                          <p className="text-xs text-accent-success font-bold leading-relaxed">{pattern.permanent_fix}</p>
                        </div>
                      </div>
                      
                      {pattern.warning && (
                        <div className="mt-4 flex items-center gap-2 text-[10px] text-accent-failure/80 font-bold uppercase tracking-wider">
                          <AlertOctagon size={12} />
                          <span>Impact: {pattern.warning}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">{pattern}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DORA Metrics Integration */}
          {hasMetrics ? (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="h-4 w-4 text-accent-primary" />
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">DORA Performance Analytics</h4>
              </div>
              <DoraMetrics workflows={repo.workflows} />
            </div>
          ) : (
            <div className="py-10 text-center glass-panel">
              <Activity className="h-8 w-8 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No telemetry data available for this repository.</p>
            </div>
          )}

          {/* Activity Timeline */}
          {hasMetrics && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-accent-success" />
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Activity Pulse</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {repo.workflows.slice(0, 10).map(run => (
                  <WorkflowBadge key={run.id} run={run} username={username} repoName={repo.name} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RepoCard;
