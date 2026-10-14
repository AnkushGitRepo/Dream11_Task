// Smoke test for a deployed build: POSTs a valid body to every /api function and reports the
// HTTP status plus whether the answer came from the model ("ai") or the deterministic template.
//
//   npm run smoke:prod -- https://your-app.vercel.app
//
// Exit code 1 if any endpoint answers non-200. Override the match with SMOKE_MATCH_ID.

const base = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? '').replace(/\/+$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('usage: npm run smoke:prod -- <base-url>');
  process.exit(2);
}

const matchId = process.env.SMOKE_MATCH_ID ?? 'pak-ind-2022-t20wc-mcg';
const lang = 'en';

async function post(name, path, body) {
  const started = Date.now();
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const type = res.headers.get('content-type') ?? '';
    const isAudio = type.startsWith('audio/');
    const json = type.includes('json') ? await res.json().catch(() => null) : null;
    if (isAudio) await res.arrayBuffer();
    const source = json?.source ?? (isAudio ? 'audio' : '-');
    const detail = res.ok ? '' : `  ${json?.code ?? ''} ${json?.message ?? ''}`;
    console.log(
      `${res.ok ? 'PASS' : 'FAIL'}  ${name.padEnd(8)} ${String(res.status).padEnd(4)} source=${String(source).padEnd(9)} ${Date.now() - started}ms${detail}`,
    );
    return { ok: res.ok, json };
  } catch (error) {
    console.log(`FAIL  ${name.padEnd(8)} ---  ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false, json: null };
  }
}

const recap = await post('recap', '/api/recap', { matchId, fromSeq: 0, toSeq: 11, seqBase: 0, lang });
const ask = await post('ask', '/api/ask', {
  matchId,
  seq: 11,
  seqBase: 0,
  lang,
  question: 'Who is batting?',
});
const learn = await post('learn', '/api/learn', {
  matchId,
  seq: 11,
  ruleId: 'free-hit-bowled-not-out',
  lang,
});

// speak takes the signed token a recap/ask/learn answer carries; older builds take { kind, id }.
const speakBody = recap.json?.speakToken
  ? { token: recap.json.speakToken }
  : recap.json?.id
    ? { kind: 'recap', id: recap.json.id }
    : null;
const speak = speakBody
  ? await post('speak', '/api/speak', speakBody)
  : (console.log('FAIL  speak    ---  recap answer carried no speak token or id'), { ok: false });

const failed = [recap, ask, learn, speak].filter((r) => !r.ok).length;
console.log(failed === 0 ? '\nAll endpoints healthy.' : `\n${failed} endpoint(s) failing.`);
process.exit(failed === 0 ? 0 : 1);
