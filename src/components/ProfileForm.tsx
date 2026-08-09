import React, { useState } from 'react';
import { CandidateProfile, EducationItem, WorkExperienceItem, ProjectItem } from '../types';
import { Plus, Trash2, Save, Sparkles, User, GraduationCap, Briefcase, FolderGit2, Wrench, Award, CheckCircle2 } from 'lucide-react';

interface ProfileFormProps {
  profile: CandidateProfile;
  onSaveProfile: (profile: CandidateProfile) => void;
  onNextStep: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile: initialProfile,
  onSaveProfile,
  onNextStep,
}) => {
  const [profile, setProfile] = useState<CandidateProfile>(initialProfile);
  const [skillInput, setSkillInput] = useState<string>('');
  const [certInput, setCertInput] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Personal Info Handler
  const handlePersonalInfoChange = (field: keyof CandidateProfile['personalInfo'], value: string) => {
    setProfile(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  // Education Handlers
  const handleAddEducation = () => {
    const newItem: EducationItem = {
      id: `edu_${Date.now()}`,
      degree: '',
      institution: '',
      year: '',
      cgpa: ''
    };
    setProfile(prev => ({ ...prev, education: [...prev.education, newItem] }));
  };

  const handleUpdateEducation = (id: string, field: keyof EducationItem, value: string) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleRemoveEducation = (id: string) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter(item => item.id !== id)
    }));
  };

  // Work Experience Handlers
  const handleAddWorkExperience = () => {
    const newItem: WorkExperienceItem = {
      id: `exp_${Date.now()}`,
      role: '',
      company: '',
      duration: '',
      bullets: ['']
    };
    setProfile(prev => ({ ...prev, workExperience: [...prev.workExperience, newItem] }));
  };

  const handleUpdateWorkExperience = (id: string, field: 'role' | 'company' | 'duration', value: string) => {
    setProfile(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleUpdateExperienceBullet = (expId: string, bulletIdx: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp => {
        if (exp.id !== expId) return exp;
        const newBullets = [...exp.bullets];
        newBullets[bulletIdx] = value;
        return { ...exp, bullets: newBullets };
      })
    }));
  };

  const handleAddExperienceBullet = (expId: string) => {
    setProfile(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp => {
        if (exp.id !== expId) return exp;
        return { ...exp, bullets: [...exp.bullets, ''] };
      })
    }));
  };

  const handleRemoveExperienceBullet = (expId: string, bulletIdx: number) => {
    setProfile(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp => {
        if (exp.id !== expId) return exp;
        return { ...exp, bullets: exp.bullets.filter((_, idx) => idx !== bulletIdx) };
      })
    }));
  };

  const handleRemoveWorkExperience = (id: string) => {
    setProfile(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(item => item.id !== id)
    }));
  };

  // Project Handlers
  const handleAddProject = () => {
    const newItem: ProjectItem = {
      id: `proj_${Date.now()}`,
      title: '',
      techUsed: '',
      bullets: ['']
    };
    setProfile(prev => ({ ...prev, projects: [...prev.projects, newItem] }));
  };

  const handleUpdateProject = (id: string, field: 'title' | 'techUsed', value: string) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleUpdateProjectBullet = (projId: string, bulletIdx: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.map(proj => {
        if (proj.id !== projId) return proj;
        const newBullets = [...proj.bullets];
        newBullets[bulletIdx] = value;
        return { ...proj, bullets: newBullets };
      })
    }));
  };

  const handleAddProjectBullet = (projId: string) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.map(proj => {
        if (proj.id !== projId) return proj;
        return { ...proj, bullets: [...proj.bullets, ''] };
      })
    }));
  };

  const handleRemoveProjectBullet = (projId: string, bulletIdx: number) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.map(proj => {
        if (proj.id !== projId) return proj;
        return { ...proj, bullets: proj.bullets.filter((_, idx) => idx !== bulletIdx) };
      })
    }));
  };

  const handleRemoveProject = (id: string) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.filter(item => item.id !== id)
    }));
  };

  // Skills Handlers
  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    const newSkills = skillInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !profile.skills.includes(s));
    
    if (newSkills.length > 0) {
      setProfile(prev => ({ ...prev, skills: [...prev.skills, ...newSkills] }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // Certifications Handlers
  const handleAddCertification = () => {
    if (!certInput.trim()) return;
    if (!profile.certifications.includes(certInput.trim())) {
      setProfile(prev => ({ ...prev, certifications: [...prev.certifications, certInput.trim()] }));
      setCertInput('');
    }
  };

  const handleRemoveCertification = (certToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certToRemove)
    }));
  };

  // Submit Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Candidate Master Profile
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Fill in your authentic career history. Gemini AI uses these exact facts to tailor targeted resumes.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Profile saved successfully to local browser storage!</span>
          </div>
          <button
            onClick={onNextStep}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
          >
            Proceed to Job Description →
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: PERSONAL INFORMATION */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={profile.personalInfo.fullName}
                onChange={e => handlePersonalInfoChange('fullName', e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={profile.personalInfo.email}
                onChange={e => handlePersonalInfoChange('email', e.target.value)}
                placeholder="e.g. alex.rivera@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={profile.personalInfo.phone}
                onChange={e => handlePersonalInfoChange('phone', e.target.value)}
                placeholder="e.g. +1 (555) 234-5678"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={profile.personalInfo.location}
                onChange={e => handlePersonalInfoChange('location', e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
              <input
                type="text"
                value={profile.personalInfo.linkedin}
                onChange={e => handlePersonalInfoChange('linkedin', e.target.value)}
                placeholder="e.g. linkedin.com/in/alexrivera"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio / Github URL</label>
              <input
                type="text"
                value={profile.personalInfo.portfolio}
                onChange={e => handlePersonalInfoChange('portfolio', e.target.value)}
                placeholder="e.g. github.com/alexrivera"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: EDUCATION */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Education</h2>
            </div>
            <button
              type="button"
              onClick={handleAddEducation}
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Education</span>
            </button>
          </div>

          {profile.education.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No education entries added yet.</p>
          ) : (
            <div className="space-y-4">
              {profile.education.map((edu, index) => (
                <div key={edu.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Degree #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(edu.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Remove education"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Degree / Qualification</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={e => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                        placeholder="e.g. B.S. in Computer Science"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Institution / University</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={e => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                        placeholder="e.g. UC Berkeley"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Graduation Year / Dates</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={e => handleUpdateEducation(edu.id, 'year', e.target.value)}
                        placeholder="e.g. 2020 - 2024"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">CGPA / GPA / Honors</label>
                      <input
                        type="text"
                        value={edu.cgpa}
                        onChange={e => handleUpdateEducation(edu.id, 'cgpa', e.target.value)}
                        placeholder="e.g. 3.8 / 4.0"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: WORK EXPERIENCE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Work Experience</h2>
            </div>
            <button
              type="button"
              onClick={handleAddWorkExperience}
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </button>
          </div>

          {profile.workExperience.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No work experience added yet.</p>
          ) : (
            <div className="space-y-6">
              {profile.workExperience.map((exp, expIdx) => (
                <div key={exp.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Work Experience #{expIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWorkExperience(exp.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Remove work experience"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Job Role / Title</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={e => handleUpdateWorkExperience(exp.id, 'role', e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={e => handleUpdateWorkExperience(exp.id, 'company', e.target.value)}
                        placeholder="e.g. Apex Tech Solutions"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Duration / Dates</label>
                      <input
                        type="text"
                        value={exp.duration}
                        onChange={e => handleUpdateWorkExperience(exp.id, 'duration', e.target.value)}
                        placeholder="e.g. Jun 2024 - Present"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Bullet points */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700">Key Achievements / Responsibilities (Bullet Points)</label>
                      <button
                        type="button"
                        onClick={() => handleAddExperienceBullet(exp.id)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Bullet
                      </button>
                    </div>

                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">•</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={e => handleUpdateExperienceBullet(exp.id, bIdx, e.target.value)}
                          placeholder="e.g. Built REST APIs using Express and optimized database queries by 30%"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                        />
                        {exp.bullets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExperienceBullet(exp.id, bIdx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: PROJECTS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <FolderGit2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Key Projects</h2>
            </div>
            <button
              type="button"
              onClick={handleAddProject}
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {profile.projects.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No project entries added yet.</p>
          ) : (
            <div className="space-y-6">
              {profile.projects.map((proj, projIdx) => (
                <div key={proj.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Project #{projIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(proj.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Remove project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Project Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={e => handleUpdateProject(proj.id, 'title', e.target.value)}
                        placeholder="e.g. TaskPulse - Project Management Tool"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Technologies Used</label>
                      <input
                        type="text"
                        value={proj.techUsed}
                        onChange={e => handleUpdateProject(proj.id, 'techUsed', e.target.value)}
                        placeholder="e.g. React, Node.js, Express, PostgreSQL"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Bullet points */}
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700">Project Highlights (Bullet Points)</label>
                      <button
                        type="button"
                        onClick={() => handleAddProjectBullet(proj.id)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Bullet
                      </button>
                    </div>

                    {proj.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">•</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={e => handleUpdateProjectBullet(proj.id, bIdx, e.target.value)}
                          placeholder="e.g. Built real-time drag-and-drop collaboration supporting 50+ concurrent users"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                        />
                        {proj.bullets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProjectBullet(proj.id, bIdx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 5: SKILLS & CERTIFICATIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SKILLS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Wrench className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Skills Inventory</h2>
            </div>

            <p className="text-xs text-slate-500">
              Enter individual skills or comma-separated lists (e.g., React, TypeScript, Node.js).
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="e.g. TypeScript, React, Docker"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-red-600 font-bold ml-1 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* CERTIFICATIONS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Certifications</h2>
            </div>

            <p className="text-xs text-slate-500">
              Add professional certifications, courses, or licenses.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={certInput}
                onChange={e => setCertInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCertification();
                  }
                }}
                placeholder="e.g. AWS Certified Developer (2024)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddCertification}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add Cert
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {profile.certifications.map((cert, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium"
                >
                  <span>{cert}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(cert)}
                    className="text-blue-400 hover:text-red-600 font-bold ml-1 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            * Changes are automatically saved to your local browser storage.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              id="save-profile-btn"
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Master Profile</span>
            </button>

            <button
              type="button"
              id="continue-to-jd-btn"
              onClick={() => {
                onSaveProfile(profile);
                onNextStep();
              }}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20"
            >
              <span>Continue to Job Description</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
