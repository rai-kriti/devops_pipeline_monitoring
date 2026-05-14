import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { Activity, Clock, AlertTriangle, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

const DoraMetrics = ({ workflows }) => {
  const metrics = useMemo(() => {
    if (!workflows || workflows.length === 0) return null;

    const sortedWorkflows = [...workflows].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );

    const completedRuns = sortedWorkflows.filter(w => w.status === 'completed');
    const failedRuns = completedRuns.filter(w => w.conclusion === 'failure');
    const cfr = completedRuns.length > 0 
      ? Math.round((failedRuns.length / completedRuns.length) * 100) 
      : 0;

    const deploymentsByDate = {};
    completedRuns.forEach(run => {
      const date = new Date(run.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!deploymentsByDate[date]) {
        deploymentsByDate[date] = { date, successes: 0, failures: 0, total: 0 };
      }
      deploymentsByDate[date].total++;
      if (run.conclusion === 'success') deploymentsByDate[date].successes++;
      if (run.conclusion === 'failure') deploymentsByDate[date].failures++;
    });
    const chartData = Object.values(deploymentsByDate).slice(-15);

    let totalRecoveryTimeMs = 0;
    let recoveryEvents = 0;
    let lastFailureTime = null;

    sortedWorkflows.forEach(run => {
      if (run.conclusion === 'failure') {
        if (!lastFailureTime) {
          lastFailureTime = new Date(run.created_at);
        }
      } else if (run.conclusion === 'success') {
        if (lastFailureTime) {
          const recoveryTime = new Date(run.created_at) - lastFailureTime;
          totalRecoveryTimeMs += recoveryTime;
          recoveryEvents++;
          lastFailureTime = null;
        }
      }
    });

    const mttrHours = recoveryEvents > 0 
      ? (totalRecoveryTimeMs / recoveryEvents / (1000 * 60 * 60)).toFixed(1)
      : (lastFailureTime ? 'Critical' : 'Stable');

    return {
      cfr,
      chartData,
      mttrHours,
      totalRuns: completedRuns.length,
      isFailing: !!lastFailureTime
    };
  }, [workflows]);

  if (!metrics || metrics.totalRuns === 0) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Change Failure Rate */}
        <div className="glass-panel p-4 bg-white/5 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className="h-12 w-12 text-accent-failure" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Change Failure Rate
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.cfr}%</span>
            <span className={`text-[10px] font-bold ${metrics.cfr < 15 ? 'text-accent-success' : 'text-accent-failure'}`}>
              {metrics.cfr < 15 ? 'Elite' : 'High Risk'}
            </span>
          </div>
        </div>

        {/* MTTR */}
        <div className="glass-panel p-4 bg-white/5 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="h-12 w-12 text-accent-primary" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Activity className="h-3 w-3" /> Mean Time To Recovery
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {typeof metrics.mttrHours === 'string' ? metrics.mttrHours : `${metrics.mttrHours}h`}
            </span>
            {metrics.isFailing && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-failure opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-failure"></span>
              </span>
            )}
          </div>
        </div>

        {/* Deployment Volume */}
        <div className="glass-panel p-4 bg-white/5 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-12 w-12 text-accent-success" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Zap className="h-3 w-3" /> Throughput
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.totalRuns}</span>
            <span className="text-[10px] font-bold text-gray-500">runs/30d</span>
          </div>
        </div>

        {/* Sparkline Concept */}
        <div className="glass-panel p-4 bg-white/5 border-white/5 flex flex-col justify-between">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Reliability Trend
          </p>
          <div className="w-full h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.chartData}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="successes" stroke="#10b981" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {metrics.chartData.length > 0 && (
        <div className="glass-panel p-6 bg-brand-bg/50 border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse"></div>
                Deployment Velocity Timeline
              </h5>
              <p className="text-[10px] text-gray-500 mt-1 max-w-md">
                Historical record of CI/CD throughput. Bars represent daily deployment volume, showing the ratio of stable vs. failing builds.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-success"></div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Success</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-failure"></div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Failure</span>
              </div>
            </div>
          </div>
          
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#4b5563', fontWeight: 600 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#4b5563', fontWeight: 600 }} 
                  allowDecimals={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111827', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '11px',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'
                  }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="successes" name="Success" stackId="a" fill="#10b981" radius={[0, 0, 2, 2]} />
                <Bar dataKey="failures" name="Failure" stackId="a" fill="#f43f5e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoraMetrics;
