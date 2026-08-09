import React, { useMemo, useRef, useState } from 'react';
import { FileText, Sparkles, Upload, CheckCircle2, PencilLine, Eye, FileCheck, Wand2 } from 'lucide-react';
import { ATSAnalysisPanel } from './ATSAnalysisPanel';
import { ResumePreview } from './ResumePreview';
import { exportResumeToPdf } from '../utils/pdfExport';
import { CandidateProfile, TailoredResumeResult, MasterResumeData } from '../types';
import { analyzeJobDescription, matchResumeToJD, buildResumePreviewFromMasterResume, analyzeResumeQuality, improveResumeSection } from '../utils/jdMatching';
import { exportResumeToDocx } from '../utils/resumeExport';

interface ATSResumeBuilderProps {
  profile?: CandidateProfile;
}

const emptyMasterResume: MasterResumeData = {
  personalInfo: {
    fullName: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    phone: '(555) 010-2030',
    location: 'Seattle, WA',
    linkedin: 'linkedin.com/in/alexrivera',
    portfolio: 'github.com/alexrivera',
  },
  professionalSummary: 'Software engineer with experience building accessible web applications, collaborating across teams, and shipping reliable products with modern tooling.',
  keySkills: ['React', 'TypeScript', 'Node.js', 'Express', 'Docker', 'CI/CD', 'Accessibility', 'Testing', 'Communication'],
  workExperience: [
    {
      company: 'Northstar Labs',
      jobTitle: 'Senior Frontend Engineer',
      location: 'Seattle, WA',
      startDate: '2022',
      endDate: 'Present',
      bullets: [
        'Built accessible React interfaces for product features used by internal and external users.',
        'Collaborated with design and backend teams to deliver reliable user workflows.',
        'Improved testing practices and reduced regressions in release cycles.',
        'Worked closely with stakeholders to refine requirements and ship updates on time.',
        'Maintained strong documentation and operational clarity for product changes.',
      ],
    },
  ],
  projects: [
    {
      name: 'Resume Tailoring Platform',
      technologies: 'React, TypeScript, Node.js',
      bullets: [
        'Created a modular web application to structure ATS-friendly resume content.',
        'Focused on clear layouts and export-ready formatting for resume output.',
      ],
    },
  ],
  education: [
    {
      degree: 'B.S. Computer Science',
      institution: 'University of Washington',
      location: 'Seattle, WA',
      year: '2020',
    },
  ],
  certifications: [
    { name: 'AWS Cloud Practitioner', organization: 'Amazon Web Services', year: '2023' },
  ],
};

export const ATSResumeBuilder: React.FC<ATSResumeBuilderProps> = ({ profile }) => {
  const resumePreviewRef = useRef<HTMLDivElement | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [masterResume, setMasterResume] = useState<MasterResumeData>(emptyMasterResume);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [resumeData, setResumeData] = useState<TailoredResumeResult>({
    name: emptyMasterResume.personalInfo.fullName,
    contact: {
      phone: emptyMasterResume.personalInfo.phone,
      email: emptyMasterResume.personalInfo.email,
      linkedin: emptyMasterResume.personalInfo.linkedin,
      github: emptyMasterResume.personalInfo.portfolio,
      location: emptyMasterResume.personalInfo.location,
    },
    summary: emptyMasterResume.professionalSummary,
    skills: {
      languages: ['TypeScript', 'JavaScript', 'Python', 'SQL'],
      frameworks_tools: ['React', 'Node.js', 'Express', 'Vite', 'Docker', 'Git'],
      concepts: ['REST APIs', 'Testing', 'CI/CD', 'Accessibility'],
    },
    work_experience: [
      {
        role: emptyMasterResume.workExperience[0].jobTitle,
        company: emptyMasterResume.workExperience[0].company,
        duration: `${emptyMasterResume.workExperience[0].startDate} – ${emptyMasterResume.workExperience[0].endDate}`,
        bullets: emptyMasterResume.workExperience[0].bullets,
      },
    ],
    projects: [
      {
        title: emptyMasterResume.projects[0].name,
        tech_stack: emptyMasterResume.projects[0].technologies,
        bullets: emptyMasterResume.projects[0].bullets,
      },
    ],
    certifications: emptyMasterResume.certifications.map((item) => item.name),
    education: [
      {
        degree: emptyMasterResume.education[0].degree,
        institution: emptyMasterResume.education[0].institution,
        duration: emptyMasterResume.education[0].year,
      },
    ],
    keywords_extracted: ['React', 'TypeScript', 'Node.js', 'Testing', 'Accessibility'],
    keywords_matched: ['React', 'TypeScript', 'Node.js', 'Accessibility'],
    missing_skills: ['Terraform', 'Azure', 'Kubernetes'],
    grammar_corrections: ['Improved ATS structure and bullet wording.'],
    improvement_tips: ['Add evidence for cloud infrastructure experience if relevant.'],
    match_score: 78,
    selection_probability: 'Estimated alignment',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState('');
  const [matchResult, setMatchResult] = useState<ReturnType<typeof matchResumeToJD> | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof analyzeJobDescription> | null>(null);
  const [qualityAnalysis, setQualityAnalysis] = useState<ReturnType<typeof analyzeResumeQuality> | null>(null);

  const wordCount = useMemo(() => jobDescription.trim().split(/\s+/).filter(Boolean).length, [jobDescription]);

  const handleAnalyze = () => {
    if (!jobDescription.trim()) {
      setNotice('Please paste a job description before analyzing.');
      return;
    }

    const analysis = analyzeJobDescription(jobDescription);
    const match = matchResumeToJD(masterResume, analysis);
    const quality = analyzeResumeQuality(masterResume, analysis, match);

    setAnalysisResult(analysis);
    setMatchResult(match);
    setQualityAnalysis(quality);
    setAnalysisReady(true);
    setResumeData(buildResumePreviewFromMasterResume(masterResume, match) as TailoredResumeResult);
    setNotice('JD analyzed and matched against the structured master resume model.');
  };

  const handleGenerateResume = () => {
    if (!jobDescription.trim()) {
      setNotice('Add a job description to preview the tailored resume.');
      return;
    }

    const analysis = analysisResult || analyzeJobDescription(jobDescription);
    const match = matchResumeToJD(masterResume, analysis);
    const quality = analyzeResumeQuality(masterResume, analysis, match);

    setMatchResult(match);
    setQualityAnalysis(quality);
    setResumeData(buildResumePreviewFromMasterResume(masterResume, match) as TailoredResumeResult);
    setShowPreview(true);
    setNotice('Resume preview updated based on the structured master resume and JD match.');
  };

  const handleExportPdf = async () => {
    const element = resumePreviewRef.current;
    if (!element) {
      setNotice('Resume preview is not ready for export yet.');
      return;
    }
    setIsExporting(true);
    const ok = await exportResumeToPdf(element, 'ats_resume.pdf');
    setIsExporting(false);
    setNotice(ok ? 'PDF export started.' : 'PDF export opened the browser print dialog.');
  };

  const handleExportDocx = async () => {
    setIsExporting(true);
    const ok = await exportResumeToDocx(resumeData, 'ats_resume.docx', masterResume);
    setIsExporting(false);
    setNotice(ok ? 'DOCX download started.' : 'DOCX export could not be created.');
  };

  const handleImproveResume = (section: 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'formatting') => {
    if (!analysisResult) {
      setNotice('Analyze the JD first so the improvement action has a target to work from.');
      return;
    }

    const improvedResume = improveResumeSection(masterResume, analysisResult, section);
    setMasterResume(improvedResume);
    const match = matchResumeToJD(improvedResume, analysisResult);
    const quality = analyzeResumeQuality(improvedResume, analysisResult, match);
    setMatchResult(match);
    setQualityAnalysis(quality);
    setResumeData(buildResumePreviewFromMasterResume(improvedResume, match) as TailoredResumeResult);
    setNotice(`Improved the ${section} section using the current JD context.`);
  };

  const updateField = <K extends keyof TailoredResumeResult>(field: K, value: TailoredResumeResult[K]) => {
    setResumeData((prev) => ({ ...prev, [field]: value }));
  };

  const updateMasterResume = <K extends keyof MasterResumeData>(field: K, value: MasterResumeData[K]) => {
    setMasterResume((prev) => ({ ...prev, [field]: value }));
  };

  const updatePersonalInfo = (field: keyof typeof masterResume.personalInfo, value: string) => {
    setMasterResume((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const updateSkillsInput = (value: string) => {
    setMasterResume((prev) => ({
      ...prev,
      keySkills: value.split(',').map((item) => item.trim()).filter(Boolean),
    }));
  };

  const updateExperience = (field: 'company' | 'jobTitle' | 'location' | 'startDate' | 'endDate', value: string) => {
    setMasterResume((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((entry, index) => index === 0 ? { ...entry, [field]: value } : entry),
    }));
  };

  const updateExperienceBullets = (value: string) => {
    setMasterResume((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((entry, index) => index === 0 ? { ...entry, bullets: value.split('\n').map((item) => item.trim()).filter(Boolean) } : entry),
    }));
  };

  const updateProject = (field: 'name' | 'technologies', value: string) => {
    setMasterResume((prev) => ({
      ...prev,
      projects: prev.projects.map((project, index) => index === 0 ? { ...project, [field]: value } : project),
    }));
  };

  const updateProjectBullets = (value: string) => {
    setMasterResume((prev) => ({
      ...prev,
      projects: prev.projects.map((project, index) => index === 0 ? { ...project, bullets: value.split('\n').map((item) => item.trim()).filter(Boolean) } : project),
    }));
  };

  const updateEducation = (field: 'degree' | 'institution' | 'location' | 'year', value: string) => {
    setMasterResume((prev) => ({
      ...prev,
      education: prev.education.map((entry, index) => index === 0 ? { ...entry, [field]: value } : entry),
    }));
  };

  const updateCertification = (field: 'name' | 'organization' | 'year', value: string) => {
    setMasterResume((prev) => ({
      ...prev,
      certifications: prev.certifications.map((entry, index) => index === 0 ? { ...entry, [field]: value } : entry),
    }));
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Sparkles className="h-4 w-4" />
              <span>ATS Resume Builder — Phase 3</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Structured master resume and JD matching</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Enter a structured master resume, analyze the JD, and review estimated match scores without adding unsupported skills automatically.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            Estimated scoring only • No unsupported keywords added
          </div>
        </div>
      </section>

      {notice && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {notice}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>1. Job Description Input</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              rows={10}
              placeholder="Paste the full job description here..."
              className="mt-4 w-full rounded-2xl border border-slate-300 p-4 text-sm text-slate-800 outline-none transition focus:border-blue-500"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Use a full JD for the best matching preview.</span>
              <span>{wordCount} words</span>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Upload className="h-4 w-4 text-blue-600" />
              <span>2. Structured Master Resume</span>
            </div>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</label>
                  <input value={masterResume.personalInfo.fullName} onChange={(event) => updatePersonalInfo('fullName', event.target.value)} className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
                  <input value={masterResume.personalInfo.email} onChange={(event) => updatePersonalInfo('email', event.target.value)} className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</label>
                  <input value={masterResume.personalInfo.phone} onChange={(event) => updatePersonalInfo('phone', event.target.value)} className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Location</label>
                  <input value={masterResume.personalInfo.location} onChange={(event) => updatePersonalInfo('location', event.target.value)} className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">LinkedIn</label>
                  <input value={masterResume.personalInfo.linkedin} onChange={(event) => updatePersonalInfo('linkedin', event.target.value)} className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Portfolio</label>
                  <input value={masterResume.personalInfo.portfolio} onChange={(event) => updatePersonalInfo('portfolio', event.target.value)} className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Professional Summary</label>
                <textarea value={masterResume.professionalSummary} onChange={(event) => updateMasterResume('professionalSummary', event.target.value)} rows={3} className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Key Skills (comma separated)</label>
                <textarea value={masterResume.keySkills.join(', ')} onChange={(event) => updateSkillsInput(event.target.value)} rows={2} className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Work Experience</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input value={masterResume.workExperience[0].company} onChange={(event) => updateExperience('company', event.target.value)} placeholder="Company" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                  <input value={masterResume.workExperience[0].jobTitle} onChange={(event) => updateExperience('jobTitle', event.target.value)} placeholder="Job Title" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                  <input value={masterResume.workExperience[0].location} onChange={(event) => updateExperience('location', event.target.value)} placeholder="Location" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                  <input value={masterResume.workExperience[0].startDate} onChange={(event) => updateExperience('startDate', event.target.value)} placeholder="Start Date" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                  <input value={masterResume.workExperience[0].endDate} onChange={(event) => updateExperience('endDate', event.target.value)} placeholder="End Date" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                </div>
                <textarea value={masterResume.workExperience[0].bullets.join('\n')} onChange={(event) => updateExperienceBullets(event.target.value)} rows={5} placeholder="One bullet per line" className="mt-3 w-full rounded-2xl border border-slate-300 px-3 py-2" />
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projects</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input value={masterResume.projects[0].name} onChange={(event) => updateProject('name', event.target.value)} placeholder="Project Name" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                  <input value={masterResume.projects[0].technologies} onChange={(event) => updateProject('technologies', event.target.value)} placeholder="Technologies" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                </div>
                <textarea value={masterResume.projects[0].bullets.join('\n')} onChange={(event) => updateProjectBullets(event.target.value)} rows={4} placeholder="One bullet per line" className="mt-3 w-full rounded-2xl border border-slate-300 px-3 py-2" />
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Education</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input value={masterResume.education[0].degree} onChange={(event) => updateEducation('degree', event.target.value)} placeholder="Degree" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                  <input value={masterResume.education[0].institution} onChange={(event) => updateEducation('institution', event.target.value)} placeholder="Institution" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                  <input value={masterResume.education[0].location} onChange={(event) => updateEducation('location', event.target.value)} placeholder="Location" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                  <input value={masterResume.education[0].year} onChange={(event) => updateEducation('year', event.target.value)} placeholder="Year" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Certifications</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input value={masterResume.certifications[0].name} onChange={(event) => updateCertification('name', event.target.value)} placeholder="Certification Name" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                  <input value={masterResume.certifications[0].organization} onChange={(event) => updateCertification('organization', event.target.value)} placeholder="Organization" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                  <input value={masterResume.certifications[0].year} onChange={(event) => updateCertification('year', event.target.value)} placeholder="Year" className="w-full rounded-2xl border border-slate-300 px-3 py-2" />
                </div>
              </div>
            </div>
          </section>

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

          <ATSAnalysisPanel
            analysis={analysisReady && matchResult ? {
              score: matchResult.overall,
              matchedKeywords: matchResult.matchedKeywords,
              partialKeywords: matchResult.partialMatches,
              missingKeywords: matchResult.missingKeywords,
              summary: matchResult.summary,
              categories: matchResult.categories.map((category) => ({ label: category.label, items: category.items })),
            } : null}
            ready={analysisReady}
          />

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
                    <div>Technical Skills Match: {qualityAnalysis.technicalSkillsMatch}%</div>
                    <div>Responsibilities Match: {qualityAnalysis.responsibilitiesMatch}%</div>
                    <div>Qualifications Match: {qualityAnalysis.qualificationsMatch}%</div>
                    <div>Experience Match: {qualityAnalysis.experienceMatch}%</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-sm font-semibold text-emerald-800">STRENGTHS</div>
                  <ul className="mt-2 space-y-2 text-sm text-emerald-700">
                    {qualityAnalysis.strengths.map((item) => <li key={item} className="list-disc pl-5">{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="text-sm font-semibold text-rose-800">WEAKNESSES</div>
                  <ul className="mt-2 space-y-2 text-sm text-rose-700">
                    {qualityAnalysis.weaknesses.map((item) => <li key={item} className="list-disc pl-5">{item}</li>)}
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-900">MISSING KEYWORDS</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {qualityAnalysis.missingKeywords.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">{keyword}</span>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                <div className="text-sm font-semibold text-slate-900">RECOMMENDATIONS</div>
                <ul className="mt-3 space-y-3 text-sm text-slate-700">
                  {qualityAnalysis.recommendations.map((recommendation) => (
                    <li key={`${recommendation.section}-${recommendation.title}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="font-semibold text-slate-900">{recommendation.title}</div>
                      <div className="mt-1">{recommendation.detail}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleImproveResume(recommendation.section)} className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700">
                          Improve Resume
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Quality checks</div>
                <div>{qualityAnalysis.checks.keywordCoverage}</div>
                <div>{qualityAnalysis.checks.technicalSkillCoverage}</div>
                <div>{qualityAnalysis.checks.responsibilityCoverage}</div>
                <div>{qualityAnalysis.checks.qualificationCoverage}</div>
                <div>{qualityAnalysis.checks.jobTitleAlignment}</div>
                <div>{qualityAnalysis.checks.yearsOfExperienceAlignment}</div>
                <div>{qualityAnalysis.checks.sectionCompleteness}</div>
                <div>{qualityAnalysis.checks.bulletQuality}</div>
                <div>{qualityAnalysis.checks.keywordStuffing}</div>
                <div>{qualityAnalysis.checks.formattingProblems}</div>
                {qualityAnalysis.checks.missingImportantTerms.length > 0 && <div>Missing important terms: {qualityAnalysis.checks.missingImportantTerms.join(', ')}</div>}
                {qualityAnalysis.checks.unsupportedSkills.length > 0 && <div>Unsupported skills: {qualityAnalysis.checks.unsupportedSkills.join(', ')}</div>}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <PencilLine className="h-4 w-4 text-blue-600" />
              <span>Resume Editor</span>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
                <input value={resumeData.name || ''} onChange={(event) => updateField('name', event.target.value)} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-800" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Professional Summary</label>
                <textarea value={resumeData.summary || ''} onChange={(event) => updateField('summary', event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-800" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
                  <input value={resumeData.contact?.email || ''} onChange={(event) => updateField('contact', { ...(resumeData.contact || {}), email: event.target.value })} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-800" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Location</label>
                  <input value={resumeData.contact?.location || ''} onChange={(event) => updateField('contact', { ...(resumeData.contact || {}), location: event.target.value })} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-800" />
                </div>
              </div>
            </div>
          </section>

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
            {showPreview && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={handleExportPdf} disabled={isExporting} className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">
                  {isExporting ? 'Preparing Export…' : 'Download PDF'}
                </button>
                <button type="button" onClick={handleExportDocx} className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Download DOCX
                </button>
              </div>
            )}
          </section>

          {matchResult && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Estimated Match Breakdown</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall Match</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{matchResult.overall}%</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Skills</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{matchResult.technicalSkills}%</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Responsibilities</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{matchResult.responsibilities}%</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qualifications</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{matchResult.qualifications}%</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Soft Skills</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{matchResult.softSkills}%</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Experience Match</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">{matchResult.experienceMatch}%</div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
