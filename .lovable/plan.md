

# Plan: Adopt Studyond Repository Guidelines

## Summary

Extract and read the provided Studyond starter repo, then update the app's branding, mock data, and structure to match their official guidelines.

## Step 1 — Extract and read the zip

Copy the zip to the project workspace, extract it, and read the key files:
- `README.md` — overall instructions and challenge brief
- `brand/colors.md` — official color palette
- `brand/typography.md` — font choices
- `brand/components.md` + `brand/components.json` — component style guidelines
- `brand/app.css` — their CSS variables and theme
- `brand/ai-integration.md` — how AI should be integrated
- `brand/studyond.svg` — logo
- `brand/examples/` — reference component examples
- `context/Challenge Brief.md` — hackathon requirements
- `context/Platform Overview.md` — product description
- `context/Students.md`, `Experts.md`, `Supervisors.md`, `Companies.md`, `Topics.md`, `Fields.md`, `Study Programs.md` — mock data specs
- `context/Color System.md`, `context/Component Guidelines.md` — additional design specs

## Step 2 — Update branding and theme

Based on the extracted brand files:
- Update `src/index.css` with Studyond's official CSS variables (colors, fonts, spacing)
- Update `tailwind.config.ts` if new color tokens are needed
- Replace the text logo in `AppSidebar.tsx` with the actual SVG logo from `brand/studyond.svg`
- Update `index.html` title and meta tags to say "Studyond"

## Step 3 — Update mock data

Replace or enrich existing mock data files to match Studyond's official data specs:
- `mockTopics.ts`, `mockExperts.ts`, `mockStudents.ts`, `mockSupervisors.ts`, `mockCompanies.ts`, `mockStudyPrograms.ts`, `mockJobs.ts`
- Update fields, tags, and data structures if the repo specifies different schemas

## Step 4 — Align UI components

Based on `brand/components.md` and example files:
- Adjust card styles, spacing, and interaction patterns
- Update the AI chat integration if `brand/ai-integration.md` specifies a different approach
- Apply any motion/animation guidelines from the context docs

## Step 5 — Update AI system prompt

Update `supabase/functions/chat/index.ts` to incorporate Studyond's official product context from the repo's context documents, replacing the current generic descriptions.

## Technical Notes

- The zip must be extracted using a shell command before files can be read
- The SVG logo will be copied to `src/assets/` and imported as an ES module
- CSS variable changes will cascade through all existing components via the theme system
- No structural route changes expected unless the challenge brief specifies different pages

