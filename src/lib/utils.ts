import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCurrentMonthString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const formatMonthLabel = (monthStr: string) => {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, monthStrNum] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStrNum, 10) - 1;
  const date = new Date(year, monthIndex, 1);
  const monthName = date.toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalizedMonth} / ${year}`;
};

export const getMonthOptions = () => {
  const baseMonths = [
    { value: '2026-05', label: 'Maio / 2026' },
    { value: '2026-06', label: 'Junho / 2026' },
    { value: '2026-07', label: 'Julho / 2026' },
    { value: '2026-08', label: 'Agosto / 2026' },
    { value: '2026-09', label: 'Setembro / 2026' },
    { value: '2026-10', label: 'Outubro / 2026' },
    { value: '2026-11', label: 'Novembro / 2026' },
    { value: '2026-12', label: 'Dezembro / 2026' },
  ];
  const current = getCurrentMonthString();
  if (!baseMonths.some(m => m.value === current)) {
    baseMonths.push({
      value: current,
      label: formatMonthLabel(current)
    });
    baseMonths.sort((a, b) => a.value.localeCompare(b.value));
  }
  return baseMonths;
};

export const formatCourseName = (name: string) => {
  return name
    .replace(/_/g, ' ')
    .replace(/\s*-\s*EAD/i, '')
    .split(' ')
    .map(word => {
      if (!word) return '';
      const lower = word.toLowerCase();
      if (['de', 'da', 'do', 'e', 'para', 'o', 'com', 'social'].includes(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};