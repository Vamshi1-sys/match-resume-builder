import React, { useState } from 'react';
import { Sparkles, FileText, AlertCircle, Upload, CheckCircle2, ArrowRight, RefreshCw, Zap, Loader2, FileCheck } from 'lucide-react';
import { extractTextFromFile } from '../utils/fileExtractor';

interface ResumeGeneratorFormProps {
  onSubmit: (oldResumeText: string, jobDescription: string, jobTitle: string, companyName: string, candidateNameOverride?: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  onClearError: () => void;
}

export const ResumeGeneratorForm: React.FC<ResumeGeneratorFormProps> = ({
  onSubmit,
  isLoading,
  errorMessage,
  onClearError,
}) => {
  const [oldResumeText, setOldResumeText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [candidateName, setCandidateName] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  // File extraction loading and success badges
  const [isExtractingResume, setIsExtractingResume] = useState<boolean>(false);
  const [isExtractingJd, setIsExtractingJd] = useState<boolean>(false);
  const [resumeExtractSuccess, setResumeExtractSuccess] = useState<{ fileName: string; wordCount: number } | null>(null);
  const [jdExtractSuccess, setJdExtractSuccess] = useState<{ fileName: string; wordCount: number } | null>(null);

  // Field touch states for real-time validation feedback
  const [touched, setTouched] = useState<{ oldResume: boolean; jobDescription: boolean }>({
    oldResume: false,
    jobDescription: false,
  });

  // Calculate real-time metrics
  const resumeWordCount = oldResumeText.trim().split(/\s+/).filter(Boolean).length;
  const jdWordCount = jobDescription.trim().split(/\s+/).filter(Boolean).length;

  const isResumeValid = resumeWordCount >= 10;
  const isJdValid = jdWordCount >= 10;
  const isFormReady = isResumeValid && isJdValid;

  // Handle File Upload for Job Description (.txt, .pdf, .docx, .doc)
  const handleJdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingJd(true);
    setLocalError(null);
    onClearError();

    try {
      const result = await extractTextFromFile(file);
      if (result.success && result.text) {
        setJobDescription(result.text);
        setJdExtractSuccess({ fileName: file.name, wordCount: result.wordCount || 0 });
        setTouched(prev => ({ ...prev, jobDescription: true }));
      } else {
        setJobDescription(''); // Clear garbled text
        setJdExtractSuccess(null);
        setLocalError(result.errorMessage || "We couldn't read this file properly. Please try uploading a different PDF/DOCX, or paste your job description text directly into the box.");
      }
    } catch (err: any) {
      setJobDescription('');
      setJdExtractSuccess(null);
      setLocalError("Error parsing file. Please paste text directly into the box below.");
    } finally {
      setIsExtractingJd(false);
      e.target.value = '';
    }
  };

  // Handle File Upload for Old Resume (.txt, .pdf, .docx, .doc)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingResume(true);
    setLocalError(null);
    onClearError();

    try {
      const result = await extractTextFromFile(file);
      if (result.success && result.text) {
        setOldResumeText(result.text);
        setResumeExtractSuccess({ fileName: file.name, wordCount: result.wordCount || 0 });
        setTouched(prev => ({ ...prev, oldResume: true }));
      } else {
        setOldResumeText(''); // Clear garbled binary text
        setResumeExtractSuccess(null);
        setLocalError(result.errorMessage || "We couldn't read this file properly. Please try uploading a different PDF/DOCX, or paste your resume text directly into the box.");
      }
    } catch (err: any) {
      setOldResumeText('');
      setResumeExtractSuccess(null);
      setLocalError("Error parsing resume file. Please paste your text directly into the box below.");
    } finally {
      setIsExtractingResume(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ oldResume: true, jobDescription: true });
    setLocalError(null);
    onClearError();

    if (!oldResumeText.trim()) {
      setLocalError('Mandatory Field Missing: Please paste or upload your Old Resume text.');
      return;
    }

    if (!jobDescription.trim()) {
      setLocalError('Mandatory Field Missing: Please paste or upload the Target Job Description.');
      return;
    }

    if (resumeWordCount < 5) {
      setLocalError('Your Old Resume text is too short. Please provide at least 5-10 words of experience details.');
      return;
    }

    if (jdWordCount < 5) {
      setLocalError('The Job Description is too short. Please paste the full job posting for accurate keyword tailoring.');
      return;
    }

    await onSubmit(oldResumeText, jobDescription, jobTitle, companyName, candidateName);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-blue-100 text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Instant AI Resume Tailoring & ATS Scoring</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Transform Your Old Resume in Seconds
            </h1>
            
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
              Upload your old resume and paste the job description. Our AI builds your new ATS-optimized MNC resume with an instant match score & download button!
            </p>
          </div>
        </div>
      </div>

      {/* Error Banners */}
      {(localError || errorMessage) && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-3 animate-fade-in shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Action Required</p>
            <p className="text-xs text-red-800 mt-0.5">{localError || errorMessage}</p>
          </div>
        </div>
      )}

      {/* Real-time Field Validation Status Bar */}
      <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-2 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-Time Pre-Generation Validation:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-medium">
          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
            isResumeValid 
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
              : touched.oldResume && !oldResumeText.trim()
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
          }`}>
            {isResumeValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>1. Old Resume: {isResumeValid ? 'Ready' : oldResumeText.trim() ? `${resumeWordCount}/10 words` : 'Required'}</span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
            isJdValid 
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
              : touched.jobDescription && !jobDescription.trim()
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
          }`}>
            {isJdValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>2. Job Description: {isJdValid ? 'Ready' : jobDescription.trim() ? `${jdWordCount}/10 words` : 'Required'}</span>
          </div>
        </div>
      </div>

      {/* Main Form Inputs */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: OLD RESUME INPUT */}
          <div className={`bg-white p-6 rounded-3xl border shadow-sm space-y-4 flex flex-col justify-between transition-all ${
            touched.oldResume && !isResumeValid
              ? 'border-rose-300 ring-2 ring-rose-500/10'
              : isResumeValid
              ? 'border-emerald-300 ring-2 ring-emerald-500/10'
              : 'border-slate-200'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">1</span>
                  <span>Your Old Resume</span>
                  <span className="text-xs text-rose-500 font-bold">*Mandatory</span>
                </label>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {isResumeValid ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid
                    </span>
                  ) : touched.oldResume ? (
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" /> Required
                    </span>
                  ) : null}

                  {/* Upload button */}
                  <label className={`text-xs font-semibold flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg border transition-colors ${
                    isExtractingResume
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border-blue-100'
                  }`}>
                    {isExtractingResume ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        <span>Reading PDF...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept=".txt,.pdf,.doc,.docx"
                          disabled={isExtractingResume || isLoading}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </>
                    )}
                  </label>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Paste your existing resume text or upload your file (.pdf, .docx, .txt).
              </p>

              {/* Success Extraction Badge */}
              {resumeExtractSuccess && (
                <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">
                    Extracted text from <strong className="font-bold">{resumeExtractSuccess.fileName}</strong> ({resumeExtractSuccess.wordCount} words)
                  </span>
                </div>
              )}

              <textarea
                required
                rows={5}
                value={oldResumeText}
                onChange={(e) => {
                  setOldResumeText(e.target.value);
                  setResumeExtractSuccess(null);
                  if (!touched.oldResume) setTouched(prev => ({ ...prev, oldResume: true }));
                  if (localError) setLocalError(null);
                }}
                onBlur={() => setTouched(prev => ({ ...prev, oldResume: true }))}
                disabled={isLoading || isExtractingResume}
                placeholder="Paste your old resume text here or upload a PDF/DOCX file above..."
                className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:bg-slate-50 font-sans leading-relaxed resize-y min-h-[130px] transition-all ${
                  touched.oldResume && !isResumeValid
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                    : isResumeValid
                    ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />

              {touched.oldResume && !oldResumeText.trim() && (
                <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Old Resume text is required before generating.
                </p>
              )}
            </div>

            <div className="space-y-1 pt-1">
              <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>Candidate Name, Contact & Details are extracted automatically from your Old Resume!</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Supports PDF, DOCX, TXT upload or copy/paste</span>
                <span className={resumeWordCount >= 10 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                  {resumeWordCount} words {resumeWordCount > 0 && resumeWordCount < 10 ? '(min 10 recommended)' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: JOB DESCRIPTION INPUT */}
          <div className={`bg-white p-6 rounded-3xl border shadow-sm space-y-4 flex flex-col justify-between transition-all ${
            touched.jobDescription && !isJdValid
              ? 'border-rose-300 ring-2 ring-rose-500/10'
              : isJdValid
              ? 'border-emerald-300 ring-2 ring-emerald-500/10'
              : 'border-slate-200'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">2</span>
                  <span>Target Job Description</span>
                  <span className="text-xs text-rose-500 font-bold">*Mandatory</span>
                </label>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {isJdValid ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid
                    </span>
                  ) : touched.jobDescription ? (
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" /> Required
                    </span>
                  ) : null}

                  {/* Upload button for JD */}
                  <label className={`text-xs font-semibold flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg border transition-colors ${
                    isExtractingJd
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border-indigo-100'
                  }`}>
                    {isExtractingJd ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        <span>Reading PDF...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept=".txt,.pdf,.doc,.docx"
                          disabled={isExtractingJd || isLoading}
                          onChange={handleJdFileUpload}
                          className="hidden"
                        />
                      </>
                    )}
                  </label>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Paste or upload the target job posting you are applying for (.pdf, .docx, .txt).
              </p>

              {/* Success Extraction Badge */}
              {jdExtractSuccess && (
                <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">
                    Extracted text from <strong className="font-bold">{jdExtractSuccess.fileName}</strong> ({jdExtractSuccess.wordCount} words)
                  </span>
                </div>
              )}

              <textarea
                required
                rows={5}
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  setJdExtractSuccess(null);
                  if (!touched.jobDescription) setTouched(prev => ({ ...prev, jobDescription: true }));
                  if (localError) setLocalError(null);
                }}
                onBlur={() => setTouched(prev => ({ ...prev, jobDescription: true }))}
                disabled={isLoading || isExtractingJd}
                placeholder="Paste the target job description text here..."
                className={`w-full p-3.5 rounded-2xl border text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:bg-slate-50 font-sans leading-relaxed resize-y min-h-[130px] transition-all ${
                  touched.jobDescription && !isJdValid
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20'
                    : isJdValid
                    ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600'
                }`}
              />

              {touched.jobDescription && !jobDescription.trim() && (
                <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Job Description text is required before generating.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
              <span>Supports PDF, DOCX, TXT upload or copy/paste</span>
              <span className={jdWordCount >= 10 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                {jdWordCount} words {jdWordCount > 0 && jdWordCount < 10 ? '(min 10 recommended)' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Candidate Name, Job Title & Company Inputs */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Candidate Full Name (Optional)
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              placeholder="Extracted from Old Resume if left blank"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Job Title (Optional)
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Company Name (Optional)
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Stripe / Google / Microsoft"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON WITH SPINNER AND VALIDATION CHECK */}
        <div className="pt-2">
          {isLoading ? (
            <div className="p-8 rounded-3xl bg-blue-50 border border-blue-200 text-center space-y-4 shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Building Your New Tailored Resume...
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Parsing your experience, integrating target keywords, rewriting bullet points, proofreading grammar, and generating your instant download file.
                </p>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-blue-800 pt-2">
                <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Real Details Extracted
                </span>
                <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Keyword Optimization
                </span>
                <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Instant PDF Download
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="submit"
                id="generate-btn"
                disabled={!isFormReady}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isFormReady
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.99]'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none border border-slate-300'
                }`}
              >
                {isFormReady ? (
                  <>
                    <span>Generate Tailored Resume</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span>Complete Mandatory Fields Above to Generate</span>
                  </>
                )}
              </button>

              {!isFormReady && (
                <p className="text-center text-xs text-slate-500 font-medium">
                  {!oldResumeText.trim() && !jobDescription.trim()
                    ? 'Fill in both "Your Old Resume" and "Target Job Description" above.'
                    : !oldResumeText.trim()
                    ? 'Please provide text in "Your Old Resume".'
                    : !jobDescription.trim()
                    ? 'Please provide text in "Target Job Description".'
                    : 'Add a bit more detail (at least 10 words per section) for best AI keyword matching results.'}
                </p>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
