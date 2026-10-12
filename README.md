# kya hua?

**Stepped away from the match? Get caught up in 10 seconds — in your language.**

A mobile-first, second-screen AI companion for live sports. One tap recaps exactly what you missed
(English, Hinglish, हिंदी, ગુજરાતી), reads it aloud, and answers your questions about the match — by text or voice.
Every number is computed from ball-by-ball data; the AI only writes the sentences.

> Prototype for the Dream11 Forward Deployed Engineer Intern assessment. Not affiliated with Dream11.

## Quick start
```bash
nvm use            # Node 20
npm install
cp .env.example .env.local   # add GEMINI_API_KEY (or set LLM_PROVIDER=none for template-only mode)
npm run dev        # frontend with mock API
npm run dev:full   # frontend + /api via vercel dev
```

## Docs
| Doc | What |
|---|---|
| [PRD](docs/PRD.md) | Problem, users, features, acceptance criteria |
| [Architecture](docs/ARCHITECTURE.md) | System, data model, sport adapters, APIs, AI pipeline |
| [Design system](docs/DESIGN.md) | Tokens, type, components, motion, a11y |
| [Design prompt](docs/DESIGN_PROMPT.md) | Page-by-page frontend build spec |
| [Security](docs/SECURITY.md) | Threat model, API rules, headers, checklist |
| [Testing](docs/TESTING.md) | Strategy, golden tests, E2E, device checklist |
| [Phases](docs/PHASES.md) · [Roadmap](docs/ROADMAP.md) · [TODO](TODO.md) | Plan |

## AI coding agents
`AGENTS.md` is the canonical instruction file. `CLAUDE.md` and `GEMINI.md` import it.
Project memory lives in `docs/context/STATE.md` (auto-injected into Claude Code by a SessionStart hook; `/status` in Gemini CLI).
Use `/next` to build the next task and `/checkpoint` to save progress.

## Data
Ball-by-ball data from [Cricsheet](https://cricsheet.org), licensed under ODC-BY 1.0.
