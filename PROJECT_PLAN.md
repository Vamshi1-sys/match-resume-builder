# ResuMatch AI — Project Plan

## 1. Current architecture

- Backend: Express server implemented in `server.ts` (TypeScript). Dev start uses `tsx server.ts` (see `package.json` "dev" script).
- Frontend: React + Vite (TypeScript). Entry: `src/main.tsx` → `src/App.tsx`.
- AI integration: `@google/genai` used in `server.ts` to call Gemini models (optional, requires `GEMINI_API_KEY`).
- PDF export: client-side export utility present (`src/utils/pdfExport.ts`).
- File parsing: resume & JD file extraction utilities in `src/utils/fileExtractor.ts` (handles PDF/DOCX/TXT via `mammoth`/`pdfjs` etc.).
- UI: Single-page React app with modular components in `src/components/`.

## 2. Existing files (inventory)

Root
- package.json
- server.ts
- index.html
- vite.config.ts
- tsconfig.json
- README.md
- .env, .env.example
- metadata.json

Node modules & build
- node_modules/
- bun.lock, package-lock.json

Frontend (`src/`)
- `src/main.tsx` (React bootstrap)
- `src/App.tsx` (app shell, routes between generator/profile/results)
- `src/index.css`
- `src/types.ts`
- `src/components/`
  - `Header.tsx`
  - `JobDescriptionForm.tsx`
  - `LandingPage.tsx`
  - `ProfileForm.tsx`
  - `ResultsView.tsx`
  - `ResumeGeneratorForm.tsx`
  - `ResumePreview.tsx`
- `src/utils/`
  - `fileExtractor.ts` (file -> text extraction)
  - `pdfExport.ts` (PDF export helper)
  - `sampleProfile.ts`

Backend
- `server.ts` (Express + Vite middleware + /api/tailor-resume endpoint that calls Gemini or falls back to local heuristics)

Assets
- `assets/.aistudio/` (project-specific assets)

## 3. Current framework / language

- Full-stack TypeScript project:
  - Frontend: React + Vite (TypeScript)
  - Backend: Node (Express) written in TypeScript and executed with `tsx`

## 4. Entry points

- Dev start (backend + frontend via Vite middleware): `npm run dev` which executes `tsx server.ts`.
- Backend entry: `server.ts` (starts Express and mounts Vite middleware in dev).
- Frontend entry: `src/main.tsx` (mounts React App into `index.html`).

## 5. Existing UI components

Located in `src/components/`:
- `Header.tsx` — top navigation and routing control
- `JobDescriptionForm.tsx` — JD paste/validation UI (used by alternate flow)
- `ResumeGeneratorForm.tsx` — main UI to paste/upload resume and JD and start tailoring
- `ProfileForm.tsx` — candidate master profile editor & localStorage save
- `ResultsView.tsx` — displays tailored resume, ATS score summary, and provides PDF download
- `ResumePreview.tsx` — printable ATS-friendly resume template preview
- `LandingPage.tsx` — marketing/landing UI

## 6. Existing dependencies (from `package.json`)

Key runtime dependencies:
- `@google/genai` — Gemini AI client
- `express` — backend server
- `react`, `react-dom`, `vite`, `@vitejs/plugin-react`
- `mammoth` — DOCX -> text extraction
- `pdfjs-dist` — PDF text extraction/processing
- `html2pdf.js` — client-side HTML → PDF export
- `lucide-react`, `tailwindcss`, `@tailwindcss/vite`, `autoprefixer` — UI icons & styling
- `esbuild`, `tsx`, `typescript` — dev tooling / build helpers

Dev dependencies include TypeScript types and build tools.

## 7. PDF / DOCX generation status

- PDF: Implemented — `src/utils/pdfExport.ts` and `ResultsView` has `Download PDF` using that util. Client-side printing/export is working (tested via `Invoke-RestMethod` returned app HTML earlier).
- DOCX: NOT implemented. There is no DOCX export utility or button. `mammoth` is used for DOCX->text extraction, but no reverse DOCX generation.

## 8. AI / API integration status

- Server-side integration to Google Gemini exists in `server.ts` using `@google/genai`.
- Endpoint `/api/tailor-resume` is implemented and returns structured JSON (either from the model or a fallback parser). This forms the core resume tailoring pipeline.

## 9. What needs to be added for a full ATS Resume Builder (high level)

Mandatory additions:
- Editable resume editor in the `ResultsView` (inline edit of name, contact, summary, skills, each experience bullet). Provide Add/Edit/Delete/Move Up/Move Down controls.
- Persist edited resume state in client (in-memory + optional localStorage) so edits survive navigation until user downloads.
- DOCX export utility (server-side or client-side) that converts the ATS HTML into a DOCX file. Add `docx` or server endpoint that builds DOCX and returns it.
- Detailed JD analysis panel showing categorized keywords (Technical, Cloud, Security, Tools, Languages, Responsibilities, Qualifications, Soft Skills, Preferred, Nice-to-have) and marking `Matched`, `Partial`, `Missing/Review`.
- Regeneration actions (Regenerate Summary, Regenerate Skills, Regenerate Experience, Improve Bullet) that call a targeted backend AI endpoint with narrow prompts.
- Transparent ATS scoring breakdown UI (show component scores and how the final score was calculated). Implement scoring algorithm on backend or client in a deterministic way.
- Additional backend endpoints for targeted alterations (e.g., `/api/regenerate-summary`, `/api/regenerate-bullets`) or extend `/api/tailor-resume` with action flags.
- DOCX export endpoint (e.g., `/api/export-docx`) or client-side implementation using `docx` + `file-saver`.
- Resume editor controls: Add Experience, Add Project, Add Certification, move, delete controls.
- Unit / integration tests for parsing, matching, and export flows.

Security & operations:
- Validate and rate-limit AI calls; avoid leaking API keys. Ensure `.env` usage and documentation.
- Add server-side error handling and clearer fallback paths if Gemini is rate-limited.

Optional / nice-to-have:
- Server-side resume templates for multi-format exports (clean ATS vs. stylized PDF).
- Server-side caching of analysis results for repeated JDs.
- Shareable job-application packaging (cover letter + tailored resume bundle).

## 10. Recommended architecture / folder map

Keep the current structure but add these modules:

backend/
- services/
  - jdParser.ts (JD parsing & keyword categorization)
  - skillMatcher.ts (matching logic and scoring)
  - resumeTailor.ts (targeted prompt generation wrappers)
  - docxExport.ts (server-side DOCX builder — optional)
- routes/
  - tailor.ts (existing /api/tailor-resume)
  - regenerate.ts (regenerate endpoints)
  - export.ts (DOCX export endpoint)

frontend/
- components/
  - ResumeEditor.tsx (new editable resume UI)
  - KeywordAnalysisPanel.tsx
  - ATSScoreBreakdown.tsx
  - RegenerateControls.tsx
- utils/
  - docxExportClient.ts (if client-side DOCX)
  - scoring.ts

data/
- skills.json (canonical skill categories)
- actionVerbs.json
- resumeRules.json

templates/
- ats/ — HTML/CSS templates for ATS-friendly resume

tests/
- backend/unit
- frontend/components

## 11. Implementation phases (incremental)

Phase 1 — UI & Editing (small, non-breaking)
- Add `ResumeEditor` component integrated into `ResultsView`.
- Keep existing `ResumePreview` and `Download PDF` behavior unchanged.
- Persist edits in local state and offer "Save" within session.
- Add UI controls for Add/Edit/Delete/Move experience bullets and entries.

Phase 2 — DOCX Export
- Add client-side or server-side DOCX generation and a `Download DOCX` button.
- Ensure exported DOCX preserves ATS-friendly structure and plain text.

Phase 3 — JD Analysis Panel
- Add `KeywordAnalysisPanel` to show categorized keywords and matched/missing lists.
- Compute and display transparent sub-scores.

Phase 4 — Regeneration Actions
- Add regenerate endpoints (or extend existing endpoint) to request targeted rewrites from Gemini.
- Implement UI controls in `ResultsView` to trigger these actions and replace specific sections.

Phase 5 — Scoring & Quality Checks
- Implement deterministic scoring algorithm and display breakdown.
- Add formatting & resume quality checks (contact info, summary length, bullets count).

Phase 6 — Tests, Rate-limits, and Polishing
- Add unit tests, end-to-end checks, and polish UX.

## 12. Dependencies to add

Recommended additions:
- `docx` (for DOCX generation client/server)
- `file-saver` (if generating DOCX in-browser)
- `jszip` (if packaging multiple files into a zip)
- `react-contenteditable` or write small controlled contenteditable UI for inline editing
- (Optional) `helmet`, `express-rate-limit` for server hardening

## 13. Data flow (high-level)

1. User pastes JD and old resume (or uploads files). File extractor (`src/utils/fileExtractor.ts`) converts uploaded DOCX/PDF → plain text.
2. Frontend posts `oldResumeText`, `jobDescription` to `/api/tailor-resume`.
3. Backend `server.ts` parses resume text (`parseOldResumeText`), optionally calls Gemini via `@google/genai` with a strict prompt and JSON schema, or uses fallback parser.
4. Backend returns normalized JSON with `skills`, `work_experience`, `projects`, `education`, `match_score`, `keywords_extracted`, `keywords_matched`, `missing_skills`, etc.
5. Frontend displays `ResultsView` and `ResumePreview` using returned structured data.
6. User edits the generated resume in `ResumeEditor` (new). Edits update local resume model.
7. User requests `Download PDF` (existing) or `Download DOCX` (to be implemented). DOCX generator builds a .docx and returns/saves to the client.
8. Optional: User requests regeneration of a section → frontend POSTs to `/api/regenerate-*` endpoints → backend calls Gemini with narrow prompt and returns updated portion.

---

## 14. Next action I will take (with your confirmation)

I will now create this `PROJECT_PLAN.md` file in the project root (done). When you confirm, I will start Phase 1 by adding a `ResumeEditor` component and wiring it into `ResultsView` while preserving current PDF export behavior.

---

_File created: PROJECT_PLAN.md_
