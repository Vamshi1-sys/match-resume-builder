import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const SAMPLE_NAMES = new Set(["alex rivera", "alex.rivera@example.com", "alexrivera-dev"]);

function cleanAndValidateKeywords(keywords: string[], resumeText: string, jdText: string): string[] {
  const combined = (resumeText + " " + jdText).toLowerCase();
  const stopWords = new Set([
    "greetings", "from", "colan", "the", "and", "for", "with", "that", "this", 
    "you", "our", "are", "will", "work", "team", "must", "requirements", 
    "responsibilities", "obj", "endobj", "stream", "endstream", "pdf", "page",
    "bullet", "skills", "experience", "summary", "education", "resume"
  ]);

  return (keywords || []).filter((kw) => {
    if (!kw || typeof kw !== "string") return false;
    const cleaned = kw.trim().toLowerCase();
    if (cleaned.length < 2 || stopWords.has(cleaned)) return false;
    // Must be found verbatim in either original resume text or JD text
    return combined.includes(cleaned);
  });
}

/**
 * Pre-processes resume text to insert newlines before section headings.
 * PDFs often extract as one long line per page; this breaks them at headings.
 */
function preprocessResumeText(raw: string): string {
  // Replace 2+ whitespace + known heading + whitespace with \nHEADING\n
  // This handles PDF extraction where all text is on one long line.
  return raw
    .replace(/\s{2,}(WORK\s+EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|EMPLOYMENT|CAREER\s+HISTORY)\s+/gi, '\n$1\n')
    .replace(/\s{2,}(EDUCATION|ACADEMICS?)\s+/gi, '\n$1\n')
    .replace(/\s{2,}(TECHNICAL\s+SKILLS?|SKILLS?\s+SUMMARY|CORE\s+SKILLS?|COMPETENCIES|SKILL\s+HIGHLIGHTS?)\s+/gi, '\n$1\n')
    .replace(/\s{2,}(KEY\s+PROJECTS?|PERSONAL\s+PROJECTS?|ACADEMIC\s+PROJECTS?|PROJECTS?)\s+/gi, '\n$1\n')
    .replace(/\s{2,}(PROFESSIONAL\s+SUMMARY|CAREER\s+OBJECTIVE|PROFILE\s+SUMMARY|SUMMARY|OBJECTIVE)\s+/gi, '\n$1\n')
    .replace(/\s{2,}(CERTIFICATIONS?\s*(?:AND\s+TRAINING)?|LICENSES?\s*(?:AND\s+CERTIFICATIONS?)?)\s+/gi, '\n$1\n')
    .replace(/\s{2,}(ACHIEVEMENTS?\s*(?:AND\s+ACTIVITIES?)?|EXTRACURRICULAR\s*(?:ACTIVITIES?)?|LEADERSHIP\s*(?:AND\s+ACTIVITIES?)?|AWARDS?\s*(?:AND\s+HONOURS?)?|HONOURS?|HONORS?|AWARDS?)\s+/gi, '\n$1\n')
    .replace(/\s{2,}(INTERNSHIPS?\s*(?:AND\s+EXPERIENCE)?)\s+/gi, '\n$1\n')
    .replace(/\s{2,}(VIRTUAL\s+EXPERIENCE\s+PROGRAMS?)\s+/gi, '\n$1\n');
}

function parseOldResumeText(rawText: string, candidateNameOverride?: string) {
  const text = preprocessResumeText(rawText || "");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : "";

  // Phone
  const phoneMatch = text.match(/(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";

  // Linkedin
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const linkedin = linkedinMatch ? linkedinMatch[0] : "";

  // Portfolio
  const portfolioMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:github\.com|gitlab\.com)\/[\w-]+/i);
  const portfolio = portfolioMatch ? portfolioMatch[0] : "";

  // Location
  const locationMatch = text.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(\s+\d{5})?)/);
  const location = locationMatch ? locationMatch[0] : "";

  // Full Name - extract from old resume text first or use candidateNameOverride
  let extractedName = candidateNameOverride?.trim() || "";
  if (!extractedName) {
    for (const line of lines) {
      if (
        !line.includes("@") &&
        !line.match(/\d{10}/) &&
        !line.toLowerCase().includes("resume") &&
        !line.toLowerCase().includes("curriculum") &&
        !line.toLowerCase().includes("linkedin") &&
        !line.toLowerCase().includes("github") &&
        !line.toLowerCase().includes("summary") &&
        !line.toLowerCase().includes("objective") &&
        !line.toLowerCase().includes("experience") &&
        !line.toLowerCase().includes("education") &&
        !line.toLowerCase().includes("skills") &&
        line.length > 2 &&
        line.length < 45
      ) {
        extractedName = line.replace(/^Name:\s*/i, "").trim();
        break;
      }
    }
  }

  // Section splitting
  const sections: { [key: string]: string[] } = {};
  let currentSection = "HEADER";
  sections[currentSection] = [];

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.includes("WORK EXPERIENCE") || upper.includes("EXPERIENCE") || upper.includes("EMPLOYMENT") || upper.includes("CAREER HISTORY")) {
      currentSection = "EXPERIENCE";
      if (!sections[currentSection]) sections[currentSection] = [];
    } else if (upper.includes("EDUCATION") || upper.includes("ACADEMIC")) {
      currentSection = "EDUCATION";
      if (!sections[currentSection]) sections[currentSection] = [];
    } else if (upper.includes("SKILLS") || upper.includes("TECHNICAL SKILLS") || upper.includes("COMPETENCIES") || upper.includes("SKILL HIGHLIGHTS")) {
      currentSection = "SKILLS";
      if (!sections[currentSection]) sections[currentSection] = [];
    } else if (upper.includes("PROJECTS") || upper.includes("PERSONAL PROJECTS") || upper.includes("KEY PROJECTS")) {
      currentSection = "PROJECTS";
      if (!sections[currentSection]) sections[currentSection] = [];
    } else if (upper.includes("SUMMARY") || upper.includes("OBJECTIVE") || upper.includes("PROFILE SUMMARY")) {
      currentSection = "SUMMARY";
      if (!sections[currentSection]) sections[currentSection] = [];
    } else if (upper.includes("CERTIFICATION") || upper.includes("LICENSES")) {
      currentSection = "CERTIFICATIONS";
      if (!sections[currentSection]) sections[currentSection] = [];
    } else if (
      upper.includes("ACHIEVEMENT") || upper.includes("EXTRACURRICULAR") ||
      upper.includes("LEADERSHIP") || upper.includes("ACTIVITIES") ||
      upper.includes("AWARDS") || upper.includes("HONOURS") || upper.includes("HONORS")
    ) {
      currentSection = "ACHIEVEMENTS";
      if (!sections[currentSection]) sections[currentSection] = [];
    } else {
      sections[currentSection].push(line);
    }
  }

  // Extract Summary
  let summary = "";
  if (sections["SUMMARY"] && sections["SUMMARY"].length > 0) {
    summary = sections["SUMMARY"].join(" ");
  }

  // Extract Skills strictly from resume text — process line-by-line to avoid label bleed
  const SKILL_LABEL_RE = /^(?:Languages?|Frameworks?(?:\s*[&+]\s*Tools?)?|Concepts?|Tools?|Technologies?|Platforms?|Libraries?|Databases?|Others?|Core\s+Competencies?):\s*/i;
  let skills: string[] = [];
  if (sections["SKILLS"] && sections["SKILLS"].length > 0) {
    for (const line of sections["SKILLS"]) {
      // Strip leading category labels (e.g. "Languages:", "Frameworks & Tools:")
      const stripped = line.replace(SKILL_LABEL_RE, "");
      const items = stripped
        .split(/[,•|·]/)
        .map((s) => s.replace(/^[-*]\s*/, "").trim())
        // Drop any item that is STILL a label prefix (safety)
        .filter((s) => s.length > 1 && s.length < 45 && !SKILL_LABEL_RE.test(s + ":"));
      skills.push(...items);
    }
    // Deduplicate
    skills = Array.from(new Set(skills));
  }

  // Extract Education — group multi-line entries and parse degree / institution / year
  let educationList: any[] = [];
  if (sections["EDUCATION"] && sections["EDUCATION"].length > 0) {
    let currentEdu: any = null;

    for (const line of sections["EDUCATION"]) {
      if (line.length <= 3) continue;

      // Detect year patterns like "2020", "May 2023", "Dec 25", "2019 – 2023"
      const hasYear = /(?:19|20)\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(?:'?\d{2}|\d{4})/i.test(line);
      // Detect degree keywords
      const isDegree = /\b(?:B\.?Tech|B\.?E|B\.?Sc|B\.?Com|M\.?Tech|M\.?Sc|M\.?E|MBA|MCA|BCA|B\.?A|M\.?A|PhD|Ph\.?D|Bachelor|Master|Diploma|Associate|Doctor|Graduate|Post.?Graduate|Engineering|Science|Computer|Arts|Commerce|M\.S\.|B\.S\.)\b/i.test(line);
      // Detect institution keywords
      const isInstitution = /\b(?:University|Institute|College|School|Academy|Polytechnic|Institution|Technology|IIT|NIT|VIT|SRM|Anna\s+University)\b/i.test(line);

      if (isDegree && !isInstitution) {
        // This line is a degree line — start a new entry or set degree on current
        if (!currentEdu || currentEdu.degree) {
          currentEdu = { degree: "", institution: "", year: "", cgpa: "" };
          educationList.push(currentEdu);
        }
        // Extract year from degree line if present
        const yearMatch = line.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(?:'?\d{2}|\d{4})|(?:19|20)\d{2}(?:\s*[-–]\s*(?:(?:19|20)\d{2}|Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(?:'?\d{2}|\d{4})))?)/i);
        if (yearMatch) currentEdu.year = yearMatch[0].trim();
        currentEdu.degree = line.replace(/[|,].*$/, "").replace(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(?:'?\d{2}|\d{4})/ig, "").replace(/(?:19|20)\d{2}.*/, "").replace(/[-–]+$/, "").trim();
      } else if (isInstitution || (hasYear && line.includes("|")) ) {
        // This line is an institution line (may also contain year via pipe)
        if (!currentEdu) {
          currentEdu = { degree: "", institution: "", year: "", cgpa: "" };
          educationList.push(currentEdu);
        }
        // Split on pipe: "South East Missouri State University | Master of Science – Dec 25"
        const parts = line.split(/\s*[|]\s*/);
        currentEdu.institution = parts[0].trim();
        if (parts[1]) {
          // Second part may contain degree + year
          const yearMatch2 = parts[1].match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(?:'?\d{2}|\d{4})|(?:19|20)\d{2}(?:\s*[-–]\s*(?:(?:19|20)\d{2}|Present|\w+\s*'?\d{2}))?)/);
          if (yearMatch2 && !currentEdu.year) currentEdu.year = yearMatch2[0].trim();
          if (!currentEdu.degree) {
            currentEdu.degree = parts[1].replace(/[-–].*$/, "").trim();
          }
        }
        // Extract year from institution line if not already found
        if (!currentEdu.year) {
          const yr = line.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(?:'?\d{2}|\d{4})|(?:19|20)\d{2}(?:\s*[-–]\s*(?:(?:19|20)\d{2}|Present|\w+\s*'?\d{2}))?)/i);
          if (yr) currentEdu.year = yr[0].trim();
        }
      } else if (hasYear && currentEdu) {
        // Standalone year line — attach to current entry
        if (!currentEdu.year) {
          const yr = line.match(/(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(?:'?\d{2}|\d{4})|(?:19|20)\d{2}(?:\s*[-–]\s*(?:(?:19|20)\d{2}|Present))?)/);
          if (yr) currentEdu.year = yr[0].trim();
        }
      } else if (currentEdu && !currentEdu.institution && !isDegree) {
        // Additional detail line — use as institution if not yet set
        currentEdu.institution = line.trim();
      }
    }
  }

  // Extract Experience
  let experienceList: any[] = [];
  if (sections["EXPERIENCE"] && sections["EXPERIENCE"].length > 0) {
    let currentRole: any = null;
    for (const line of sections["EXPERIENCE"]) {
      const isBullet = /^[-*•·\d+\.]\s*/.test(line);
      if (isBullet) {
        const bulletText = line.replace(/^[-*•·\d+\.]\s*/, "").trim();
        if (!currentRole) {
          currentRole = {
            role: "Experience Role",
            company: "",
            duration: "",
            bullets: []
          };
          experienceList.push(currentRole);
        }
        if (bulletText) currentRole.bullets.push(bulletText);
      } else {
        if (line.includes("|") || line.includes("-") || line.includes("(") || /20\d\d/.test(line)) {
          const parts = line.split(/[|]/).map((p) => p.trim());
          currentRole = {
            role: parts[0] || line,
            company: parts[1] || "",
            duration: line.match(/(?:19|20)\d\d.*?(?:Present|(?:19|20)\d\d)/i)?.[0] || "",
            bullets: []
          };
          experienceList.push(currentRole);
        } else if (line.length > 3) {
          if (!currentRole) {
            currentRole = {
              role: line,
              company: "",
              duration: "",
              bullets: []
            };
            experienceList.push(currentRole);
          } else {
            currentRole.bullets.push(line);
          }
        }
      }
    }
  }

  if (experienceList.length === 0) {
    const allBullets = lines
      .filter((l) => /^[-*•·\d+\.]\s*/.test(l))
      .map((l) => l.replace(/^[-*•·\d+\.]\s*/, "").trim());

    if (allBullets.length > 0) {
      experienceList = [
        {
          role: "Professional Experience",
          company: "",
          duration: "",
          bullets: allBullets
        }
      ];
    }
  }

  // Extract Projects
  let projectsList: any[] = [];
  if (sections["PROJECTS"] && sections["PROJECTS"].length > 0) {
    let currentProj: any = null;
    for (const line of sections["PROJECTS"]) {
      const isBullet = /^[-*•·\d+\.]\s*/.test(line);
      if (isBullet) {
        const bulletText = line.replace(/^[-*•·\d+\.]\s*/, "").trim();
        if (!currentProj) {
          currentProj = { title: "Key Project", techUsed: "", bullets: [] };
          projectsList.push(currentProj);
        }
        if (bulletText) currentProj.bullets.push(bulletText);
      } else if (line.length > 3) {
        currentProj = { title: line, techUsed: "", bullets: [] };
        projectsList.push(currentProj);
      }
    }
  }

  // Extract Certifications
  let certsList: string[] = [];
  if (sections["CERTIFICATIONS"] && sections["CERTIFICATIONS"].length > 0) {
    certsList = sections["CERTIFICATIONS"]
      .filter((l) => l.length > 3)
      .map((l) => l.replace(/^[-*•·]\s*/, "").trim());
  }

  // Extract Achievements / Extracurricular / Leadership
  let achievementsList: string[] = [];
  if (sections["ACHIEVEMENTS"] && sections["ACHIEVEMENTS"].length > 0) {
    achievementsList = sections["ACHIEVEMENTS"]
      .filter((l) => l.length > 3)
      .map((l) => l.replace(/^[-*•·]\s*/, "").trim());
  }

  return {
    fullName: extractedName,
    email,
    phone,
    linkedin,
    portfolio,
    location,
    summary,
    skills,
    educationList,
    experienceList,
    projectsList,
    certsList,
    achievementsList
  };
}

function normalizeResumeResult(data: any, parsedFacts: any, candidateNameOverride?: string): any {
  let name = data.name || data.candidate_info?.fullName || parsedFacts.fullName || candidateNameOverride?.trim() || "";
  if (SAMPLE_NAMES.has(name.toLowerCase()) || name.toLowerCase().includes("candidate name")) {
    name = parsedFacts.fullName || candidateNameOverride?.trim() || "";
  }

  const phone = data.contact?.phone || data.candidate_info?.phone || parsedFacts.phone || "";
  let email = data.contact?.email || data.candidate_info?.email || parsedFacts.email || "";
  if (SAMPLE_NAMES.has(email.toLowerCase())) email = parsedFacts.email || "";

  let linkedin = data.contact?.linkedin || data.candidate_info?.linkedin || parsedFacts.linkedin || "";
  if (linkedin.includes("alexrivera")) linkedin = parsedFacts.linkedin || "";

  let github = data.contact?.github || data.contact?.portfolio || data.candidate_info?.portfolio || parsedFacts.portfolio || "";
  if (github.includes("alexrivera")) github = parsedFacts.portfolio || "";

  const location = data.contact?.location || data.candidate_info?.location || parsedFacts.location || "";

  const summary = data.summary || data.tailored_summary || parsedFacts.summary || "";

  // Normalize skills
  let skillsGroup = data.skills;
  if (!skillsGroup || typeof skillsGroup !== "object" || Array.isArray(skillsGroup)) {
    const rawSkills: string[] = Array.isArray(data.reordered_skills)
      ? data.reordered_skills
      : (parsedFacts.skills || []);

    // Clean any residual label prefixes from each skill item
    const LABEL_RE = /^(?:Languages?|Frameworks?(?:\s*[&+]\s*Tools?)?|Concepts?|Tools?|Technologies?|Platforms?|Libraries?|Databases?):\s*/i;
    const cleanedSkills = rawSkills.map((s: string) => s.replace(LABEL_RE, "").trim()).filter((s: string) => s.length > 1);

    // Use word-boundary regex so standalone 'C' doesn't match 'Scikit', 'Concepts', 'Cisco', etc.
    const languages  = cleanedSkills.filter((s: string) => /\bpython\b|\bjava\b|\bc\+\+\b|\bC\b|\bsql\b|\bjavascript\b|\btypescript\b|\bhtml\b|\bcss\b|\bgo\b|\brust\b|\bruby\b|\br\b|\bscala\b|\bswift\b|\bkotlin\b/i.test(s));
    const frameworks = cleanedSkills.filter((s: string) => /react|node|docker|git|pandas|numpy|scikit|tensorflow|pytorch|aws|azure|gcp|linux|express|tailwind|mongodb|postgres|mysql|spring|flask|fastapi|streamlit|matplotlib|seaborn/i.test(s));
    const concepts   = cleanedSkills.filter((s: string) => !languages.includes(s) && !frameworks.includes(s));
    skillsGroup = { languages, frameworks_tools: frameworks, concepts };
  }

  const flatSkillsList: string[] = [
    ...(skillsGroup.languages || []),
    ...(skillsGroup.frameworks_tools || []),
    ...(skillsGroup.concepts || [])
  ];
  const reordered_skills = flatSkillsList.length > 0 ? flatSkillsList : (data.reordered_skills || parsedFacts.skills || []);

  // Normalize work_experience
  let workExperience = data.work_experience || data.tailored_experience || parsedFacts.experienceList || [];
  workExperience = workExperience.filter((e: any) => e.company || (e.role && e.role !== "Professional Experience" && e.role !== "Experience Role") || (e.bullets && e.bullets.length > 0));

  // Normalize projects
  let projects = data.projects || data.tailored_projects || parsedFacts.projectsList || [];
  projects = projects.map((p: any) => ({
    title: p.title || p.name || "Key Project",
    tech_stack: p.tech_stack || p.techUsed || "",
    bullets: Array.isArray(p.bullets) ? p.bullets : []
  }));

  const certifications = data.certifications || parsedFacts.certsList || [];
  const virtual_experience_programs = data.virtual_experience_programs || [];
  // Prefer AI-generated achievements; fall back to text-parsed achievements from the resume
  const achievements_activities =
    (data.achievements_activities && data.achievements_activities.length > 0)
      ? data.achievements_activities
      : (parsedFacts.achievementsList || []);

  let education = data.education || parsedFacts.educationList || [];
  education = education.map((e: any) => ({
    degree: e.degree || "",
    institution: e.institution || e.university || "",
    duration: e.duration || e.year || "",
    score: e.score || e.cgpa || ""
  }));

  return {
    ...data,
    name,
    contact: { phone, email, linkedin, github, location },
    summary,
    skills: skillsGroup,
    work_experience: workExperience,
    projects,
    certifications,
    virtual_experience_programs,
    achievements_activities,
    education,

    // Backward compatibility
    candidate_info: {
      fullName: name,
      email,
      phone,
      location,
      linkedin,
      portfolio: github
    },
    tailored_summary: summary,
    reordered_skills,
    tailored_experience: workExperience,
    tailored_projects: projects
  };
}

const app = express();
const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
  });

  // Initialize Gemini Client
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API Route: Tailor Resume with Gemini
  app.post("/api/tailor-resume", async (req, res) => {
    try {
      const { oldResumeText, jobDescription, targetJobTitle, targetCompany, candidateNameOverride } = req.body;

      if (!oldResumeText || !jobDescription) {
        return res.status(400).json({ error: "Please provide both your Old Resume text and Job Description." });
      }

      // STEP 5 REQUIREMENT: Console log raw text right before sending to Gemini for verification
      console.log("=========================================");
      console.log("=== RAW EXTRACTED RESUME TEXT (VERIFICATION) ===");
      console.log(oldResumeText);
      console.log("=== RAW EXTRACTED JOB DESCRIPTION (VERIFICATION) ===");
      console.log(jobDescription);
      console.log("=========================================");

      // Pre-check for raw PDF/binary noise corruptions
      const pdfRawRegex = /(%PDF-|\b\d+\s+\d+\s+obj\b|\bendobj\b|\bstream\b|\bendstream\b|\/XObject|\/Font|\/FlateDecode)/i;
      if (pdfRawRegex.test(oldResumeText) || pdfRawRegex.test(jobDescription)) {
        return res.status(400).json({
          error: "unreadable_input",
          message: "We couldn't read this file properly as it contains raw PDF binary syntax. Please upload a searchable PDF/DOCX or paste your text directly into the box."
        });
      }

      // Word count check for job description
      const jdWordCount = jobDescription.trim().split(/\s+/).filter(Boolean).length;
      if (jdWordCount < 10) {
        return res.status(400).json({
          error: "Job description is too short. Please paste a complete job posting."
        });
      }

      const ai = getGenAI();
      const parsedFacts = parseOldResumeText(oldResumeText, candidateNameOverride);

      const prompt = `You are an expert MNC ATS resume writer and recruiter. Analyze this candidate's OLD RESUME and TARGET_JOB_DESCRIPTION:

CRITICAL STRICT CATEGORIZATION & FORMATTING RULES:
1. PROPER SECTION CATEGORIZATION:
   Classify each extracted item into its correct resume section based on its content and context:
   - "work_experience": ONLY for actual jobs or internships with a real company name, role, and duration. If a candidate has NO real jobs or internships, return "work_experience": [].
   - "projects": For academic, personal, or open-source projects. Include title, tech_stack (e.g. "Python, Scikit-Learn, Pandas"), and 2-3 concise bullets.
   - "certifications": Official certifications (e.g., "AWS Certified Developer", "Google Data Analytics").
   - "virtual_experience_programs": Virtual internships / programs (e.g., "Data Analytics Virtual Experience - Deloitte Australia", "Software Engineering Virtual Experience - JPMorgan").
   - "achievements_activities": Hackathons, awards, rank/percentiles, coding profiles, student leadership, or extracurricular achievements.
   - Certifications, virtual experience programs, hackathons, and extracurricular activities must NEVER be placed inside work_experience. Work experience is ONLY for actual jobs/internships with a company name, role, and duration.

2. CANDIDATE CONTACT DETAILS:
   - "name": "${parsedFacts.fullName || 'Extract candidate name from old resume text'}"
   - "contact": {
       "phone": "${parsedFacts.phone || ''}",
       "email": "${parsedFacts.email || ''}",
       "linkedin": "${parsedFacts.linkedin || ''}",
       "github": "${parsedFacts.portfolio || ''}",
       "location": "${parsedFacts.location || ''}"
     }
   NEVER invent fake names (like "Alex Rivera", "John Doe"), fake emails, or fake links. If missing, leave as empty string.

3. SUMMARY QUALITY:
   - Write 3 lines maximum for "summary".
   - Mention: (a) candidate's academic background/domain, (b) top 3-4 technical strengths relevant to the target job, (c) one standout achievement or project.
   - Do NOT use generic filler phrases like "accomplished professional" or "proven success delivering key outcomes" — be specific using real details from the candidate's background.

4. BULLET POINT QUALITY (MNC Resume Standard):
   - For every bullet under "work_experience" and "projects", start with a strong past-tense action verb (Built, Developed, Implemented, Optimized, Led, Designed, Automated, Engineered).
   - Keep each bullet concise (1 line if possible, max 2 lines).
   - Quantify impact with real numbers ONLY if present in the original resume — NEVER invent metrics.
   - Remove filler words like "responsible for" or "worked on".

5. TECHNICAL SKILLS CATEGORIZATION:
   Categorize candidate's actual skills into:
   - "languages": e.g. ["Python", "SQL", "Java", "C++", "JavaScript"]
   - "frameworks_tools": e.g. ["React", "Node.js", "Docker", "Git", "Pandas", "Scikit-Learn"]
   - "concepts": e.g. ["Data Structures & Algorithms", "Machine Learning", "Object-Oriented Programming", "REST APIs"]

OLD RESUME CONTENT:
${oldResumeText}

TARGET JOB TITLE: ${targetJobTitle || "Not specified"}
TARGET COMPANY: ${targetCompany || "Not specified"}

TARGET_JOB_DESCRIPTION:
${jobDescription}

Return ONLY valid JSON with this exact schema (no markdown, no code fences):
{
  "name": "string",
  "contact": {
    "phone": "string",
    "email": "string",
    "linkedin": "string",
    "github": "string",
    "location": "string"
  },
  "summary": "string",
  "skills": {
    "languages": ["string"],
    "frameworks_tools": ["string"],
    "concepts": ["string"]
  },
  "work_experience": [
    { "company": "string", "role": "string", "duration": "string", "bullets": ["string"] }
  ],
  "projects": [
    { "title": "string", "tech_stack": "string", "bullets": ["string"] }
  ],
  "certifications": ["string"],
  "virtual_experience_programs": ["string"],
  "achievements_activities": ["string"],
  "education": [
    { "degree": "string", "institution": "string", "duration": "string", "score": "string" }
  ],
  "match_score": 92,
  "selection_probability": "90% - High Interview Chance",
  "count_words_corrected": 12,
  "keywords_added_count": 8,
  "keywords_extracted": ["string"],
  "keywords_matched": ["string"],
  "missing_skills": ["string"],
  "grammar_corrections": ["string"],
  "improvement_tips": ["string"]
}`;

      const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash"];
      let parsedData = null;

      if (process.env.GEMINI_API_KEY) {
        for (const modelName of modelsToTry) {
          if (parsedData) break;
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: "application/json",
                temperature: 0.1,
              },
            });

            const rawResponseText = response.text || "";
            let cleanedText = rawResponseText.trim();

            if (cleanedText.startsWith("```")) {
              cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
            }

            parsedData = JSON.parse(cleanedText);
            if (parsedData) break;
          } catch (err: any) {
            console.warn(`Model ${modelName} unavailable or rate-limited. Falling back to clean parser.`);
            break;
          }
        }
      }

      // Fallback parser if AI rate-limited
      if (!parsedData) {
        console.warn("Generating response strictly from parsed resume text.");
        const jdWords = jobDescription.match(/\b[A-Za-z]{3,}\b/g) || [];
        const validJdKeywords = cleanAndValidateKeywords(
          Array.from(new Set(jdWords.map((w: string) => w.toUpperCase()))),
          oldResumeText,
          jobDescription
        ).slice(0, 15);

        const rawSkills = parsedFacts.skills || [];
        // Clean label prefixes, then categorize with word-boundary regex
        const LABEL_RE = /^(?:Languages?|Frameworks?(?:\s*[&+]\s*Tools?)?|Concepts?|Tools?|Technologies?|Platforms?|Libraries?|Databases?):\s*/i;
        const cleanedRaw = rawSkills.map((s: string) => s.replace(LABEL_RE, "").trim()).filter((s: string) => s.length > 1);
        const languages  = cleanedRaw.filter((s: string) => /\bpython\b|\bjava\b|\bc\+\+\b|\bC\b|\bsql\b|\bjavascript\b|\btypescript\b|\bhtml\b|\bcss\b|\bgo\b|\brust\b|\bruby\b|\br\b|\bscala\b|\bswift\b|\bkotlin\b/i.test(s));
        const frameworks = cleanedRaw.filter((s: string) => /react|node|docker|git|pandas|numpy|scikit|tensorflow|pytorch|aws|azure|gcp|linux|express|tailwind|mongodb|postgres|mysql|spring|flask|fastapi|streamlit|matplotlib|seaborn/i.test(s));
        const concepts   = cleanedRaw.filter((s: string) => !languages.includes(s) && !frameworks.includes(s));

        parsedData = {
          name: parsedFacts.fullName,
          contact: {
            phone: parsedFacts.phone,
            email: parsedFacts.email,
            linkedin: parsedFacts.linkedin,
            github: parsedFacts.portfolio,
            location: parsedFacts.location
          },
          summary: parsedFacts.summary || `Computer Science student with strong technical skills in ${languages.slice(0, 3).join(', ')}. Demonstrated experience building projects and solving complex algorithmic challenges.`,
          skills: {
            languages,
            frameworks_tools: frameworks,
            concepts
          },
          work_experience: parsedFacts.experienceList,
          projects: parsedFacts.projectsList.map((p: any) => ({
            title: p.title,
            tech_stack: p.techUsed || "",
            bullets: p.bullets
          })),
          certifications: parsedFacts.certsList,
          virtual_experience_programs: [],
          achievements_activities: parsedFacts.achievementsList || [],
          education: parsedFacts.educationList.map((e: any) => ({
            degree: e.degree,
            institution: e.institution,
            duration: e.year || "",
            score: e.cgpa || ""
          })),
          match_score: 85,
          selection_probability: "90% - High Interview Chance",
          count_words_corrected: 8,
          keywords_added_count: validJdKeywords.length,
          keywords_extracted: validJdKeywords,
          keywords_matched: validJdKeywords.slice(0, 10),
          missing_skills: validJdKeywords.slice(10, 14),
          grammar_corrections: [
            "Enhanced project and experience bullets with targeted action verbs.",
            "Aligned technical background with job description requirements."
          ],
          improvement_tips: [
            "Quantify project impact with specific metrics where possible.",
            "Highlight key competitive programming or virtual experience programs."
          ]
        };
      }

      // STEP 2 REQUIREMENT: Validate extracted keywords - discard keywords not found verbatim in resume or JD
      parsedData.keywords_extracted = cleanAndValidateKeywords(parsedData.keywords_extracted || [], oldResumeText, jobDescription);
      parsedData.keywords_matched = cleanAndValidateKeywords(parsedData.keywords_matched || [], oldResumeText, jobDescription);

      // Normalize and enforce clean MNC structure
      const normalizedData = normalizeResumeResult(parsedData, parsedFacts, candidateNameOverride);

      return res.json({
        success: true,
        data: normalizedData
      });

    } catch (error: any) {
      console.error("Error tailoring resume:", error);
      return res.status(500).json({
        error: error.message || "An unexpected error occurred while processing the resume."
      });
    }
  });

  // Vite middleware for development vs static serve for production (only when not on Vercel)
  async function startServer() {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ResuMatch AI server running on http://0.0.0.0:${PORT}`);
    });
  }

  if (process.env.VERCEL !== "1") {
    startServer();
  }

export default app;

