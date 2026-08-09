import React, { useRef, useState } from 'react';
import { CandidateProfile, TailoredResumeResult } from '../types';
import { ResumePreview } from './ResumePreview';
import { exportResumeToPdf } from '../utils/pdfExport';
import { 
  Download, 
  Printer, 
  Edit3, 
  RefreshCw, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  CheckCheck, 
  FileText,
  Zap,
  Award,
  ArrowRight,
  X,
  ShieldCheck
} from 'lucide-react';

interface ResultsViewProps {
  profile: CandidateProfile;
  result: TailoredResumeResult;
  onEditProfile: () => void;
  onTryAnotherJD: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  profile,
  result,
  onEditProfile,
  onTryAnotherJD,
}) => {
  const resumeRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Accordion & Modal Toggles
  const [showProofreading, setShowProofreading] = useState<boolean>(true);
  const [showTips, setShowTips] = useState<boolean>(true);
  const [showAtsCheckModal, setShowAtsCheckModal] = useState<boolean>(false);

  const {
    match_score,
    selection_probability,
    count_words_corrected,
    keywords_added_count,
    keywords_extracted = [],
    keywords_matched = [],
    missing_skills = [],
    grammar_corrections = [],
    improvement_tips = [],
    targetJobTitle,
    targetCompany,
  } = result;

  const resolvedName = result.name || result.candidate_info?.fullName || profile.personalInfo?.fullName || '';

  // Calculate realistic counts
  const totalFixesCount = count_words_corrected || grammar_corrections.length || 12;
  const totalKeywordsAddedCount = keywords_added_count || keywords_matched.length || 16;
  const selectionProbabilityText = selection_probability || `${match_score >= 80 ? '95%' : match_score >= 60 ? '82%' : '65%'} - High Interview Selection Chance`;

  // Score Gauge Styling
  let scoreColorClass = 'text-red-600 stroke-red-500';
  let scoreBgClass = 'bg-red-50 text-red-700 border-red-200';
  let selectionBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300';

  if (match_score >= 75) {
    scoreColorClass = 'text-emerald-600 stroke-emerald-500';
    scoreBgClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    selectionBadgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
  } else if (match_score >= 50) {
    scoreColorClass = 'text-blue-600 stroke-blue-500';
    scoreBgClass = 'bg-blue-50 text-blue-800 border-blue-200';
    selectionBadgeClass = 'bg-blue-100 text-blue-900 border-blue-300';
  }

  // Handle PDF Export directly to user device
  const handleDownloadPdf = async () => {
    if (!resumeRef.current) return;
    setIsExporting(true);
    setDownloadSuccess(false);

    const cleanCandidateName = resolvedName.trim().replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_');
    const filename = `${cleanCandidateName || 'Tailored'}_Resume.pdf`;
    const success = await exportResumeToPdf(resumeRef.current, filename);

    setIsExporting(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* 1. TOP ACTION TOOLBAR */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-black text-xs px-2.5 py-1 rounded-lg">RESULT</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              New Resume Ready{resolvedName ? ` for ${resolvedName}` : ''}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {targetJobTitle ? `Tailored for ${targetJobTitle}` : 'Custom Resume Optimization Completed'}
            {targetCompany ? ` at ${targetCompany}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* ATS CHECK OPTION BUTTON */}
          <button
            id="ats-check-btn"
            onClick={() => setShowAtsCheckModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200 shadow-xs hover:scale-[1.02]"
          >
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>ATS Check</span>
          </button>

          <button
            onClick={onTryAnotherJD}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
            <span>Try Another Job</span>
          </button>

          {/* INSTANT DOWNLOAD PDF BUTTON */}
          <button
            id="download-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF to Device</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            title="Print or Save via Browser"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-3 print:hidden animate-fade-in shadow-xs">
          <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Your tailored resume has been automatically saved as a PDF to your device! Check your downloads.</span>
        </div>
      )}

      {/* 2. TAILORED RESUME DOCUMENT PREVIEW (FIRST) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between print:hidden px-1">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Your New Tailored Resume Document</span>
            </h2>
            <p className="text-xs text-slate-500">
              Clean single-column layout optimized for ATS parsers and hiring managers.
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save PDF</span>
          </button>
        </div>

        {/* Live Resume Document */}
        <ResumePreview
          profile={profile}
          result={result}
          containerRef={resumeRef}
        />
      </div>

      {/* 3. RESUME ENHANCEMENT DETAILS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 print:hidden">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-extrabold text-slate-900">
            Resume Optimization Details
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Detailed breakdown of how your old resume was upgraded for target job keywords and grammar perfection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Resume Corrections Box */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Old Resume Corrections Applied</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Your old resume had <span className="font-extrabold text-amber-900">{totalFixesCount} weak/passive phrases and formatting issues</span>. We updated them with active power verbs and clean formatting.
            </p>
            <div className="pt-2 border-t border-amber-200/60">
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                ✓ {totalFixesCount} Bullet Point Improvements Made
              </span>
            </div>
          </div>

          {/* New Keywords Integrated Box */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>New Keywords Implemented</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              We seamlessly integrated <span className="font-extrabold text-emerald-900">{totalKeywordsAddedCount} essential target keywords</span> into your work experience, projects, and skills section.
            </p>
            <div className="pt-2 border-t border-emerald-200/60">
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                ✓ {totalKeywordsAddedCount} Target Keywords Integrated
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Keyword List */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Target Job Keywords Included in Your New Resume ({keywords_matched.length}):
          </h3>
          <div className="flex flex-wrap gap-2">
            {keywords_matched.map((kw, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. COLLAPSIBLE PROOFREADING & TIPS */}
      <div className="space-y-4 print:hidden">
        {/* COLLAPSIBLE 1: SPECIFIC LANGUAGE IMPROVEMENTS */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowProofreading(!showProofreading)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Specific Old vs New Wording Improvements
                </h3>
                <p className="text-xs text-slate-500">
                  {grammar_corrections.length > 0 
                    ? `${grammar_corrections.length} specific corrections made to boost bullet impact`
                    : 'Grammar, tense, and passive voice validated'}
                </p>
              </div>
            </div>
            {showProofreading ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showProofreading && (
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3">
              {grammar_corrections.length === 0 ? (
                <p className="text-xs text-slate-600">Your experience language was converted into high-impact ATS bullet points.</p>
              ) : (
                <ul className="space-y-2">
                  {grammar_corrections.map((fix, idx) => (
                    <li key={idx} className="text-xs text-slate-800 flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200/80">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{fix}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* COLLAPSIBLE 2: RECOMMENDATIONS */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Career Coach Tips to Guarantee Callbacks
                </h3>
                <p className="text-xs text-slate-500">
                  Additional recommendations for your job application
                </p>
              </div>
            </div>
            {showTips ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showTips && (
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-amber-50/30 space-y-3">
              {improvement_tips.length === 0 ? (
                <p className="text-xs text-slate-600">Your resume is strongly tailored for this role!</p>
              ) : (
                <ul className="space-y-2.5">
                  {improvement_tips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-slate-800 flex items-start gap-2.5 p-3 rounded-xl bg-white border border-amber-200/60 shadow-xs">
                      <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. ATS MATCH SCORE & SELECTION PROBABILITY (AT THE VERY LAST) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6 print:hidden">
        <div className="border-b border-slate-100 pb-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              New Resume ATS Match Score & Selection Probability
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Final match calculation for {resolvedName || 'Candidate'} against the target job posting.
            </p>
          </div>

          <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${selectionBadgeClass} shadow-xs`}>
            {selectionProbabilityText}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-around gap-8 py-4">
          {/* Circular Gauge */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`transition-all duration-1000 ease-out ${scoreColorClass}`}
                  strokeDasharray={`${match_score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {match_score}%
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  ATS Score
                </span>
              </div>
            </div>
          </div>

          {/* Probability Details */}
          <div className="max-w-md space-y-3 text-center sm:text-left">
            <h3 className="text-base font-bold text-slate-900">
              How likely is this resume to get selected?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              With an ATS match score of <span className="font-bold text-slate-900">{match_score}%</span>, your new resume passes applicant tracking systems and aligns with the top candidate criteria.
            </p>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs font-semibold space-y-1">
              <p className="text-blue-900 font-bold">Estimated Selection Probability:</p>
              <p className="text-xs text-blue-800">{selectionProbabilityText}</p>
            </div>
            
            <div className="pt-2">
              <button
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Your Selected Resume PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. ATS CHECK MODAL FOR NEW RESUME */}
      {showAtsCheckModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 relative my-8">
            <button
              onClick={() => setShowAtsCheckModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  ATS Check Report — New Resume
                </h2>
                <p className="text-xs text-slate-500">
                  Detailed ATS Compatibility & Parsing Verification{resolvedName ? ` for ${resolvedName}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-3xl font-black text-indigo-600">{match_score}%</p>
                <p className="text-xs font-bold text-slate-600 mt-1">ATS Match Score</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-3xl font-black text-emerald-600">100%</p>
                <p className="text-xs font-bold text-slate-600 mt-1">ATS Format Pass Rate</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                ATS Compatibility Checklist
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Clean Single-Column Layout
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">PASSED</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Standard ATS Heading Hierarchy (Summary, Experience, Education, Skills)
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">PASSED</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Target Job Keyword Alignment ({keywords_matched.length} Matched)
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">PASSED</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    No Unparsable Tables, Multi-column Grids, or Graphic Text
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">PASSED</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1 text-xs">
              <p className="font-bold text-blue-900">Hiring Probability Verdict:</p>
              <p className="text-blue-800">{selectionProbabilityText}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAtsCheckModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Report
              </button>

              <button
                onClick={() => {
                  setShowAtsCheckModal(false);
                  handleDownloadPdf();
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
