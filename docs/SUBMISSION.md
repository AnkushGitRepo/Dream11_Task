# SUBMISSION.md — draft (finalise in Phase 5)

## Note (≤ 200 words — currently ~170; update tools/model names to what you actually used)

**Problem.** Fans constantly miss moments mid-match: an ad break, a chai run, a stream running balls behind, or joining late.
Catching up means scrolling ball-by-ball in an English score app while the next over is already being bowled.
And a fast-growing share of fans follow cricket in Hindi, Gujarati or Hinglish, not English stats.

**Solution.** *Kya Hua?* is a second-screen companion. When you come back, it shows "You missed 14 balls" — one tap
gives a 10-second recap of exactly that gap in English, Hinglish, हिंदी or ગુજરાતી, and reads it aloud.
Then you can ask the match anything by voice ("Kitne runs chahiye?"). The demo replays a real match ball-by-ball as if live.

**Trust.** Every number is computed in code from Cricsheet ball-by-ball data. The AI only writes the sentence, and a
number check replaces any reply containing a number that isn't in the stats. The core is sport-agnostic, so football and kabaddi plug in as adapters.

**AI tools.** Google Gemini Flash (via Gemini API) for recaps and answers · Web Speech API for voice in/out ·
[Claude Code / Gemini CLI — whichever you actually used] as coding agents.

## Loom script (60–90 s)
1. (0–10s) "TV's on, I step away for two overs." Replay: IND v PAK, T20 WC 2022, India need 48 off 18. Lock phone / switch app.
2. (10–25s) Come back → "You missed 14 balls" → Catch me up in Hinglish → tap Listen.
3. (25–40s) Switch to Gujarati → same recap. Tap "Verified stats" → explain numbers-by-code.
4. (40–60s) Mic: "Rauf ke kitne overs bache?" → spoken answer.
5. (60–80s) Desktop: two-column layout; "built sport-agnostic — football is an adapter away."
