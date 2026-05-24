export type Quadrant =
  | "urgent-important"
  | "not-urgent-important"
  | "urgent-not-important"
  | "not-urgent-not-important"
  | "unassigned";

export type Progress = "未着手" | "進行中" | "完了";

export const PROGRESS_OPTIONS: Progress[] = ["未着手", "進行中", "完了"];

export const DEFAULT_CATEGORIES = ["仕事", "プライベート", "勉強", "健康", "その他"];

export interface Task {
  id: string;
  title: string;
  notes: string;
  quadrant: Quadrant;
  completed: boolean;
  due?: string;
  category?: string;
  progress?: Progress;
  googleTaskId?: string;
  taskListId?: string;
}

export const QUADRANT_LABELS: Record<Exclude<Quadrant, "unassigned">, { title: string; description: string; color: string }> = {
  "urgent-important": {
    title: "DO",
    description: "緊急 × 重要",
    color: "bg-red-50 border-red-300",
  },
  "not-urgent-important": {
    title: "SCHEDULE",
    description: "非緊急 × 重要",
    color: "bg-blue-50 border-blue-300",
  },
  "urgent-not-important": {
    title: "DELEGATE",
    description: "緊急 × 非重要",
    color: "bg-amber-50 border-amber-300",
  },
  "not-urgent-not-important": {
    title: "DELETE",
    description: "非緊急 × 非重要",
    color: "bg-gray-50 border-gray-300",
  },
};
