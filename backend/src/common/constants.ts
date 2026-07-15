export const WORK_ITEM_PARENT_RULES: Record<string, string[] | null> = {
  EPIC: null,
  FEATURE: ['EPIC'],
  STORY: ['FEATURE', 'EPIC'],
  TASK: ['STORY'],
  TECH_TASK: ['STORY'],
  SPIKE: ['EPIC', 'FEATURE'],
  BUG: ['STORY'],
  DEFECT: ['STORY'],
  HOTFIX: [],
  CHANGE_REQUEST: ['EPIC'],
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}
