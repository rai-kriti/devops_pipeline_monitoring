import React, { useState } from 'react';
import { Database, Tag, Calendar, ChevronDown, ChevronUp, Brain, TrendingUp, TrendingDown, ExternalLink, Star, HardDrive, AlertTriangle, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { analyzeDockerImage } from '../services/api';

const DockerCard = ({ image, username }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getHealthColor = (status) => {
    switch (status) {
      case 'Healthy': return 'text-accent-success';
      case 'Fair': return 'text-accent-warning';
      case 'Stale': return 'text-accent-failure';
      default: return 'text-gray-500';
    }
  };

  const getHealthBg = (status) => {
    switch (status) {
      case 'Healthy': return 'bg-accent-success/10 border-accent-success/20';
      case 'Fair': return 'bg-accent-warning/10 border-accent-warning/20';
      case 'Stale': return 'bg-accent-failure/10 border-accent-failure/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const metadata = {
        username,
        image: image.name,
        pull_count: image.pull_count,
        star_count: image.star_count,
        last_updated: image.last_updated,
        days_since_update: image.health.daysSinceUpdate,
        tags: image.tags.map(t => ({ name: t.name, size_mb: Math.round(t.full_size / (1024 * 1024)), last_updated: t.last_updated })),
        has_latest_tag: image.tags.some(t => t.name === 'latest'),
        health_score: image.health.status
      };
      const data = await analyzeDockerImage(metadata);
      setAnalysis(data.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sizeTrend = image.tags.length >= 2 
    ? (image.tags[0].full_size > image.tags[1].full_size ? 'up' : 'down') 
    : 'stable';

  return (
    <div className={`glass-card group overflow-hidden transition-all duration-500 ${isExpanded ? 'ring-2 ring-accent-primary/20' : ''}`}>
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center border border-white/5 group-hover:border-accent-primary/30 transition-all">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white truncate group-hover:text-accent-primary transition-colors">
                <a href={`https://hub.docker.com/r/${username}/${image.name}`} target="_blank" rel="noopener noreferrer">
                  {image.name}
                </a>
              </h3>
              <a href={`https://hub.docker.com/r/${username}/${image.name}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 text-gray-600 hover:text-white transition-colors" />
              </a>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <HardDrive className="h-3 w-3" /> {image.pull_count.toLocaleString()} Pulls
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Star className="h-3 w-3" /> {image.star_count}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {new Date(image.last_updated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Size Trend Indicator */}
          <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md border border-white/5 mr-2">
            {sizeTrend === 'up' ? (
              <>
                <TrendingUp className="h-3 w-3 text-accent-failure" />
                <span className="text-[10px] font-bold text-accent-failure uppercase">Growing</span>
              </>
            ) : sizeTrend === 'down' ? (
              <>
                <TrendingDown className="h-3 w-3 text-accent-success" />
                <span className="text-[10px] font-bold text-accent-success uppercase">Optimized</span>
              </>
            ) : (
              <span className="text-[10px] font-bold text-gray-500 uppercase">Stable</span>
            )}
          </div>

          <div className={`flex flex-col items-center justify-center min-w-[80px] h-12 rounded-lg border ${getHealthBg(image.health.status)} transition-all`}>
            <span className={`text-sm font-black uppercase tracking-tighter ${getHealthColor(image.health.status)}`}>
              {image.health.status}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mt-1">Health Score</span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-accent-primary text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'}`}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100 border-t border-white/5' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="p-6 space-y-8 bg-brand-bg/30">
          
          {/* AI Analysis Button for Fair/Stale */}
          {(image.health.status !== 'Healthy' || analysis) && (
            <div className={`glass-panel p-5 border-l-4 ${analysis ? (analysis.severity === 'high' ? 'border-accent-failure' : 'border-accent-warning') : 'border-accent-primary'} bg-black/40 ai-glow`}>
              {!analysis ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-primary/20 rounded-lg">
                      <Brain className={`h-5 w-5 text-accent-primary ${isAnalyzing ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">AI Image Hygiene Audit</h4>
                      <p className="text-xs text-gray-500">Analyze potential vulnerabilities and optimization opportunities.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="btn-primary py-2 px-4 text-xs h-auto flex items-center gap-2"
                  >
                    {isAnalyzing ? <Clock className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                    {isAnalyzing ? 'Analyzing...' : 'Run AI Diagnostic'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-accent-primary" />
                      AI HYGIENE AUDIT REPORT
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      analysis.severity === 'high' ? 'bg-accent-failure text-white' : 
                      analysis.severity === 'medium' ? 'bg-accent-warning text-black' : 'bg-accent-success text-white'
                    }`}>
                      {analysis.severity} Risk
                    </span>
                  </div>
                  
                  <p className="text-sm font-bold text-white leading-relaxed">{analysis.summary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Detected Issues</h5>
                      <ul className="space-y-1">
                        {analysis.issues?.map((issue, i) => (
                          <li key={i} className="text-xs text-gray-400 flex gap-2">
                            <span className="text-accent-failure">•</span> {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recommended Action</h5>
                      <p className="text-xs text-accent-success font-bold leading-relaxed">{analysis.recommendation}</p>
                    </div>
                  </div>
                  
                  {analysis.warning && (
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-accent-failure font-bold uppercase tracking-wider bg-accent-failure/10 p-2 rounded-md border border-accent-failure/20">
                      <AlertTriangle size={12} />
                      <span>Warning: {analysis.warning}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tags and Sizes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-4 w-4 text-accent-secondary" />
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Tags & Dimensions</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {image.tags.map((tag, i) => (
                <div key={i} className="bg-black/20 border border-white/5 p-3 rounded-xl hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between mb-2 gap-4">
                    <span className="text-sm font-bold text-white flex items-center gap-2 min-w-0 flex-1">
                      {tag.name === 'latest' && <CheckCircle2 className="h-3 w-3 text-accent-success flex-shrink-0" />}
                      <span className="truncate" title={tag.name}>
                        {tag.name.length > 18 ? `${tag.name.substring(0, 12)}...` : tag.name}
                      </span>
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">{new Date(tag.last_updated).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Compressed Size</span>
                    <span className="text-xs font-bold text-accent-primary">{formatSize(tag.full_size)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DockerCard;
