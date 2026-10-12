---
description: Pre-submission checklist — build, tests, security, mobile, demo readiness.
---
Run and report pass/fail for each:
1. `npm run lint` · `npm run test` · `npm run build` (report bundle sizes of the largest chunks).
2. `npm run test:e2e` (mobile + desktop projects).
3. `reviewer` subagent on the full `src/`, `api/`, `shared/` (BLOCKERs only).
4. Grep for `TODO|FIXME|console.log|dangerouslySetInnerHTML|VITE_.*KEY` in src/ api/ shared/.
5. Confirm `.env` is git-ignored and `vercel.json` sets security headers (docs/SECURITY.md §Headers).
6. Walk docs/PRD.md acceptance criteria F1–F8 and mark each ✅/❌ with evidence.
7. Demo readiness: replay works with no API key (template fallback), recap < 3s, voice hidden where unsupported.
End with GO / NO-GO and the shortest list of fixes for a GO.
