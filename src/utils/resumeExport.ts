import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { MasterResumeData, TailoredResumeResult } from '../types';

function cleanText(value?: string): string {
  return value?.trim() || '';
}

function toTextRuns(value: string, bold = false): TextRun[] {
  return [new TextRun({ text: value, bold })];
}

function addSectionHeading(title: string): Paragraph {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 180, after: 80 },
    border: {
      bottom: {
        color: 'D1D5DB',
        size: 6,
        space: 1,
        style: BorderStyle.SINGLE,
      },
    },
  });
}

function addBullet(text: string): Paragraph {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { before: 0, after: 0 },
  });
}

function formatDateRange(startDate?: string, endDate?: string): string {
  const parts = [startDate?.trim(), endDate?.trim()].filter(Boolean);
  return parts.join(' – ');
}

function formatCertificationLine(entry: { name: string; organization: string; year?: string }): string {
  return [entry.name, entry.organization, entry.year].filter(Boolean).join(' | ');
}

function addContactLine(result: TailoredResumeResult): Paragraph | null {
  const contactParts = [
    cleanText(result.contact?.location),
    cleanText(result.contact?.phone),
    cleanText(result.contact?.email),
    cleanText(result.contact?.linkedin),
    cleanText(result.contact?.github),
  ].filter(Boolean);

  if (contactParts.length === 0) {
    return null;
  }

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: contactParts.join(' | '), size: 18 })],
  });
}

export async function exportResumeToDocx(result: TailoredResumeResult, filename = 'ATS_Resume.docx', masterResume?: MasterResumeData): Promise<boolean> {
  try {
    const sections: Paragraph[] = [];

    if (cleanText(result.name)) {
      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: cleanText(result.name), bold: true, size: 30 })],
        })
      );
    }

    const contactLine = addContactLine(result);
    if (contactLine) {
      sections.push(contactLine);
    }

    if (cleanText(result.summary)) {
      sections.push(addSectionHeading('Professional Summary'));
      sections.push(new Paragraph({ text: cleanText(result.summary), spacing: { after: 80 } }));
    }

    const skillLines: Paragraph[] = [];
    const languages = result.skills?.languages?.filter(Boolean) || [];
    const frameworks = result.skills?.frameworks_tools?.filter(Boolean) || [];
    const concepts = result.skills?.concepts?.filter(Boolean) || [];

    if (languages.length || frameworks.length || concepts.length) {
      sections.push(addSectionHeading('Technical Skills'));
      if (languages.length) {
        skillLines.push(new Paragraph({ children: [...toTextRuns('Languages: ', true), new TextRun(languages.join(', '))], spacing: { after: 0 } }));
      }
      if (frameworks.length) {
        skillLines.push(new Paragraph({ children: [...toTextRuns('Frameworks & Tools: ', true), new TextRun(frameworks.join(', '))], spacing: { after: 0 } }));
      }
      if (concepts.length) {
        skillLines.push(new Paragraph({ children: [...toTextRuns('Concepts: ', true), new TextRun(concepts.join(', '))], spacing: { after: 0 } }));
      }
      sections.push(...skillLines);
    }

    const workExperience = masterResume?.workExperience?.length
      ? masterResume.workExperience.map((entry) => ({
          role: entry.jobTitle,
          company: entry.company,
          duration: formatDateRange(entry.startDate, entry.endDate),
          bullets: entry.bullets,
        }))
      : result.work_experience || [];

    const projects = masterResume?.projects?.length
      ? masterResume.projects.map((project) => ({
          title: project.name,
          tech_stack: project.technologies,
          bullets: project.bullets,
        }))
      : result.projects || [];

    const education = masterResume?.education?.length
      ? masterResume.education.map((entry) => ({
          degree: entry.degree,
          institution: entry.institution,
          duration: entry.year,
          score: entry.score,
          cgpa: entry.cgpa,
        }))
      : result.education || [];

    const certifications = masterResume?.certifications?.length
      ? masterResume.certifications.map((entry) => formatCertificationLine(entry))
      : result.certifications || [];

    if (workExperience.length) {
      sections.push(addSectionHeading('Work Experience'));
      workExperience.forEach((entry) => {
        sections.push(
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text: entry.role, bold: true }),
              new TextRun({ text: entry.company ? ` | ${entry.company}` : '' }),
              new TextRun({ text: entry.duration ? ` | ${entry.duration}` : '' }),
            ],
          })
        );
        entry.bullets?.forEach((bullet) => sections.push(addBullet(cleanText(bullet))));
      });
    }

    if (projects.length) {
      sections.push(addSectionHeading('Projects'));
      projects.forEach((project) => {
        const techStack = cleanText(project.tech_stack || project.techUsed);
        sections.push(
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: project.title, bold: true }), new TextRun({ text: techStack ? ` | ${techStack}` : '' })],
          })
        );
        project.bullets?.forEach((bullet) => sections.push(addBullet(cleanText(bullet))));
      });
    }

    if (education.length) {
      sections.push(addSectionHeading('Education'));
      education.forEach((entry) => {
        const schoolLine = [cleanText(entry.institution), cleanText(entry.duration || entry.year)].filter(Boolean).join(' — ');
        if (schoolLine) {
          sections.push(new Paragraph({ text: schoolLine, spacing: { after: 0 } }));
        }
        if (cleanText(entry.degree)) {
          sections.push(new Paragraph({ text: cleanText(entry.degree), spacing: { after: 0 } }));
        }
        if (cleanText(entry.score || entry.cgpa)) {
          sections.push(new Paragraph({ text: `CGPA: ${cleanText(entry.score || entry.cgpa)}`, spacing: { after: 20 } }));
        }
      });
    }

    if (certifications.length) {
      sections.push(addSectionHeading('Certifications'));
      certifications.forEach((certification) => {
        sections.push(new Paragraph({ text: cleanText(certification), spacing: { before: 0, after: 0 } }));
      });
    }

    const document = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                bottom: 720,
                left: 720,
                right: 720,
              },
            },
          },
          children: sections,
        },
      ],
    });

    const blob = await Packer.toBlob(document);
    const url = URL.createObjectURL(blob);
    const anchor = documentCreateAnchor(url, filename);
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (error) {
    console.error('Error exporting DOCX:', error);
    return false;
  }
}

function documentCreateAnchor(url: string, filename: string): HTMLAnchorElement {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.addEventListener('click', () => {
    setTimeout(() => anchor.remove(), 0);
  });
  return anchor;
}
