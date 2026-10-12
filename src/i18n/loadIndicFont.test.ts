import { afterEach, describe, expect, it } from 'vitest';
import { loadIndicFont } from './loadIndicFont';

afterEach(() => document.head.replaceChildren());

const links = () => Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'));

describe('loadIndicFont', () => {
  it('loads nothing for en and hinglish', () => {
    loadIndicFont('en');
    loadIndicFont('hinglish');
    expect(links()).toHaveLength(0);
  });

  it('injects the Devanagari stylesheet exactly once', () => {
    loadIndicFont('hi');
    loadIndicFont('hi');
    expect(links()).toHaveLength(1);
    const href = links()[0]?.getAttribute('href') ?? '';
    expect(href).toContain('Noto+Sans+Devanagari');
    expect(href).toContain('wght@400;600;700');
    expect(href).toContain('display=swap');
  });

  it('injects Gujarati separately', () => {
    loadIndicFont('hi');
    loadIndicFont('gu');
    loadIndicFont('gu');
    expect(links()).toHaveLength(2);
    expect(links()[1]?.getAttribute('href')).toContain('Noto+Sans+Gujarati');
  });
});
