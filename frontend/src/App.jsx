import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LogExplainer from './pages/LogExplainer';
import { checkHealth } from './services/api';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await checkHealth();
        if (res.status === 'healthy') {
          setBackendStatus('online');
        } else {
          setBackendStatus('error');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    };
    
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-brand-bg flex flex-col selection:bg-accent-primary/30 selection:text-white">
        <Navbar backendStatus={backendStatus} />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ai-explainer" element={<LogExplainer />} />
          </Routes>
        </main>
        
        <footer className="border-t border-white/5 py-10 mt-auto bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
              {/* Left: Name */}
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-accent-primary/20">
                  KR
                </div>
                <span className="text-sm font-black text-white tracking-widest uppercase">KRITI RAI</span>
              </div>
              
              {/* Center: Copyright */}
              <div className="text-center">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                  Modern Observability &copy; {new Date().getFullYear()}
                </p>
              </div>

              {/* Right: Socials */}
              <div className="flex gap-6 items-center justify-center md:justify-end">
                <a href="https://instagram.com/kritirai.sde" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-gray-500 hover:text-accent-primary transition-colors uppercase tracking-widest">
                  Instagram
                </a>
                <a href="https://linkedin.com/in/rai-kriti" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-gray-500 hover:text-accent-primary transition-colors uppercase tracking-widest">
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
