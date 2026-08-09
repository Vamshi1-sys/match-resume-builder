import React from 'react';
import { AppScreen } from '../types';
import { FileText, Sparkles, User, FileOutput } from 'lucide-react';

interface HeaderProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  hasResult: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentScreen, onNavigate, hasResult }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => onNavigate('generator')}
          className="flex items-center gap-2.5 cursor-pointer group"
          id="header-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl text-slate-900 tracking-tight">ResuMatch</span>
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">AI</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Instant ATS Resume Tailor</p>
          </div>
        </div>

        {/* Navigation buttons */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="nav-generator"
            onClick={() => onNavigate('generator')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentScreen === 'generator'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Generator</span>
          </button>

          {hasResult && (
            <button
              id="nav-results"
              onClick={() => onNavigate('results')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentScreen === 'results'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <FileOutput className="w-4 h-4 text-emerald-600" />
              <span>RESULT</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

