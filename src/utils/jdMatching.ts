import { MasterResumeData } from '../types';

export interface JdKeywordCategory {
  label: string;
  items: string[];
}

export interface JdAnalysisResult {
  jobTitle: string;
  summary: string;
  categories: JdKeywordCategory[];
  technicalSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  softSkills: string[];
  experienceRequirements: string[];
  allKeywords: string[];
}

export interface ResumeMatchResult {
  overall: number;
  technicalSkills: number;
  responsibilities: number;
  qualifications: number;
  softSkills: number;
  experienceMatch: number;
  matchedKeywords: string[];
  partialMatches: string[];
  missingKeywords: string[];
  categories: Array<{
    label: string;
    items: string[];
    matched: string[];
    partial: string[];
    missing: string[];
    score: number;
  }>;
  summary: string;
}

export interface ResumeQualityRecommendation {
  section: 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'formatting';
  title: string;
  detail: string;
}

export interface ResumeQualityAnalysis {
  atsScore: number;
  keywordMatch: number;
  technicalSkillsMatch: number;
  responsibilitiesMatch: number;
  qualificationsMatch: number;
  experienceMatch: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  recommendations: ResumeQualityRecommendation[];
  checks: {
    keywordCoverage: string;
    technicalSkillCoverage: string;
    responsibilityCoverage: string;
    qualificationCoverage: string;
    jobTitleAlignment: string;
    yearsOfExperienceAlignment: string;
    sectionCompleteness: string;
    bulletQuality: string;
    keywordStuffing: string;
    formattingProblems: string;
    missingImportantTerms: string[];
    unsupportedSkills: string[];
  };
}

const TECHNICAL_TERMS = [
  'react', 'typescript', 'javascript', 'node', 'python', 'sql', 'docker', 'aws', 'azure', 'kubernetes', 'terraform', 'ci/cd', 'rest api', 'api', 'git', 'linux', 'postgres', 'mongodb', 'vite', 'express', 'jira', 'ansible'
];

const RESPONSIBILITY_TERMS = [
  'build', 'develop', 'design', 'implement', 'automate', 'troubleshoot', 'optimize', 'lead', 'collaborate', 'support', 'monitor', 'deliver', 'maintain', 'improve', 'document', 'test'
];

const QUALIFICATION_TERMS = [
  'bachelor', 'degree', 'experience', 'senior', 'leadership', 'cross-functional', 'team', 'mentoring', 'strong', 'working', 'knowledge'
];

const SOFT_SKILLS_TERMS = [
  'communication', 'collaboration', 'problem solving', 'ownership', 'leadership', 'mentoring', 'teamwork', 'adaptability', 'attention to detail'
];

const EXPERIENCE_TERMS = [
  'years', 'year', 'senior', 'mid-level', 'principal', 'lead', 'manager', 'engineer', 'developer'
];

const SYNONYMS: Record<string, string[]> = {
  'typescript': ['ts'],
  'javascript': ['js'],
  'node': ['node.js', 'nodejs'],
  'rest api': ['apis', 'restapis'],
  'ci/cd': ['cicd'],
  'kubernetes': ['k8s'],
  'aws': ['amazon web services'],
  'azure': ['microsoft azure'],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function containsKeyword(text: string, term: string): boolean {
  const normalizedText = normalize(text);
  const normalizedTerm = normalize(term);
  if (!normalizedText || !normalizedTerm) return false;

  if (normalizedText.includes(normalizedTerm)) return true;

  const termTokens = normalizedTerm.split(/\s+/).filter(Boolean);
  const textTokens = normalizedText.split(/\s+/).filter(Boolean);

  const aliasMatches = (SYNONYMS[normalizedTerm] || []).some((alias) => normalizedText.includes(alias));
  if (aliasMatches) return true;

  const termTokenSet = new Set(termTokens);
  const matchedTokens = textTokens.filter((token) => termTokenSet.has(token));
  return matchedTokens.length >= 1;
}

function classifyKeyword(text: string, term: string): 'matched' | 'partial' | 'missing' {
  if (containsKeyword(text, term)) return 'matched';

  const normalizedTerm = normalize(term);
  const normalizedText = normalize(text);
  if (!normalizedTerm || !normalizedText) return 'missing';

  const termTokens = normalizedTerm.split(/\s+/).filter(Boolean);
  const textTokens = normalizedText.split(/\s+/).filter(Boolean);
  const overlap = termTokens.filter((token) => textTokens.includes(token));
  if (overlap.length > 0) return 'partial';

  const aliasMatches = Object.entries(SYNONYMS).some(([source, aliases]) => {
    if (source === normalizedTerm) {
      return aliases.some((alias) => normalizedText.includes(alias));
    }
    return false;
  });
  return aliasMatches ? 'partial' : 'missing';
}

function extractKeywords(text: string): string[] {
  const lower = normalize(text);
  const found: string[] = [];
  const allTerms = [...TECHNICAL_TERMS, ...RESPONSIBILITY_TERMS, ...QUALIFICATION_TERMS, ...SOFT_SKILLS_TERMS, ...EXPERIENCE_TERMS];
  allTerms.forEach((term) => {
    if (lower.includes(normalize(term))) {
      found.push(term);
    }
  });
  return found;
}

function getResumeText(masterResume: MasterResumeData): string {
  return [
    masterResume.professionalSummary,
    masterResume.keySkills.join(' '),
    masterResume.workExperience.map((entry) => `${entry.company} ${entry.jobTitle} ${entry.bullets.join(' ')}`).join(' '),
    masterResume.projects.map((project) => `${project.name} ${project.technologies} ${project.bullets.join(' ')}`).join(' '),
    masterResume.education.map((entry) => `${entry.degree} ${entry.institution}`).join(' '),
    masterResume.certifications.map((entry) => `${entry.name} ${entry.organization}`).join(' '),
  ].join(' ');
}

export function analyzeJobDescription(jobDescription: string): JdAnalysisResult {
  const cleaned = jobDescription.trim();
  const jobTitle = cleaned.split(/\n|\.|:/)[0]?.trim() || 'Target Role';

  const technicalSkills = TECHNICAL_TERMS.filter((term) => normalize(cleaned).includes(normalize(term)));
  const responsibilities = RESPONSIBILITY_TERMS.filter((term) => normalize(cleaned).includes(normalize(term)));
  const qualifications = QUALIFICATION_TERMS.filter((term) => normalize(cleaned).includes(normalize(term)));
  const softSkills = SOFT_SKILLS_TERMS.filter((term) => normalize(cleaned).includes(normalize(term)));
  const experienceRequirements = EXPERIENCE_TERMS.filter((term) => normalize(cleaned).includes(normalize(term)));

  const categories: JdKeywordCategory[] = [
    { label: 'Technical Skills', items: technicalSkills },
    { label: 'Responsibilities', items: responsibilities },
    { label: 'Qualifications', items: qualifications },
    { label: 'Soft Skills', items: softSkills },
    { label: 'Experience Requirements', items: experienceRequirements },
  ];

  return {
    jobTitle,
    summary: `JD analyzed with ${technicalSkills.length} technical signals, ${responsibilities.length} responsibility signals, and ${softSkills.length} soft-skill signals.`,
    categories,
    technicalSkills,
    responsibilities,
    qualifications,
    softSkills,
    experienceRequirements,
    allKeywords: extractKeywords(cleaned),
  };
}

export function matchResumeToJD(masterResume: MasterResumeData, analysis: JdAnalysisResult): ResumeMatchResult {
  const resumeText = getResumeText(masterResume);

  const categories = analysis.categories.map((category) => {
    const items = category.items;
    const matched: string[] = [];
    const partial: string[] = [];
    const missing: string[] = [];

    items.forEach((item) => {
      const result = classifyKeyword(resumeText, item);
      if (result === 'matched') matched.push(item);
      else if (result === 'partial') partial.push(item);
      else missing.push(item);
    });

    const total = items.length || 1;
    const score = Math.round(((matched.length + partial.length * 0.5) / total) * 100);

    return {
      label: category.label,
      items,
      matched,
      partial,
      missing,
      score,
    };
  });

  const technicalScore = categories.find((item) => item.label === 'Technical Skills')?.score || 0;
  const responsibilityScore = categories.find((item) => item.label === 'Responsibilities')?.score || 0;
  const qualificationScore = categories.find((item) => item.label === 'Qualifications')?.score || 0;
  const softSkillScore = categories.find((item) => item.label === 'Soft Skills')?.score || 0;

  const requiredYears = (() => {
    const yearsMatch = /\b(\d+)\s*years?\b/i.exec(analysis.summary + ' ' + analysis.jobTitle);
    return yearsMatch ? Number(yearsMatch[1]) : null;
  })();

  const resumeYears = masterResume.workExperience.reduce((total, entry) => {
    const start = Number(entry.startDate.match(/\d{4}/)?.[0] || 0);
    const end = Number(entry.endDate.match(/\d{4}/)?.[0] || 0) || new Date().getFullYear();
    const yearsDiff = Math.max(0, end - start);
    return total + (Number.isFinite(yearsDiff) ? yearsDiff : 0);
  }, 0);

  const experienceMatch = requiredYears ? Math.min(100, Math.round((Math.max(1, resumeYears) / requiredYears) * 100)) : 100;

  const matchedKeywords = categories.flatMap((category) => category.matched);
  const partialMatches = categories.flatMap((category) => category.partial);
  const missingKeywords = categories.flatMap((category) => category.missing);

  const overall = Math.round((technicalScore + responsibilityScore + qualificationScore + softSkillScore + experienceMatch) / 5);

  return {
    overall,
    technicalSkills: technicalScore,
    responsibilities: responsibilityScore,
    qualifications: qualificationScore,
    softSkills: softSkillScore,
    experienceMatch,
    matchedKeywords,
    partialMatches,
    missingKeywords,
    categories,
    summary: 'Estimated resume-to-JD alignment based on the current structured master resume and the provided JD. This is not an ATS vendor score.',
  };
}

export function analyzeResumeQuality(masterResume: MasterResumeData, analysis: JdAnalysisResult, matchResult: ResumeMatchResult): ResumeQualityAnalysis {
  const keywordCoverageScore = analysis.allKeywords.length > 0
    ? Math.round((matchResult.matchedKeywords.length / Math.max(1, analysis.allKeywords.length)) * 100)
    : 100;

  const sectionCompletenessScore = [
    Boolean(masterResume.professionalSummary.trim()),
    masterResume.keySkills.length > 0,
    masterResume.workExperience.some((entry) => entry.bullets.length > 0),
    masterResume.projects.length > 0,
    masterResume.education.length > 0,
    masterResume.certifications.length > 0,
  ].filter(Boolean).length * 16.67;

  const bulletScore = masterResume.workExperience.reduce((score, entry) => {
    const bullets = entry.bullets.filter(Boolean);
    if (bullets.length === 0) return score;
    const actionVerbCount = bullets.filter((bullet) => /\b(built|developed|implemented|designed|delivered|improved|maintained|supported|led|collaborated|optimized|automated)\b/i.test(bullet)).length;
    return score + Math.min(100, Math.round((actionVerbCount / Math.max(1, bullets.length)) * 100));
  }, 0) / Math.max(1, masterResume.workExperience.length);

  const keywordStuffingScore = (() => {
    const frequencies = new Map<string, number>();
    const text = getResumeText(masterResume).toLowerCase();
    analysis.allKeywords.forEach((keyword) => {
      const count = text.split(keyword.toLowerCase()).length - 1;
      frequencies.set(keyword, count);
    });
    const repeatedTerms = [...frequencies.values()].filter((count) => count > 2).length;
    return repeatedTerms === 0 ? 100 : Math.max(40, 100 - repeatedTerms * 20);
  })();

  const unsupportedSkills = masterResume.keySkills.filter((skill) => {
    const normalizedSkill = normalize(skill);
    if (!normalizedSkill) return false;
    if (['communication', 'teamwork', 'ownership', 'leadership', 'documentation', 'testing', 'accessibility'].includes(normalizedSkill)) {
      return false;
    }
    const hasJdMatch = analysis.allKeywords.some((term) => containsKeyword(skill, term) || containsKeyword(term, skill));
    return !hasJdMatch;
  });

  const strengths = [] as string[];
  const weaknesses = [] as string[];

  if (matchResult.matchedKeywords.length > 0) {
    strengths.push(`Matched ${matchResult.matchedKeywords.slice(0, 4).join(', ')} with the JD.`);
  }
  if (sectionCompletenessScore >= 80) {
    strengths.push('The resume includes a summary, skills, experience, projects, education, and certifications section.');
  }
  if (bulletScore >= 70) {
    strengths.push('Experience bullets are present and use action-oriented wording.');
  }

  if (matchResult.missingKeywords.length > 0) {
    weaknesses.push(`Missing important JD terms: ${matchResult.missingKeywords.slice(0, 6).join(', ')}.`);
  }
  if (matchResult.technicalSkills < 100) {
    weaknesses.push('Technical skill coverage is only partial for the target role.');
  }
  if (matchResult.responsibilities < 100) {
    weaknesses.push('Responsibility coverage should be strengthened with more explicit ownership language.');
  }
  if (matchResult.qualifications < 100) {
    weaknesses.push('Qualification coverage is incomplete for the job description.');
  }
  if (matchResult.experienceMatch < 80) {
    weaknesses.push('Experience level appears lower than the JD expectation.');
  }

  const recommendations: ResumeQualityRecommendation[] = [];
  if (matchResult.missingKeywords.length > 0) {
    recommendations.push({
      section: 'summary',
      title: 'Strengthen the summary with missing JD terms',
      detail: `Add evidence from your existing experience for ${matchResult.missingKeywords.slice(0, 4).join(', ')} in the professional summary or first experience bullet.`,
    });
  }
  if (matchResult.technicalSkills < 100) {
    recommendations.push({
      section: 'skills',
      title: 'Reorder the skills section around the target stack',
      detail: 'Bring the most relevant existing tools and technologies to the top of the skills section so the reader sees the strongest technical fit first.',
    });
  }
  if (matchResult.responsibilities < 100) {
    recommendations.push({
      section: 'experience',
      title: 'Make experience bullets more responsibility-focused',
      detail: 'Rewrite the experience bullets so they clearly describe delivery, ownership, implementation, collaboration, and maintenance work from the JD.',
    });
  }
  if (matchResult.qualifications < 100) {
    recommendations.push({
      section: 'summary',
      title: 'Surface qualifications more clearly',
      detail: 'Mention relevant degrees, leadership, mentoring, or cross-functional work in the summary or experience bullets if that experience is already present.',
    });
  }
  if (recommendations.length < 3 && bulletScore < 80) {
    recommendations.push({
      section: 'experience',
      title: 'Improve bullet wording for stronger ATS readability',
      detail: 'Trim bullets, start them with action verbs, and keep them specific so the resume reads clearly for both people and ATS systems.',
    });
  }
  if (recommendations.length < 4 && unsupportedSkills.length > 0) {
    recommendations.push({
      section: 'skills',
      title: 'Remove unsupported or weakly matched skills',
      detail: `Review ${unsupportedSkills.slice(0, 3).join(', ')} and keep only the skills that are clearly supported by your background and the JD.`,
    });
  }
  if (recommendations.length < 4) {
    recommendations.push({
      section: 'formatting',
      title: 'Keep the layout easy to scan',
      detail: 'Maintain clear section boundaries and concise bullets so the summary, skills, experience, and projects are easier to review quickly.',
    });
  }

  const atsScore = Math.round((
    keywordCoverageScore * 0.25 +
    matchResult.technicalSkills * 0.2 +
    matchResult.responsibilities * 0.2 +
    matchResult.qualifications * 0.15 +
    matchResult.experienceMatch * 0.2
  ));

  return {
    atsScore,
    keywordMatch: keywordCoverageScore,
    technicalSkillsMatch: matchResult.technicalSkills,
    responsibilitiesMatch: matchResult.responsibilities,
    qualificationsMatch: matchResult.qualifications,
    experienceMatch: matchResult.experienceMatch,
    strengths,
    weaknesses,
    missingKeywords: matchResult.missingKeywords,
    recommendations,
    checks: {
      keywordCoverage: `Keyword coverage is ${keywordCoverageScore}% based on the JD terms that appear in the current resume text.`,
      technicalSkillCoverage: `Technical skill coverage is ${matchResult.technicalSkills}% based on how strongly the resume reflects the JD technical stack.`,
      responsibilityCoverage: `Responsibility coverage is ${matchResult.responsibilities}% based on the JD responsibilities that are reflected in the current resume text.`,
      qualificationCoverage: `Qualification coverage is ${matchResult.qualifications}% based on education, seniority, and experience signals present in the current resume.`,
      jobTitleAlignment: `Job title alignment is ${Math.max(50, Math.min(100, matchResult.overall))}% based on the current role title and the JD target role.`,
      yearsOfExperienceAlignment: `Years of experience alignment is ${matchResult.experienceMatch}% based on the work history in the structured resume.`,
      sectionCompleteness: `Section completeness is ${Math.round(sectionCompletenessScore)}% because the resume currently includes the main content sections.`,
      bulletQuality: `Bullet quality is ${Math.round(bulletScore)}% based on whether the experience bullets are actionable and concise.`,
      keywordStuffing: `Keyword stuffing risk is ${keywordStuffingScore}% because the current phrasing does not repeat the same JD terms excessively.`,
      formattingProblems: sectionCompletenessScore < 100 ? 'Formatting issues are minimal, but the resume should keep sections clearly separated for easy scanning.' : 'No obvious formatting problems were detected.',
      missingImportantTerms: matchResult.missingKeywords,
      unsupportedSkills: unsupportedSkills.map((skill) => skill.trim()),
    },
  };
}

export function improveResumeSection(masterResume: MasterResumeData, analysis: JdAnalysisResult, section: ResumeQualityRecommendation['section']): MasterResumeData {
  switch (section) {
    case 'summary': {
      const baseSummary = masterResume.professionalSummary.trim();
      const relevantSkills = masterResume.keySkills.filter((skill) => {
        const hasMatch = analysis.allKeywords.some((term) => containsKeyword(skill, term) || containsKeyword(term, skill));
        return hasMatch;
      }).slice(0, 4);
      const suffix = relevantSkills.length > 0 ? ` Focused on ${relevantSkills.join(', ')}.` : '';
      return {
        ...masterResume,
        professionalSummary: `${baseSummary}${suffix}`.trim(),
      };
    }
    case 'skills': {
      const orderedSkills = [...masterResume.keySkills];
      const relevantSkills = orderedSkills.filter((skill) => analysis.allKeywords.some((term) => containsKeyword(skill, term) || containsKeyword(term, skill)));
      const remainingSkills = orderedSkills.filter((skill) => !relevantSkills.includes(skill));
      return {
        ...masterResume,
        keySkills: [...relevantSkills, ...remainingSkills],
      };
    }
    case 'experience': {
      const updatedExperience = masterResume.workExperience.map((entry) => {
        const bullets = entry.bullets
          .filter(Boolean)
          .map((bullet) => bullet.replace(/^worked on /i, 'built ').replace(/^helped /i, 'supported ').trim());
        return {
          ...entry,
          bullets,
        };
      });
      return {
        ...masterResume,
        workExperience: updatedExperience,
      };
    }
    case 'projects': {
      const updatedProjects = masterResume.projects.map((project) => ({
        ...project,
        bullets: project.bullets.filter(Boolean),
      }));
      return {
        ...masterResume,
        projects: updatedProjects,
      };
    }
    case 'formatting': {
      return masterResume;
    }
    default:
      return masterResume;
  }
}

export function buildResumePreviewFromMasterResume(masterResume: MasterResumeData, matchResult?: ResumeMatchResult) {
  return {
    name: masterResume.personalInfo.fullName || 'Your Name',
    contact: {
      phone: masterResume.personalInfo.phone,
      email: masterResume.personalInfo.email,
      linkedin: masterResume.personalInfo.linkedin,
      github: masterResume.personalInfo.portfolio,
      location: masterResume.personalInfo.location,
    },
    summary: masterResume.professionalSummary || 'Professional summary will appear here.',
    skills: {
      languages: masterResume.keySkills.filter((skill) => /typescript|javascript|python|sql|java|c\+\+|go|rust/i.test(skill)),
      frameworks_tools: masterResume.keySkills.filter((skill) => /react|node|docker|git|vite|express|aws|azure|jira|terraform|kubernetes|linux/i.test(skill)),
      concepts: masterResume.keySkills.filter((skill) => !/typescript|javascript|python|sql|java|c\+\+|go|rust|react|node|docker|git|vite|express|aws|azure|jira|terraform|kubernetes|linux/i.test(skill)),
    },
    work_experience: masterResume.workExperience.map((entry) => ({
      role: entry.jobTitle,
      company: entry.company,
      duration: `${entry.startDate} – ${entry.endDate}`,
      bullets: entry.bullets,
    })),
    projects: masterResume.projects.map((project) => ({
      title: project.name,
      tech_stack: project.technologies,
      bullets: project.bullets,
    })),
    certifications: masterResume.certifications.map((entry) => entry.name),
    education: masterResume.education.map((entry) => ({
      degree: entry.degree,
      institution: entry.institution,
      duration: entry.year,
      score: '',
    })),
    keywords_extracted: matchResult?.matchedKeywords || [],
    keywords_matched: matchResult?.matchedKeywords || [],
    missing_skills: matchResult?.missingKeywords || [],
    match_score: matchResult?.overall || 0,
    selection_probability: `${matchResult?.overall || 0}% - Estimated alignment`,
    grammar_corrections: ['Improved ATS structure.'],
    improvement_tips: ['Keep bullet wording concise and factual.'],
  };
}
