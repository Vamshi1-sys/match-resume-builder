export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
}

export interface EducationItem {
  id?: string;
  degree: string;
  institution: string;
  year?: string;
  duration?: string;
  score?: string;
  cgpa?: string;
}

export interface WorkExperienceItem {
  id?: string;
  role: string;
  company: string;
  duration?: string;
  bullets: string[];
}

export interface ProjectItem {
  id?: string;
  title: string;
  techUsed?: string;
  tech_stack?: string;
  bullets: string[];
}

export interface CandidateProfile {
  personalInfo: PersonalInfo;
  education: EducationItem[];
  workExperience: WorkExperienceItem[];
  projects: ProjectItem[];
  skills: string[];
  certifications: string[];
}

export interface TailoredExperienceItem {
  role: string;
  company: string;
  duration?: string;
  bullets: string[];
}

export interface TailoredProjectItem {
  title: string;
  techUsed?: string;
  tech_stack?: string;
  bullets: string[];
}

export interface SkillsGroup {
  languages?: string[];
  frameworks_tools?: string[];
  concepts?: string[];
}

export interface TailoredResumeResult {
  // Primary MNC Schema fields
  name?: string;
  contact?: {
    phone?: string;
    email?: string;
    linkedin?: string;
    github?: string;
    location?: string;
  };
  summary?: string;
  skills?: SkillsGroup;
  work_experience?: WorkExperienceItem[];
  projects?: ProjectItem[];
  certifications?: string[];
  virtual_experience_programs?: string[];
  achievements_activities?: string[];
  education?: EducationItem[];

  // ATS Metrics & Compatibility fields
  match_score: number;
  selection_probability?: string;
  count_words_corrected?: number;
  keywords_added_count?: number;
  keywords_extracted: string[];
  keywords_matched: string[];
  missing_skills: string[];
  tailored_summary?: string;
  reordered_skills?: string[];
  candidate_info?: PersonalInfo;
  tailored_experience?: TailoredExperienceItem[];
  tailored_projects?: TailoredProjectItem[];
  grammar_corrections: string[];
  improvement_tips: string[];
  createdAt?: string;
  targetJobTitle?: string;
  targetCompany?: string;
}

export interface TailorRequestPayload {
  oldResumeText?: string;
  profile?: CandidateProfile;
  jobDescription: string;
  targetJobTitle?: string;
  targetCompany?: string;
  candidateNameOverride?: string;
}

export interface CertificationEntry {
  name: string;
  organization: string;
  year?: string;
}

export interface MasterResumeProject {
  name: string;
  technologies: string;
  bullets: string[];
}

export interface MasterResumeWorkExperienceEntry {
  company: string;
  jobTitle: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface MasterResumeEducationEntry {
  degree: string;
  institution: string;
  location: string;
  year: string;
  score?: string;
  cgpa?: string;
}

export interface MasterResumeData {
  personalInfo: PersonalInfo;
  professionalSummary: string;
  keySkills: string[];
  workExperience: MasterResumeWorkExperienceEntry[];
  projects: MasterResumeProject[];
  education: MasterResumeEducationEntry[];
  certifications: CertificationEntry[];
}

export type AppScreen = 'generator' | 'profile' | 'results';


