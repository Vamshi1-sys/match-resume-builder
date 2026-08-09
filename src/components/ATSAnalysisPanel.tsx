import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Target } from 'lucide-react';

interface AnalysisData {
  score: number;
  matchedKeywords: string[];
  partialKeywords?: string[];
  missingKeywords: string[];
  summary: string;
  categories: Array<{ label: string; items: string[] }>;
}

interface ATSAnalysisPanelProps {
  analysis: AnalysisData | null;
  ready: boolean;
}

export const ATSAnalysisPanel: React.FC<ATSAnalysisPanelProps> = ({ analysis, ready }) => {
  if (!ready || !analysis) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span>JD Analysis</span>
        </div>
        <p className="mt-2">Click “Analyze JD” to review the structured match summary for the current job description.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Target className="h-4 w-4 text-blue-600" />
            <span>JD Analysis</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">The analysis below is generated from the current structured master resume model and the supplied job description.</p>
        </div>
        <div className="rounded-2xl bg-blue-50 px-3 py-2 text-right text-sm font-semibold text-blue-700">
          Estimated Match: {analysis.score}%
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        {analysis.summary}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Matched Keywords
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.matchedKeywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertCircle className="h-4 w-4" />
            Partial Matches
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.partialKeywords && analysis.partialKeywords.length > 0 ? analysis.partialKeywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700">
                {keyword}
              </span>
            )) : <span className="text-xs text-amber-700">No partial keyword matches.</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
            <AlertCircle className="h-4 w-4" />
            Missing / Review
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.missingKeywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-rose-700">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {analysis.categories.map((section) => (
          <div key={section.label} className="rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">{section.label}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {section.items.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
