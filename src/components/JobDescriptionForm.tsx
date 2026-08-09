import React, { useState } from 'react';
import { SAMPLE_JOB_DESCRIPTION } from '../utils/sampleProfile';
import { Sparkles, FileText, AlertCircle, Building2, Briefcase, RefreshCw, CheckCircle2 } from 'lucide-react';

interface JobDescriptionFormProps {
  onSubmit: (jobDescription: string, jobTitle: string, companyName: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  hasProfile: boolean;
  onGoToProfile: () => void;
}

export const JobDescriptionForm: React.FC<JobDescriptionFormProps> = ({
  onSubmit,
  isLoading,
  errorMessage,
  onClearError,
  hasProfile,
  onGoToProfile,
}) => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Word count helper
  const words = jobDescription.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const isWordCountValid = wordCount >= 50;

  const handleLoadSampleJD = () => {
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    setJobTitle('Senior Full-Stack Engineer');
    setCompanyName('TechScale Inc.');
    setLocalError(null);
    onClearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    onClearError();

    if (!hasProfile) {
      setLocalError('Please complete your profile details first before generating a tailored resume.');
      return;
    }

    if (!isWordCountValid) {
      setLocalError(`Job description must contain at least 50 words to generate an accurate ATS match. Currently: ${wordCount} words.`);
      return;
    }

    await onSubmit(jobDescription, jobTitle, companyName);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Target Job Description
            <Sparkles className="w-6 h-6 text-blue-600" />
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Paste the complete target job posting. Gemini AI will extract key terms, compare with your profile, and optimize bullet points.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSampleJD}
          className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer border border-blue-200 self-start sm:self-auto shrink-0"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Paste Sample Job Posting</span>
        </button>
      </div>

      {/* Warning if profile is empty */}
      {!hasProfile && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">Profile details are incomplete</p>
            <p className="text-xs text-amber-800">
              You need at least basic contact info and experience in your profile so the AI has real facts to work with.
            </p>
          </div>
          <button
            onClick={onGoToProfile}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0"
          >
            Setup Profile →
          </button>
        </div>
      )}

      {/* Error Banners */}
      {(localError || errorMessage) && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Validation / Processing Error</p>
            <p className="text-xs text-red-800 mt-0.5">{localError || errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Optional Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              Target Job Title (Optional)
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer"
              disabled={isLoading}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Target Company Name (Optional)
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Stripe / Google / Acme Corp"
              disabled={isLoading}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* Textarea Area */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-slate-900">
              Paste Full Job Description Text *
            </label>
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              isWordCountValid
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {wordCount} words {isWordCountValid ? '(Ready)' : '(Min 50 required)'}
            </div>
          </div>

          <textarea
            required
            rows={12}
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            disabled={isLoading}
            placeholder="Paste the complete job description here, including responsibilities, required technical skills, qualifications, tools, and nice-to-haves..."
            className="w-full p-4 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-slate-100 font-sans leading-relaxed resize-y"
          />

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Tip: Include the full text for maximum keyword precision.</span>
            <span>Character count: {jobDescription.length}</span>
          </div>
        </div>

        {/* SUBMIT BUTTON WITH LOADING STATE */}
        <div className="pt-2">
          {isLoading ? (
            <div className="p-8 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  ResuMatch AI is Tailoring Your Resume...
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Gemini 3.6 Flash is extracting 20+ job keywords, cross-referencing your profile, boosting action verbs, proofreading grammar, and computing your ATS score.
                </p>
              </div>

              <div className="flex justify-center items-center gap-6 text-xs font-medium text-blue-700 pt-2">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Fact Check Guard
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> ATS Keyword Match
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Grammar Proofreading
                </span>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              id="generate-tailored-resume-btn"
              disabled={!isWordCountValid || !hasProfile}
              className={`w-full py-4 rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isWordCountValid && hasProfile
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>Generate Tailored Resume & ATS Score</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
