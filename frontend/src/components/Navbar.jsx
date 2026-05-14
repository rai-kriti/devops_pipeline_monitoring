import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Terminal, Search, User } from 'lucide-react';

const Navbar = ({ backendStatus }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Observatory', path: '/', icon: LayoutDashboard },
    { name: 'AI Diagnostics', path: '/ai-explainer', icon: Terminal },
  ];

  return (
    <nav className="nav-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-1.5 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg transition-transform group-hover:scale-110">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </Link>
            
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.path
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <div className="relative flex h-2 w-2">
                {backendStatus === 'online' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-success opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  backendStatus === 'online' ? 'bg-accent-success' : 
                  backendStatus === 'offline' ? 'bg-accent-failure' : 'bg-accent-warning'
                }`}></span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {backendStatus === 'online' ? 'Live' : backendStatus}
              </span>
            </div>

            <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 cursor-pointer transition-all">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
