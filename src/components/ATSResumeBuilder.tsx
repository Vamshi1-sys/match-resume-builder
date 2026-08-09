import React, { useMemo, useRef, useState, useEffect } from 'react';
import { FileText, Sparkles, Upload, CheckCircle2, PencilLine, Eye, Wand2, Lock, Unlock, X } from 'lucide-react';
import { ATSAnalysisPanel } from './ATSAnalysisPanel';
import { ResumePreview } from './ResumePreview';
import { exportResumeToPdf } from '../utils/pdfExport';
import { CandidateProfile, TailoredResumeResult, MasterResumeData } from '../types';
import { analyzeJobDescription, matchResumeToJD, buildResumePreviewFromMasterResume, analyzeResumeQuality, improveResumeSection } from '../utils/jdMatching';
import { exportResumeToDocx } from '../utils/resumeExport';
import { extractTextFromFile } from '../utils/fileExtractor';

interface ATSResumeBuilderProps {
  profile?: CandidateProfile;
  tailoredResult?: TailoredResumeResult | null;
}

// Empty master resume — no sample/placeholder data
const createEmptyMasterResume = (): MasterResumeData => ({
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '' },
  professionalSummary: '',
  keySkills: [],
  workExperience: [{ company: '', jobTitle: '', location: '', startDate: '', endDate: '', bullets: [] }],
  projects: [{ name: '', technologies: '', bullets: [] }],
  education: [{ degree: '', institution: '', location: '', year: '' }],
  certifications: [{ name: '', organization: '', year: '' }],
});

// Convert TailoredResumeResult (server response) → MasterResumeData
function tailoredToMaster(result: TailoredResumeResult): MasterResumeData {
  const flatSkills = [
    ...(result.skills?.languages || []),
    ...(result.skills?.frameworks_tools || []),
    ...(result.skills?.concepts || []),
    ...(result.reordered_skills || []),
  ];
  const uniqueSkills = Array.from(new Set(flatSkills)).filter(Boolean);

  const workExperience = (result.work_experience || result.tailored_experience || []).map((e: any) => {
    const durationParts = (e.duration || '').split(/\s*[–\-]\s*/);
    return {
      company: e.company || '',
      jobTitle: e.role || '',
      location: '',
      startDate: durationParts[0]?.trim() || '',
      endDate: durationParts[1]?.trim() || '',
      bullets: Array.isArray(e.bullets) ? e.bullets : [],
    };
  });

  const projects = (result.projects || result.tailored_projects || []).map((p: any) => ({
    name: p.title || p.name || '',
    technologies: p.tech_stack || p.techUsed || '',
    bullets: Array.isArray(p.bullets) ? p.bullets : [],
  }));

  const education = (result.education || []).map((e: any) => ({
    degree: e.degree || '',
    institution: e.institution || '',
    location: '',
    year: e.duration || e.year || '',
    score: e.score || '',
    cgpa: e.cgpa || '',
  }));

  const certifications = (result.certifications || []).map((c: any) =>
    typeof c === 'string'
      ? { name: c, organization: '', year: '' }
      : { name: c.name || '', organization: c.organization || '', year: c.year || '' }
  );

  return {
    personalInfo: {
      fullName: result.name || result.candidate_info?.fullName || '',
      email: result.contact?.email || result.candidate_info?.email || '',
      phone: result.contact?.phone || result.candidate_info?.phone || '',
      location: result.contact?.location || result.candidate_info?.location || '',
      linkedin: result.contact?.linkedin || result.candidate_info?.linkedin || '',
      portfolio: result.contact?.github || result.candidate_info?.portfolio || '',
    },
    professionalSummary: result.summary || result.tailored_summary || '',
    keySkills: uniqueSkills,
    workExperience: workExperience.length > 0 ? workExperience : createEmptyMasterResume().workExperience,
    projects: projects.length > 0 ? projects : createEmptyMasterResume().projects,
    education: education.length > 0 ? education : createEmptyMasterResume().education,
    certifications: certifications.length > 0 ? certifications : createEmptyMasterResume().certifications,
  };
}

export const ATSResumeBuilder: React.FC<ATSResumeBuilderProps> = ({ profile, tailoredResult }) => {
  const resumePreviewRef = useRef<HTMLDivElement | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [masterResume, setMasterResume] = useState<MasterResumeData>(createEmptyMasterResume);
  const [resumeData, setResumeData] = useState<TailoredResumeResult>({
    name: '', contact: {}, summary: '', skills: {}, work_experience: [], projects: [],
    certifications: [], education: [], keywords_extracted: [], keywords_matched: [],
    missing_skills: [], grammar_corrections: [], improvement_tips: [], match_score: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [hasData, setHasData] = useState(false);
  const [matchResult, setMatchResult] = useState<ReturnType<typeof matchResumeToJD> | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof analyzeJobDescription> | null>(null);
  const [qualityAnalysis, setQualityAnalysis] = useState<ReturnType<typeof analyzeResumeQuality> | null>(null);

  // ── Auto-populate from the AI-tailored result passed by App.tsx ──────────
  useEffect(() => {
    if (tailoredResult && tailoredResult.name) {
      const master = tailoredToMaster(tailoredResult);
      setMasterResume(master);
      setResumeData(tailoredResult);
      setHasData(true);
      setIsEditing(false);
      setNotice('Resume loaded from your generated result. Click ✏️ Edit to make changes.');
    }
  }, [tailoredResult]);

  const wordCount = useMemo(() => jobDescription.trim().split(/\s+/).filter(Boolean).length, [jobDescription]);

  // ── Upload resume file to populate master resume ─────────────────────────
  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setNotice('Extracting resume text…');
    try {
      const extracted = await extractTextFromFile(file);
      if (extracted.success && extracted.text) {
        setNotice(`✅ Extracted ${extracted.wordCount} words from "${file.name}". Paste a JD and click Analyze JD to match.`);
        setHasData(true);
      } else {
        setNotice(extracted.errorMessage || 'Could not read the file. Try pasting text instead.');
      }
    } catch {
      setNotice('Error reading file.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAnalyze = () => {
    if (!jobDescription.trim()) { setNotice('Paste a job description before analyzing.'); return; }
    const analysis = analyzeJobDescription(jobDescription);
    const match = matchResumeToJD(masterResume, analysis);
    const quality = analyzeResumeQuality(masterResume, analysis, match);
    setAnalysisResult(analysis);
    setMatchResult(match);
    setQualityAnalysis(quality);
    setAnalysisReady(true);
    setResumeData(buildResumePreviewFromMasterResume(masterResume, match) as TailoredResumeResult);
    setNotice('JD analyzed and matched against your resume.');
  };

  const handleGenerateResume = () => {
    if (!jobDescription.trim()) { setNotice('Add a job description first.'); return; }
    const analysis = analysisResult || analyzeJobDescription(jobDescription);
    const match = matchResumeToJD(masterResume, analysis);
    const quality = analyzeResumeQuality(masterResume, analysis, match);
    setMatchResult(match);
    setQualityAnalysis(quality);
    setResumeData(buildResumePreviewFromMasterResume(masterResume, match) as TailoredResumeResult);
    setNotice('Resume preview updated based on your resume and JD match.');
  };

  const handleExportPdf = async () => {
    const element = resumePreviewRef.current;
    if (!element) { setNotice('Resume preview is not ready.'); return; }
    setIsExporting(true);
    const ok = await exportResumeToPdf(element, 'ats_resume.pdf');
    setIsExporting(false);
    setNotice(ok ? 'PDF export started.' : 'PDF export opened browser print dialog.');
  };

  const handleExportDocx = async () => {
    setIsExporting(true);
    const ok = await exportResumeToDocx(resumeData, 'ats_resume.docx', masterResume);
    setIsExporting(false);
    setNotice(ok ? 'DOCX download started.' : 'DOCX export failed.');
  };

  const handleImproveResume = (section: 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'formatting') => {
    if (!analysisResult) { setNotice('Analyze the JD first.'); return; }
    const improved = improveResumeSection(masterResume, analysisResult, section);
    setMasterResume(improved);
    const match = matchResumeToJD(improved, analysisResult);
    const quality = analyzeResumeQuality(improved, analysisResult, match);
    setMatchResult(match);
    setQualityAnalysis(quality);
    setResumeData(buildResumePreviewFromMasterResume(improved, match) as TailoredResumeResult);
    setNotice(`Improved the ${section} section.`);
  };

  // ── Edit helpers (only fire when isEditing = true) ───────────────────────
  const updatePersonalInfo = (field: keyof MasterResumeData['personalInfo'], value: string) => {
    if (!isEditing) return;
    setMasterResume(p => ({ ...p, personalInfo: { ...p.personalInfo, [field]: value } }));
  };
  const updateMasterField = <K extends keyof MasterResumeData>(field: K, value: MasterResumeData[K]) => {
    if (!isEditing) return;
    setMasterResume(p => ({ ...p, [field]: value }));
  };
  const updateSkillsInput = (value: string) => {
    if (!isEditing) return;
    setMasterResume(p => ({ ...p, keySkills: value.split(',').map(s => s.trim()).filter(Boolean) }));
  };
  const updateExperience = (field: 'company' | 'jobTitle' | 'location' | 'startDate' | 'endDate', value: string) => {
    if (!isEditing) return;
    setMasterResume(p => ({ ...p, workExperience: p.workExperience.map((e, i) => i === 0 ? { ...e, [field]: value } : e) }));
  };
  const updateExperienceBullets = (value: string) => {
    if (!isEditing) return;
    setMasterResume(p => ({ ...p, workExperience: p.workExperience.map((e, i) => i === 0 ? { ...e, bullets: value.split('\n').map(s => s.trim()).filter(Boolean) } : e) }));
  };
  const updateProject = (field: 'name' | 'technologies', value: string) => {
    if (!isEditing) return;
    setMasterResume(p => ({ ...p, projects: p.projects.map((pr, i) => i === 0 ? { ...pr, [field]: value } : pr) }));
  };
  const updateProjectBullets = (value: string) => {
    if (!isEditing) return;
    setMasterResume(p => ({ ...p, projects: p.projects.map((pr, i) => i === 0 ? { ...pr, bullets: value.split('\n').map(s => s.trim()).filter(Boolean) } : pr) }));
  };
  const updateEducation = (field: 'degree' | 'institution' | 'location' | 'year', value: string) => {
    if (!isEditing) return;
    setMasterResume(p => ({ ...p, education: p.education.map((e, i) => i === 0 ? { ...e, [field]: value } : e) }));
  };
  const updateCertification = (field: 'name' | 'organization' | 'year', value: string) => {
    if (!isEditing) return;
    setMasterResume(p => ({ ...p, certifications: p.certifications.map((c, i) => i === 0 ? { ...c, [field]: value } : c) }));
  };

  const inputCls = `w-full rounded-2xl border px-3 py-2 text-sm transition ${
    isEditing
      ? 'border-blue-400 bg-white text-slate-800 outline-none focus:ring-2 focus:ring-blue-300'
      : 'border-slate-200 bg-slate-50 text-slate-700 cursor-default select-none'
  }`;
  const textareaCls = `w-full rounded-2xl border px-3 py-2 text-sm transition ${
    isEditing
      ? 'border-blue-400 bg-white text-slate-800 outline-none focus:ring-2 focus:ring-blue-300'
      : 'border-slate-200 bg-slate-50 text-slate-700 cursor-default select-none'
  }`;

  return (
    <div className="space-y-8 pb-10">

      {/* ── Header ── */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Sparkles className="h-4 w-4" />
              <span>ATS Resume Builder</span>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">JD-Matched Resume Editor</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Your generated resume is loaded here automatically. Paste a job description and click <strong>Analyze JD</strong> to see match scores, then <strong>Generate Resume</strong> for the tailored preview.
            </p>
          </div>
          {!hasData && (
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
              <Upload className="h-4 w-4" />
              {isUploading ? 'Uploading…' : 'Upload Resume'}
              <input type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleResumeFileUpload} />
            </label>
          )}
        </div>
      </section>

      {/* ── Notice ── */}
      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="mt-0.5 shrink-0 text-blue-400 hover:text-blue-700"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ── Empty State ── */}
      {!hasData && (
        <section className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-600">No resume loaded yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Use the <strong>Resume Generator</strong> form above to generate a tailored resume — it will appear here automatically. Or upload your resume file using the button above.
          </p>
        </section>
      )}

      {/* ── Main grid — only show when data is present ── */}
      {hasData && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

          {/* LEFT COLUMN */}
          <div className="space-y-6">

            {/* JD Input */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>1. Job Description</span>
              </div>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                rows={10}
                placeholder="Paste the full job description here..."
                className="mt-4 w-full rounded-2xl border border-slate-300 p-4 text-sm text-slate-800 outline-none transition focus:border-blue-500"
              />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Use a full JD for best matching.</span>
                <span>{wordCount} words</span>
              </div>
            </section>

            {/* Master Resume — with Edit toggle */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <PencilLine className="h-4 w-4 text-blue-600" />
                  <span>2. Your Resume Data</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(e => !e)}
                  className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-semibold transition ${
                    isEditing
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {isEditing ? <><Unlock className="h-3.5 w-3.5" /> Editing — Click to Lock</> : <><Lock className="h-3.5 w-3.5" /> Locked — Click to Edit</>}
                </button>
              </div>

              {!isEditing && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  🔒 Fields are read-only. Click <strong>Locked — Click to Edit</strong> to make changes.
                </div>
              )}

              <div className="mt-4 space-y-4 text-sm text-slate-700">
                {/* Personal Info */}
                <div className="grid gap-3 md:grid-cols-2">
                  {(['fullName', 'email', 'phone', 'location', 'linkedin', 'portfolio'] as const).map(field => (
                    <div key={field}>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {field === 'fullName' ? 'Full Name' : field === 'portfolio' ? 'GitHub / Portfolio' : field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <input
                        value={masterResume.personalInfo[field]}
                        onChange={e => updatePersonalInfo(field, e.target.value)}
                        readOnly={!isEditing}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Professional Summary</label>
                  <textarea
                    value={masterResume.professionalSummary}
                    onChange={e => updateMasterField('professionalSummary', e.target.value)}
                    readOnly={!isEditing}
                    rows={3}
                    className={textareaCls}
                  />
                </div>

                {/* Skills */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Key Skills (comma separated)</label>
                  <textarea
                    value={masterResume.keySkills.join(', ')}
                    onChange={e => updateSkillsInput(e.target.value)}
                    readOnly={!isEditing}
                    rows={2}
                    className={textareaCls}
                  />
                </div>

                {/* Work Experience */}
                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Work Experience</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {(['company', 'jobTitle', 'location', 'startDate', 'endDate'] as const).map(f => (
                      <input key={f} value={masterResume.workExperience[0]?.[f] || ''} onChange={e => updateExperience(f, e.target.value)} placeholder={f} readOnly={!isEditing} className={inputCls} />
                    ))}
                  </div>
                  <textarea
                    value={masterResume.workExperience[0]?.bullets.join('\n') || ''}
                    onChange={e => updateExperienceBullets(e.target.value)}
                    readOnly={!isEditing}
                    rows={5}
                    placeholder="One bullet point per line"
                    className={`mt-3 ${textareaCls}`}
                  />
                </div>

                {/* Projects */}
                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projects</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input value={masterResume.projects[0]?.name || ''} onChange={e => updateProject('name', e.target.value)} placeholder="Project Name" readOnly={!isEditing} className={inputCls} />
                    <input value={masterResume.projects[0]?.technologies || ''} onChange={e => updateProject('technologies', e.target.value)} placeholder="Technologies" readOnly={!isEditing} className={inputCls} />
                  </div>
                  <textarea
                    value={masterResume.projects[0]?.bullets.join('\n') || ''}
                    onChange={e => updateProjectBullets(e.target.value)}
                    readOnly={!isEditing}
                    rows={4}
                    placeholder="One bullet point per line"
                    className={`mt-3 ${textareaCls}`}
                  />
                </div>

                {/* Education */}
                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Education</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {(['degree', 'institution', 'location', 'year'] as const).map(f => (
                      <input key={f} value={masterResume.education[0]?.[f] || ''} onChange={e => updateEducation(f, e.target.value)} placeholder={f} readOnly={!isEditing} className={inputCls} />
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Certifications</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {(['name', 'organization', 'year'] as const).map(f => (
                      <input key={f} value={masterResume.certifications[0]?.[f] || ''} onChange={e => updateCertification(f, e.target.value)} placeholder={f} readOnly={!isEditing} className={inputCls} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleAnalyze} className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                  Analyze JD
                </button>
                <button type="button" onClick={handleGenerateResume} className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                  Generate Resume
                </button>
              </div>
            </section>

            {/* ATS Analysis */}
            <ATSAnalysisPanel
              analysis={analysisReady && matchResult ? {
                score: matchResult.overall,
                matchedKeywords: matchResult.matchedKeywords,
                partialKeywords: matchResult.partialMatches,
                missingKeywords: matchResult.missingKeywords,
                summary: matchResult.summary,
                categories: matchResult.categories.map(c => ({ label: c.label, items: c.items })),
              } : null}
              ready={analysisReady}
            />

            {/* Quality Analysis */}
            {qualityAnalysis && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Wand2 className="h-4 w-4 text-blue-600" />
                  <span>ATS Resume Quality Analyzer</span>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-slate-50">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">ATS MATCH SCORE</div>
                      <div className="text-4xl font-semibold text-white">{qualityAnalysis.atsScore}%</div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <div>Keyword Match: {qualityAnalysis.keywordMatch}%</div>
                      <div>Technical Skills: {qualityAnalysis.technicalSkillsMatch}%</div>
                      <div>Responsibilities: {qualityAnalysis.responsibilitiesMatch}%</div>
                      <div>Qualifications: {qualityAnalysis.qualificationsMatch}%</div>
                      <div>Experience: {qualityAnalysis.experienceMatch}%</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-sm font-semibold text-emerald-800">STRENGTHS</div>
                    <ul className="mt-2 space-y-2 text-sm text-emerald-700">
                      {qualityAnalysis.strengths.map(item => <li key={item} className="list-disc pl-5">{item}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <div className="text-sm font-semibold text-rose-800">WEAKNESSES</div>
                    <ul className="mt-2 space-y-2 text-sm text-rose-700">
                      {qualityAnalysis.weaknesses.map(item => <li key={item} className="list-disc pl-5">{item}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold text-slate-900">RECOMMENDATIONS</div>
                  <ul className="mt-3 space-y-3 text-sm text-slate-700">
                    {qualityAnalysis.recommendations.map(rec => (
                      <li key={`${rec.section}-${rec.title}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="font-semibold text-slate-900">{rec.title}</div>
                        <div className="mt-1">{rec.detail}</div>
                        <div className="mt-2">
                          <button type="button" onClick={() => handleImproveResume(rec.section)} className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700">
                            Improve Resume
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN — Preview */}
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Eye className="h-4 w-4 text-blue-600" />
                <span>Resume Preview</span>
              </div>
              <div className="mt-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-2">
                  <ResumePreview
                    containerRef={resumePreviewRef}
                    masterResume={masterResume}
                    profile={profile || { personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', portfolio: '' }, education: [], workExperience: [], projects: [], skills: [], certifications: [] }}
                    result={resumeData}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={handleExportPdf} disabled={isExporting} className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">
                  {isExporting ? 'Preparing…' : 'Download PDF'}
                </button>
                <button type="button" onClick={handleExportDocx} disabled={isExporting} className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
                  Download DOCX
                </button>
              </div>
            </section>

            {matchResult && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Match Breakdown</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ['Overall Match', matchResult.overall],
                    ['Technical Skills', matchResult.technicalSkills],
                    ['Responsibilities', matchResult.responsibilities],
                    ['Qualifications', matchResult.qualifications],
                    ['Soft Skills', matchResult.softSkills],
                    ['Experience Match', matchResult.experienceMatch],
                  ].map(([label, val]) => (
                    <div key={label as string} className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                      <div className="mt-1 text-2xl font-bold text-slate-900">{val}%</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
