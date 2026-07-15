import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const WORK_ITEM_TYPES = [
  'EPIC', 'FEATURE', 'STORY', 'TASK', 'TECH_TASK', 'SPIKE', 'BUG', 'DEFECT', 'HOTFIX', 'CHANGE_REQUEST',
] as const;

export const JOB_ROLES = ['QA', 'DEV', 'PO', 'TECH_LEAD', 'DESIGNER', 'SCRUM_MASTER', 'OTHER'] as const;

export const TYPE_COLORS: Record<string, string> = {
  EPIC: 'bg-purple-100 text-purple-800',
  FEATURE: 'bg-blue-100 text-blue-800',
  STORY: 'bg-green-100 text-green-800',
  TASK: 'bg-slate-100 text-slate-800',
  TECH_TASK: 'bg-slate-100 text-slate-700',
  SPIKE: 'bg-orange-100 text-orange-800',
  BUG: 'bg-red-100 text-red-800',
  DEFECT: 'bg-red-100 text-red-900',
  HOTFIX: 'bg-rose-100 text-rose-800',
  CHANGE_REQUEST: 'bg-yellow-100 text-yellow-800',
};
