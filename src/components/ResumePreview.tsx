import React from 'react';
import { CandidateProfile, MasterResumeData, TailoredResumeResult } from '../types';

interface ResumePreviewProps {
  profile: CandidateProfile;
  result: TailoredResumeResult;
  masterResume?: MasterResumeData;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

const isSampleName = (name?: string) =>
  !name ||
  name.toLowerCase().includes('alex rivera') ||
  name === 'Candidate Name';

const cleanUrl = (url: string) => url.replace(/^https?:\/\//, '');

const formatDateRange = (startDate?: string, endDate?: string) => {
  const parts = [startDate?.trim(), endDate?.trim()].filter(Boolean);
  return parts.join(' – ');
};

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    style={{
      margin: '0 0 6px 0',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#111827',
      borderBottom: '1px solid #d1d5db',
      paddingBottom: '4px',
    }}
  >
    {children}
  </h2>
);

const Section: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <section style={{ marginBottom: '14px', ...style }}>{children}</section>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export const ResumePreview: React.FC<ResumePreviewProps> = ({ profile, result, masterResume, containerRef }) => {
  // ── Contact / Name resolution ─────────────────────────────────────────────
  const name = !isSampleName(result.name)
    ? result.name
    : !isSampleName(result.candidate_info?.fullName)
    ? result.candidate_info?.fullName
    : !isSampleName(profile.personalInfo?.fullName)
    ? profile.personalInfo?.fullName
    : '';

  const contact = {
    phone:    result.contact?.phone    || result.candidate_info?.phone    || profile.personalInfo?.phone    || '',
    email:    result.contact?.email    || result.candidate_info?.email    || profile.personalInfo?.email    || '',
    linkedin: result.contact?.linkedin || result.candidate_info?.linkedin || profile.personalInfo?.linkedin || '',
    github:   result.contact?.github   || result.contact?.portfolio       || result.candidate_info?.portfolio || profile.personalInfo?.portfolio || '',
    location: result.contact?.location || result.candidate_info?.location || profile.personalInfo?.location || '',
  };

  const summary = result.summary || result.tailored_summary || '';

  // ── Skills ────────────────────────────────────────────────────────────────
  const skillsObj       = result.skills;
  const hasLanguages    = !!skillsObj?.languages?.length;
  const hasFrameworks   = !!skillsObj?.frameworks_tools?.length;
  const hasConcepts     = !!skillsObj?.concepts?.length;
  const hasCatSkills    = hasLanguages || hasFrameworks || hasConcepts;
  const flatSkills      =
    result.reordered_skills?.length ? result.reordered_skills : profile.skills ?? [];

  const structuredWorkExperience = masterResume?.workExperience?.length
    ? masterResume.workExperience.map((entry) => ({
        role: entry.jobTitle,
        company: entry.company,
        duration: formatDateRange(entry.startDate, entry.endDate),
        bullets: entry.bullets,
      }))
    : null;

  const structuredProjects = masterResume?.projects?.length
    ? masterResume.projects.map((project) => ({
        title: project.name,
        tech_stack: project.technologies,
        bullets: project.bullets,
      }))
    : null;

  const structuredEducation = masterResume?.education?.length
    ? masterResume.education.map((entry) => ({
        degree: entry.degree,
        institution: entry.institution,
        duration: entry.year,
        score: entry.score,
        cgpa: entry.cgpa,
      }))
    : null;

  const structuredCertifications = masterResume?.certifications?.length
    ? masterResume.certifications
    : null;

  // ── Work Experience ───────────────────────────────────────────────────────
  const rawExp = structuredWorkExperience ?? (result.work_experience?.length
    ? result.work_experience
    : result.tailored_experience?.length
    ? result.tailored_experience
    : []);

  const validExp = rawExp.filter((exp) => {
    if (!exp) return false;
    const hasCompany = exp.company?.trim();
    const hasRole    = exp.role && exp.role !== 'Professional Experience' && exp.role !== 'Experience Role';
    const hasBullets = exp.bullets?.length;
    return (hasCompany && (hasRole || hasBullets)) || (hasRole && hasBullets);
  });

  // ── Projects ──────────────────────────────────────────────────────────────
  const rawProjects = structuredProjects ?? (result.projects?.length
    ? result.projects
    : result.tailored_projects?.length
    ? result.tailored_projects
    : []);
  const validProjects = rawProjects.filter((p) => p?.title && p?.bullets?.length);

  // ── Certs & VEPs ─────────────────────────────────────────────────────────
  const certs   = structuredCertifications || result.certifications || profile.certifications || [];
  const veps    = result.virtual_experience_programs || [];
  const certVep = [...certs, ...veps];

  // ── Achievements ──────────────────────────────────────────────────────────
  const achievements = result.achievements_activities || [];

  // ── Education ─────────────────────────────────────────────────────────────
  const education = structuredEducation ?? (result.education?.length ? result.education : []);

  // ── Shared inline styles ──────────────────────────────────────────────────
  const bodyText: React.CSSProperties = {
    fontSize: '10.5px',
    color: '#202124',
    lineHeight: 1.55,
    margin: 0,
  };
  const bulletList: React.CSSProperties = {
    margin: '4px 0 0 0',
    paddingLeft: '15px',
    listStyleType: 'disc',
  };
  const bulletItem: React.CSSProperties = {
    ...bodyText,
    marginBottom: '2px',
    paddingLeft: '2px',
  };
  const jobHeaderRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '4px',
    marginBottom: '2px',
  };
  const jobTitle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#202124',
    margin: 0,
  };
  const jobDuration: React.CSSProperties = {
    fontSize: '9.5px',
    fontWeight: 600,
    color: '#5f6368',
    whiteSpace: 'nowrap',
  };
  const companyName: React.CSSProperties = {
    fontSize: '10.5px',
    color: '#3c4043',
    fontStyle: 'italic',
    margin: 0,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      id="resume-export-container"
      style={{
        fontFamily: "'Arial', 'Helvetica', sans-serif",
        backgroundColor: '#ffffff',
        color: '#202124',
        maxWidth: '794px',          // A4-ish
        margin: '0 auto',
        padding: '32px 40px',
        boxShadow: 'none',
        borderRadius: '0',
        lineHeight: 1.5,
        boxSizing: 'border-box',
      }}
    >

      {/* ══════════ TEMPORARY DEBUG BLOCK — remove after diagnosis ══════════ */}
      <pre style={{ background: '#fee', padding: '10px', fontSize: '10px', whiteSpace: 'pre-wrap', marginBottom: '16px', border: '2px solid red', borderRadius: '4px', overflowX: 'auto' }}>
        {`DEBUG masterResume.education:\n${JSON.stringify(masterResume?.education, null, 2)}\n\nDEBUG masterResume.projects:\n${JSON.stringify(masterResume?.projects, null, 2)}\n\nDEBUG result.education:\n${JSON.stringify(result?.education, null, 2)}\n\nDEBUG result.projects:\n${JSON.stringify(result?.projects, null, 2)}`}
      </pre>
      {/* ══════════ END TEMPORARY DEBUG BLOCK ══════════ */}

      {/* ──────────────── 1. HEADER ──────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #d1d5db' }}>
        {name && (
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#202124',
              letterSpacing: '0.02em',
              margin: '0 0 6px 0',
              lineHeight: 1.2,
            }}
          >
            {name}
          </h1>
        )}

        {/* Contact line */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0px',
            fontSize: '9.5px',
            color: '#3c4043',
            rowGap: '4px',
          }}
        >
          {[
            contact.location && (
              <span key="loc">
                {contact.location}
              </span>
            ),
            contact.phone && (
              <span key="phone">
                {contact.phone}
              </span>
            ),
            contact.email && (
              <span key="email">
                <a href={`mailto:${contact.email}`} style={{ color: '#1a73e8', textDecoration: 'none' }}>
                  {contact.email}
                </a>
              </span>
            ),
            contact.linkedin && (
              <span key="li">
                <a href={`https://${cleanUrl(contact.linkedin)}`} target="_blank" rel="noreferrer" style={{ color: '#1a73e8', textDecoration: 'none' }}>
                  {cleanUrl(contact.linkedin)}
                </a>
              </span>
            ),
            contact.github && (
              <span key="gh">
                <a href={`https://${cleanUrl(contact.github)}`} target="_blank" rel="noreferrer" style={{ color: '#1a73e8', textDecoration: 'none' }}>
                  {cleanUrl(contact.github)}
                </a>
              </span>
            ),
          ]
            .filter(Boolean)
            .map((el, i, arr) => (
              <React.Fragment key={i}>
                {el}
                {i < arr.length - 1 && (
                  <span style={{ margin: '0 8px', color: '#dadce0', fontWeight: 300 }}>|</span>
                )}
              </React.Fragment>
            ))}
        </div>
      </div>

      {/* ──────────────── 2. PROFESSIONAL SUMMARY ──────────────── */}
      {summary?.trim() && (
        <Section>
          <SectionHeading>Professional Summary</SectionHeading>
          <p style={{ ...bodyText, marginTop: '6px', lineHeight: 1.6, color: '#3c4043' }}>
            {summary}
          </p>
        </Section>
      )}

      {/* ──────────────── 3. TECHNICAL SKILLS ──────────────── */}
      {(hasCatSkills || flatSkills.length > 0) && (
        <Section>
          <SectionHeading>Technical Skills</SectionHeading>
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {hasLanguages && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ ...bodyText, fontWeight: 700, color: '#202124', minWidth: '110px' }}>Languages:</span>
                <span style={{ ...bodyText, flex: 1 }}>{skillsObj!.languages!.join(', ')}</span>
              </div>
            )}
            {hasFrameworks && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ ...bodyText, fontWeight: 700, color: '#202124', minWidth: '110px' }}>Frameworks & Tools:</span>
                <span style={{ ...bodyText, flex: 1 }}>{skillsObj!.frameworks_tools!.join(', ')}</span>
              </div>
            )}
            {hasConcepts && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ ...bodyText, fontWeight: 700, color: '#202124', minWidth: '110px' }}>Concepts:</span>
                <span style={{ ...bodyText, flex: 1 }}>{skillsObj!.concepts!.join(', ')}</span>
              </div>
            )}
            {!hasCatSkills && flatSkills.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ ...bodyText, fontWeight: 700, color: '#202124', minWidth: '110px' }}>Core Competencies:</span>
                <span style={{ ...bodyText, flex: 1 }}>{flatSkills.join(', ')}</span>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ──────────────── 4. WORK EXPERIENCE ──────────────── */}
      {validExp.length > 0 && (
        <Section>
          <SectionHeading>Work Experience</SectionHeading>
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {validExp.map((exp, i) => (
              <div key={i}>
                <div style={jobHeaderRow}>
                  <div>
                    <p style={jobTitle}>{exp.role}</p>
                    {exp.company && <p style={companyName}>{exp.company}</p>}
                  </div>
                  {exp.duration && <span style={jobDuration}>{exp.duration}</span>}
                </div>
                {exp.bullets?.length > 0 && (
                  <ul style={bulletList}>
                    {exp.bullets.map((b, bi) => (
                      <li key={bi} style={bulletItem}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ──────────────── 5. PROJECTS ──────────────── */}
      {validProjects.length > 0 && (
        <Section>
          <SectionHeading>Projects</SectionHeading>
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {validProjects.map((proj, i) => {
              const tech = proj.tech_stack || proj.techUsed;
              return (
                <div key={i}>
                  <div style={jobHeaderRow}>
                    <p style={jobTitle}>
                      {proj.title}
                      {tech && (
                        <span style={{ fontWeight: 400, color: '#5f6368', fontStyle: 'italic', marginLeft: '6px' }}>
                          ({tech})
                        </span>
                      )}
                    </p>
                  </div>
                  {proj.bullets?.length > 0 && (
                    <ul style={bulletList}>
                      {proj.bullets.map((b, bi) => (
                        <li key={bi} style={bulletItem}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ──────────────── 6. EDUCATION ──────────────── */}
      {education.length > 0 && (
        <Section>
          <SectionHeading>Education</SectionHeading>
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {education.map((edu, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={jobHeaderRow}>
                  <div>
                    {edu.institution && <p style={jobTitle}>{edu.institution}</p>}
                    {(edu.duration || edu.year) && (
                      <p style={companyName}>{edu.duration || edu.year}</p>
                    )}
                  </div>
                </div>
                <p style={{ ...bodyText, fontWeight: 700, color: '#202124' }}>{edu.degree}</p>
                {(edu.score || edu.cgpa) && (
                  <p style={{ ...bodyText, color: '#5f6368' }}>
                    CGPA: {edu.score || edu.cgpa}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ──────────────── 7. CERTIFICATIONS & VEPs ──────────────── */}
      {certVep.length > 0 && (
        <Section>
          <SectionHeading>Certifications & Programs</SectionHeading>
          <ul style={{ ...bulletList, marginTop: '6px' }}>
            {certVep.map((item, i) => {
              if (typeof item === 'string') {
                return <li key={i} style={bulletItem}>{item}</li>;
              }

              const certificationParts = [item.name, item.organization, item.year].filter(Boolean);
              return <li key={i} style={bulletItem}>{certificationParts.join(' | ')}</li>;
            })}
          </ul>
        </Section>
      )}

      {/* ──────────────── 8. ACHIEVEMENTS ──────────────── */}
      {achievements.length > 0 && (
        <Section>
          <SectionHeading>Achievements & Activities</SectionHeading>
          <ul style={{ ...bulletList, marginTop: '6px' }}>
            {achievements.map((item, i) => (
              <li key={i} style={bulletItem}>{item}</li>
            ))}
          </ul>
        </Section>
      )}

    </div>
  );
};
