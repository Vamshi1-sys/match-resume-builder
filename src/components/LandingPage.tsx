import React from 'react';
import { AppScreen } from '../types';
import { Sparkles, CheckCircle2, ShieldCheck, Download, Zap, Target, ArrowRight, FileCheck2, UserCheck } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLoadSample: () => void;
  hasProfile: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLoadSample, hasProfile }) => {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-16 pb-12 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center px-4 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI-Powered ATS Resume Optimization</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Paste a Job Description. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600">
              Get a tailored, ATS-ready resume in seconds.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            ResuMatch AI analyzes job requirements against your real experiences to optimize keywords, align bullet points, proofread grammar, and boost your ATS match score — with zero fabricated facts.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-get-started-btn"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{hasProfile ? "Tailor Resume Now" : "Get Started"}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="hero-sample-demo-btn"
              onClick={onLoadSample}
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
            >
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>Load Demo Profile & Job</span>
            </button>
          </div>

          {/* Quick Stats Badges */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <p className="text-2xl font-bold text-slate-900">100%</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">Truthful & Fact-Based</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <p className="text-2xl font-bold text-blue-600">15-20</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">ATS Keywords Matched</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <p className="text-2xl font-bold text-slate-900">0-100</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">ATS Score Meter</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <p className="text-2xl font-bold text-emerald-600">1-Click</p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">Device PDF Export</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How ResuMatch AI Works</h2>
          <p className="text-slate-600 max-w-xl mx-auto">Three quick steps to transform your job search and stand out to hiring managers.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Setup Your Base Profile</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enter your contact information, education, work history, projects, and skill inventory once. Your profile stays safely stored in your browser.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>One-time setup, editable anytime</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Paste Job Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Copy and paste the target job description. Gemini AI extracts mandatory technical skills, soft skills, and keyword frequencies.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <Target className="w-4 h-4" />
              <span>Extracts 15-20 crucial keywords</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Get ATS Resume & PDF</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Receive an ATS match score, tailored bullet points, grammar fixes, missing skills alert, and a clean, print-ready PDF ready to download.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <Download className="w-4 h-4" />
              <span>Export formatted PDF instantly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-6xl mx-auto px-4 pt-4">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-8 relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Engineered specifically for ATS scanners and human recruiters.
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Applicant Tracking Systems parse text top-to-bottom. We construct standard single-column, clean layout resumes with high keyword density — while maintaining 100% truthfulness to your actual career experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 pt-4">
            <div className="flex gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-white">Truth Preserving</h4>
                <p className="text-xs text-slate-300 mt-1">Never hallucinates experience, skills, or fake companies.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Zap className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-white">Action Verb Enhancement</h4>
                <p className="text-xs text-slate-300 mt-1">Rewrites passive bullets into strong, metric-driven achievements.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <FileCheck2 className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-white">Proofreading Guard</h4>
                <p className="text-xs text-slate-300 mt-1">Fixes typos, tense inconsistencies, and grammatical slips.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
