import { CandidateProfile } from '../types';

export const EMPTY_PROFILE: CandidateProfile = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: ""
  },
  education: [],
  workExperience: [],
  projects: [],
  skills: [],
  certifications: []
};

export const SAMPLE_PROFILE: CandidateProfile = EMPTY_PROFILE;

export const SAMPLE_OLD_RESUME_TEXT = '';

export const SAMPLE_JOB_DESCRIPTION = '';
