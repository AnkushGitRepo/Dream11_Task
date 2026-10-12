/** Replace `{name}` placeholders: format('Need {n}', { n: 16 }). Unknown keys are left visible. */
export function format(template: string, values: Readonly<Record<string, string | number>> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}
