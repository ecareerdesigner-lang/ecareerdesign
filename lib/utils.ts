export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDateSafe(dateString: string): string {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString();
}