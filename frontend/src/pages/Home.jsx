import React, { useState } from 'react';
import { getRepos } from '../services/api';
import RepoCard from '../components/RepoCard';
import { Search, Loader2, Activity, GitBranch, Globe, Cpu, Database, Cloud } from 'lucide-react';

const Home = () => {
  const [username, setUsername] = useState('');
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const quickSearch = ['Vercel', 'Netflix', 'Microsoft', 'Kubernetes', 'OpenAI'];

  const handleSearch = async (e, customUser) => {
    if (e) e.preventDefault();
    const user = customUser || username;
    if (!user.trim()) return;

    if (customUser) setUsername(customUser);

    setLoading(true);
    setError(null);

    try {
      const data = await getRepos(user);
      setRepos(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch repositories. Please check the username and try again.');
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const getMetrics = () => {
    if (repos.length === 0) return null;
    let totalWorkflows = 0;
    let successfulWorkflows = 0;
    let totalCompleted = 0;

    repos.forEach(repo => {
      if (repo.workflows) {
        totalWorkflows += repo.workflows.length;
        repo.workflows.forEach(w => {
          if (w.status === 'completed') {
            totalCompleted++;
            if (w.conclusion === 'success') successfulWorkflows++;
          }
        });
      }
    });

    const orgHealth = totalCompleted > 0 ? Math.round((successfulWorkflows / totalCompleted) * 100) : 0;

    return {
      totalRepos: repos.length,
      totalWorkflows,
      orgHealth
    };
  };

  const metrics = getMetrics();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Section - Compact */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-primary/10 border border-accent-primary/20 rounded-full text-accent-primary text-xs font-bold uppercase tracking-widest mb-4">
            <Cpu className="h-3 w-3" /> AI-Powered Observability
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            DevOps Observatory
          </h1>
          <p className="text-lg text-gray-400 max-w-xl">
            Real-time insights into CI/CD health and repository stability. Monitor, analyze, and optimize your delivery pipeline.
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="glass-panel p-1 ai-glow">
            <form onSubmit={handleSearch} className="flex flex-col gap-2 p-4">
              <div className="relative">
                <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-search pl-12"
                  placeholder="GitHub Organization or Username"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="btn-primary w-full py-3 h-12"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Run Analysis'}
              </button>
            </form>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
            <span className="text-xs text-gray-500 mr-1 mt-1">Quick Search:</span>
            {quickSearch.map(s => (
              <button
                key={s}
                onClick={() => handleSearch(null, s)}
                className="text-xs px-2 py-1 bg-white/5 border border-white/5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-8 glass-panel border-accent-failure/30 bg-accent-failure/5 p-4 flex gap-4 items-center">
          <div className="w-10 h-10 rounded-full bg-accent-failure/20 flex items-center justify-center flex-shrink-0">
            <Activity className="h-5 w-5 text-accent-failure" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Analysis Failed</h3>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        </div>
      )}

      {repos.length > 0 && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Metrics Section */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Repositories</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-extrabold text-white">{metrics.totalRepos}</span>
                  <span className="text-xs text-accent-success mb-1 flex items-center">↑ 2</span>
                </div>
                <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-primary w-3/4 rounded-full" />
                </div>
              </div>

              <div className="glass-card p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Workflows</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-extrabold text-white">{metrics.totalWorkflows}</span>
                  <span className="text-xs text-gray-500 mb-1">Across org</span>
                </div>
                <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-secondary w-1/2 rounded-full" />
                </div>
              </div>

              <div className="glass-card p-5 col-span-1 md:col-span-2 bg-gradient-to-br from-accent-primary/10 to-transparent">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Organization Health</p>
                    <span className="text-3xl font-extrabold text-white">{metrics.orgHealth}%</span>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${metrics.orgHealth >= 80 ? 'bg-accent-success/20 text-accent-success' :
                      metrics.orgHealth >= 50 ? 'bg-accent-warning/20 text-accent-warning' : 'bg-accent-failure/20 text-accent-failure'
                    }`}>
                    {metrics.orgHealth >= 80 ? 'Elite Performance' : metrics.orgHealth >= 50 ? 'Stable' : 'At Risk'}
                  </div>
                </div>
                <div className="mt-4 flex gap-1 h-2">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${i < metrics.orgHealth / 10 ? 'bg-accent-success' : 'bg-white/5'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Repository Feed */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Database className="h-5 w-5 text-accent-primary" />
                Repository Observability Feed
                <span className="text-sm font-normal text-gray-500 ml-2">({repos.length} tracked)</span>
              </h2>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-white/5 rounded-md text-xs text-gray-400 border border-white/5 cursor-pointer hover:bg-white/10">Filter</div>
                <div className="px-3 py-1 bg-white/5 rounded-md text-xs text-gray-400 border border-white/5 cursor-pointer hover:bg-white/10">Sort</div>
              </div>
            </div>

            <div className="space-y-4">
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} username={username} />
              ))}
            </div>
          </div>
        </div>
      )}

      {repos.length === 0 && !loading && !error && (
        <div className="mt-20 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
            <Search className="h-10 w-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No active observations</h2>
          <p className="text-gray-500">Enter a GitHub handle to start monitoring pipelines.</p>
        </div>
      )}
    </div>
  );
};

export default Home;
