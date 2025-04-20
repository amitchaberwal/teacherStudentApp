import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRandomCode(length = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  
  return result;
}

export function calculateAttendanceRate(
  present: number,
  total: number
): string {
  if (total === 0) return '0%';
  const rate = Math.round((present / total) * 100);
  return `${rate}%`;
}

export function calculateAverageGrade(
  grades: number[]
): string {
  if (grades.length === 0) return 'N/A';
  const sum = grades.reduce((acc, grade) => acc + grade, 0);
  const average = (sum / grades.length).toFixed(1);
  return average;
}

export function formatDate(
  date: Date | string
): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}
