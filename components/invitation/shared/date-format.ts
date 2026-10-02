export function formatWeddingDateLabel(weddingDate: string): string {
  const date = new Date(weddingDate);
  if (!weddingDate || Number.isNaN(date.getTime())) return '';
  const dow = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()];
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}. ${mm}. ${dd} ${dow}`;
}

export function formatStoryDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (!dateStr || Number.isNaN(date.getTime())) return '';
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}. ${mm}. ${dd}`;
}
