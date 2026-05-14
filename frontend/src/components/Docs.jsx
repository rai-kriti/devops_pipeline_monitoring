import React from 'react';
import { Book, HelpCircle, Activity, ShieldCheck, Database, Brain, Zap, Clock, Info, ChevronRight } from 'lucide-react';

const Docs = () => {
  const sections = [
    {
      title: "Core Concepts",
      icon: <Book className="h-5 w-5 text-accent-primary" />,
      items: [
        {
          q: "What is Stability?",
          a: "Stability is a reliability metric representing the percentage of successful workflow completions. A score of 100% means every pipeline run succeeded. Anything below 50% is flagged as 'At Risk'."
        },
        {
          q: "How are DORA Metrics calculated?",
          a: "We track three key DORA metrics: Change Failure Rate (ratio of failed to total runs), Mean Time to Recovery (average time to fix a failure), and Throughput (total runs over 30 days)."
        }
      ]
    },
    {
      title: "Docker Hub Registry",
      icon: <Database className="h-5 w-5 text-accent-secondary" />,
      items: [
        {
          q: "How is the Docker Health Score calculated?",
          a: "The score (0-7) is based on: Pulls > 10k (+2), Updated < 30d (+2) or < 90d (+1), Has 'latest' tag (+1), and Stars > 10 (+1)."
        },
        {
          q: "What do the health categories mean?",
          a: "Healthy (6-7): Production-ready. Fair (3-5): Needs minor audit. Stale (0-2): High risk, likely contains unpatched vulnerabilities."
        },
        {
          q: "What is the Size Trend indicator?",
          a: "It compares the size of the most recent tag to the previous one. 'Growing' suggests potential bloat, while 'Optimized' indicates a reduction in image footprint."
        }
      ]
    },
    {
      title: "Observability Charts",
      icon: <Activity className="h-5 w-5 text-accent-success" />,
      items: [
        {
          q: "Why are there gaps in the Deployment Timeline?",
          a: "The chart only plots 'Active Days' where deployments actually occurred. Gaps represent periods of zero activity where no new code was pushed."
        },
        {
          q: "What does the height of the bars represent?",
          a: "The total height is the total number of deployments on that day. The color split shows how many of those deployments were successful (green) vs failed (red)."
        }
      ]
    },
    {
      title: "AI Diagnostics",
      icon: <Brain className="h-5 w-5 text-accent-primary" />,
      items: [
        {
          q: "When should I use the AI Hygiene Audit?",
          a: "Trigger it for 'Fair' or 'Stale' Docker images. The AI analyzes metadata to find specific risks like base-image staleness or missing versioning hygiene."
        },
        {
          q: "What is the Systemic Failure Audit?",
          a: "For GitHub repos, if a specific step (like 'npm test') fails repeatedly across multiple runs, the AI identifies it as a systemic pattern and suggests a permanent fix."
        }
      ]
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="glass-panel p-8 bg-gradient-to-br from-accent-primary/5 to-transparent border-white/5">
        <h2 className="text-3xl font-black text-white mb-4 flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-accent-primary" />
          Documentation & FAQ
        </h2>
        <p className="text-gray-400 max-w-2xl leading-relaxed">
          Welcome to the DevOps Observatory technical guide. Here you can find detailed information about our health scoring algorithms, DORA telemetry, and AI-driven diagnostic patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                {section.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{section.title}</h3>
            </div>
            
            <div className="space-y-6">
              {section.items.map((item, i) => (
                <div key={i} className="group">
                  <h4 className="text-sm font-bold text-accent-primary flex items-center gap-2 mb-2">
                    <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    {item.q}
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed pl-5">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 border-accent-secondary/20 bg-accent-secondary/5">
        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent-secondary" />
          Pro Tip: Contextual Actions
        </h4>
        <p className="text-sm text-gray-400 italic">
          Look for the "AI" icons across the dashboard. They only appear when the system detects a significant health dip or a repeating failure pattern. These are high-value diagnostic points where standard metrics aren't enough.
        </p>
      </div>
    </div>
  );
};

export default Docs;
