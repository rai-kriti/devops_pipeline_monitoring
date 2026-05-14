import React, { useState } from 'react';
import { getRepos, getDockerImages } from '../services/api';
import RepoCard from '../components/RepoCard';
import DockerCard from '../components/DockerCard';
import Docs from '../components/Docs';
import { Search, Loader2, Activity, GitBranch, Globe, Cpu, Database, Cloud, Book } from 'lucide-react';

const Home = () => {
  const [username, setUsername] = useState('');
  const [activeTarget, setActiveTarget] = useState('');
  const [repos, setRepos] = useState([]);
  const [dockerImages, setDockerImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('github'); // 'github' | 'docker' | 'docs'

  const githubQuickSearch = ['Vercel', 'Netflix', 'Microsoft', 'Kubernetes', 'OpenAI'];
  const dockerQuickSearch = ['library', 'bitnami', 'grafana', 'linuxserver', 'portainer', 'jwilder', 'wernight'];

  const quickSearch = activeTab === 'github' ? githubQuickSearch : dockerQuickSearch;

  const handleSearch = async (e, customUser, skipCache = false) => {
    if (e) e.preventDefault();
    if (activeTab === 'docs') return;
    
    const user = customUser || username;
    if (!user.trim()) return;

    if (customUser) setUsername(customUser);

    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'github') {
        const data = await getRepos(user, skipCache);
        setRepos(data);
        setActiveTarget(user);
      } else {
        const data = await getDockerImages(user, skipCache);
        setDockerImages(data);
        setActiveTarget(user);
      }
    } catch (err) {
      setError(err.response?.data?.error || `Failed to fetch ${activeTab === 'github' ? 'repositories' : 'Docker images'}. Please check the username and try again.`);
      if (activeTab === 'github') setRepos([]);
      else setDockerImages([]);
      setActiveTarget('');
    } finally {
      setLoading(false);
    }
  };


  // Re-run search when tab changes if username is present
  React.useEffect(() => {
    if (username.trim() && activeTab !== 'docs') {
      handleSearch(null, username);
    }
  }, [activeTab]);


  const getMetrics = () => {
    if (activeTab === 'docs') return null;
    if (activeTab === 'github') {
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
        total: repos.length,
        label: 'Repositories',
        subLabel: 'Total Workflows',
        subValue: totalWorkflows,
        health: orgHealth,
        healthLabel: orgHealth >= 80 ? 'Elite Performance' : orgHealth >= 50 ? 'Stable' : 'At Risk'
      };
    } else {
      if (dockerImages.length === 0) return null;
      const healthyImages = dockerImages.filter(img => img.health.status === 'Healthy').length;
      const totalPulls = dockerImages.reduce((acc, img) => acc + img.pull_count, 0);
      const avgHealth = Math.round((healthyImages / dockerImages.length) * 100);

      return {
        total: dockerImages.length,
        label: 'Docker Images',
        subLabel: 'Total Image Pulls',
        subValue: totalPulls.toLocaleString(),
        health: avgHealth,
        healthLabel: avgHealth >= 80 ? 'Optimal Hygiene' : avgHealth >= 50 ? 'Moderate' : 'Stale Registry'
      };
    }
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

        {activeTab !== 'docs' && (
          <div className="w-full max-w-md">
            <div className="glass-panel p-1 ai-glow">
              <form onSubmit={handleSearch} className="flex flex-col gap-2 p-4">
                <div className="relative">
                  {activeTab === 'github' ? (
                    <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  ) : (
                    <Database className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  )}
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-search pl-12"
                    placeholder={activeTab === 'github' ? "GitHub Organization or Username" : "Docker Hub Namespace / User"}
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

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
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
        )}
      </div>

      {/* Tabs Section */}
      <div className="flex items-center justify-between border-b border-white/5 mb-8">
        <div className="flex overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('github')}
            className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === 'github' ? 'text-accent-primary' : 'text-gray-500 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <GitBranch size={14} />
              GitHub Repositories
            </div>
            {activeTab === 'github' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === 'docker' ? 'text-accent-primary' : 'text-gray-500 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database size={14} />
              Docker Hub Registry
            </div>
            {activeTab === 'docker' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === 'docs' ? 'text-accent-primary' : 'text-gray-500 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Book size={14} />
              Documentation
            </div>
            {activeTab === 'docs' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            )}
          </button>
        </div>

      </div>

      {activeTab === 'docs' ? (
        <Docs />
      ) : (
        <>
          {activeTarget && !loading && !error && (
            <div className="mb-8 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-accent-primary/10 rounded-xl border border-accent-primary/20">
                  {activeTab === 'github' ? <GitBranch className="h-6 w-6 text-accent-primary" /> : <Database className="h-6 w-6 text-accent-primary" />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-0.5">Active Observatory</p>
                  <h2 className="text-3xl font-black text-white flex items-center gap-2">
                    {activeTarget}
                    <span className="text-xs font-normal text-gray-500 px-2 py-0.5 bg-white/5 rounded-md border border-white/10 uppercase tracking-widest">
                      {activeTab}
                    </span>
                  </h2>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 glass-panel border-accent-failure/30 bg-accent-failure/5 p-4 flex gap-4 items-center print:hidden">
              <div className="w-10 h-10 rounded-full bg-accent-failure/20 flex items-center justify-center flex-shrink-0">
                <Activity className="h-5 w-5 text-accent-failure" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Analysis Failed</h3>
                <p className="text-sm text-gray-400">{error}</p>
              </div>
            </div>
          )}

          {((activeTab === 'github' && repos.length > 0) || (activeTab === 'docker' && dockerImages.length > 0)) && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Feed Content */}

              {/* Metrics Section */}
              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-2">
                  <div className="glass-card p-5 print:border-gray-200 print:shadow-none">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{metrics.label}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-extrabold text-white print:text-black">{metrics.total}</span>
                      <span className="text-xs text-accent-success mb-1 flex items-center">↑ Active</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden print:bg-gray-100">
                      <div className="h-full bg-accent-primary w-3/4 rounded-full" />
                    </div>
                  </div>

                  <div className="glass-card p-5 print:border-gray-200 print:shadow-none">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{metrics.subLabel}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-extrabold text-white print:text-black">{metrics.subValue}</span>
                      <span className="text-xs text-gray-500 mb-1">Telemetry</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden print:bg-gray-100">
                      <div className="h-full bg-accent-secondary w-1/2 rounded-full" />
                    </div>
                  </div>

                  <div className="glass-card p-5 col-span-1 md:col-span-2 bg-gradient-to-br from-accent-primary/10 to-transparent print:border-gray-200 print:shadow-none print:col-span-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Hygiene & Health Index</p>
                        <span className="text-3xl font-extrabold text-white print:text-black">{metrics.health}%</span>
                      </div>
                      <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${metrics.health >= 80 ? 'bg-accent-success/20 text-accent-success' :
                          metrics.health >= 50 ? 'bg-accent-warning/20 text-accent-warning' : 'bg-accent-failure/20 text-accent-failure'
                        }`}>
                        {metrics.healthLabel}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-1 h-2">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm ${i < metrics.health / 10 ? 'bg-accent-success' : 'bg-white/5 print:bg-gray-100'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Feed */}
              <div className="print:mt-12">
                <div className="flex justify-between items-center mb-6 print:mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2 print:text-black">
                    <Database className="h-5 w-5 text-accent-primary print:hidden" />
                    {activeTab === 'github' ? 'Repository Observability Feed' : 'Docker Image Registry Feed'}
                    <span className="text-sm font-normal text-gray-500 ml-2 print:text-gray-400">
                      ({activeTab === 'github' ? repos.length : dockerImages.length} tracked)
                    </span>
                  </h2>
                </div>

                <div className="space-y-4 print:space-y-8">
                  {activeTab === 'github' ? (
                    repos.map((repo) => (
                      <RepoCard key={repo.id} repo={repo} username={username} />
                    ))
                  ) : (
                    dockerImages.map((image, i) => (
                      <DockerCard key={i} image={image} username={username} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {((activeTab === 'github' && repos.length === 0) || (activeTab === 'docker' && dockerImages.length === 0)) && !loading && !error && (
            <div className="mt-20 text-center print:hidden">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                {activeTab === 'github' ? <Search className="h-10 w-10 text-gray-600" /> : <Database className="h-10 w-10 text-gray-600" />}
              </div>
              <h2 className="text-2xl font-bold mb-2">No active observations</h2>
              <p className="text-gray-500">Enter a {activeTab === 'github' ? 'GitHub' : 'Docker Hub'} handle to start monitoring.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
