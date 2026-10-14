import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Vercel compiles api/ and shared/ file-by-file to native ESM, where Node needs explicit
// extensions. An extensionless relative import crashes every function with ERR_MODULE_NOT_FOUND.

const ROOTS = ['api', 'shared'] as const;
const SPECIFIER =
  /(?:\bfrom|\bimport\s*\(|\bimport|\bvi\.(?:mock|doMock|importActual|importMock))\s*\(?\s*(['"])(\.{1,2}(?:\/[^'"]*)?)\1/g;
const OK_EXTENSION = /\.(js|json)$/;

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (/\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

describe('ESM import specifiers', () => {
  it('every relative import in api/ and shared/ ends in .js (or .json)', () => {
    const offenders: string[] = [];
    for (const file of ROOTS.flatMap((root) => sourceFiles(join(process.cwd(), root)))) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(SPECIFIER)) {
        const spec = match[2] ?? '';
        if (!OK_EXTENSION.test(spec)) offenders.push(`${file.replace(process.cwd() + '/', '')}: ${spec}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
