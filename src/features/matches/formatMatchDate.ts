const FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** '2022-10-23' -> '23 Oct 2022'. Falls back to the raw string if unparseable. */
export function formatMatchDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? iso : FORMATTER.format(date);
}
