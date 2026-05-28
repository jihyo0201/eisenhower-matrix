"use client";

import { useState, useMemo } from "react";
import { Task } from "@/types";

interface TableViewProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onOpenTagManager: () => void;
}

const QUADRANT_SHORT: Record<string, string> = {
  "urgent-important": "DO",
  "not-urgent-important": "SCHEDULE",
  "urgent-not-important": "DELEGATE",
  "not-urgent-not-important": "DELETE",
  "unassigned": "未分類",
};

const QUADRANT_ORDER: Record<string, number> = {
  "urgent-important": 0,
  "not-urgent-important": 1,
  "urgent-not-important": 2,
  "not-urgent-not-important": 3,
  "unassigned": 4,
};

type SortKey = "title" | "category" | "progress" | "quadrant" | "due";
type SortDir = "asc" | "desc";

const TAG_COLORS = [
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
  "bg-rose-100 text-rose-700",
  "bg-lime-100 text-lime-700",
  "bg-sky-100 text-sky-700",
  "bg-orange-100 text-orange-700",
];

function getTagColor(value: string, allValues: string[]): string {
  const idx = allValues.indexOf(value);
  return TAG_COLORS[idx % TAG_COLORS.length] || "bg-gray-100 text-gray-700";
}

export default function TableView({ tasks, onToggleComplete, onDelete, onEdit, onOpenTagManager }: TableViewProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterProgress, setFilterProgress] = useState<string>("all");
  const [filterQuadrant, setFilterQuadrant] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const categories = useMemo(
    () => [...new Set(tasks.map((t) => t.category).filter(Boolean))] as string[],
    [tasks]
  );
  const progressValues = useMemo(
    () => [...new Set(tasks.map((t) => t.progress).filter(Boolean))] as string[],
    [tasks]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  const filtered = useMemo(() => {
    let result = tasks.filter((t) => {
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (filterProgress !== "all" && t.progress !== filterProgress) return false;
      if (filterQuadrant !== "all" && t.quadrant !== filterQuadrant) return false;
      return true;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        switch (sortKey) {
          case "title":
            cmp = (a.title || "").localeCompare(b.title || "");
            break;
          case "category":
            cmp = (a.category || "").localeCompare(b.category || "");
            break;
          case "progress":
            cmp = (a.progress || "").localeCompare(b.progress || "");
            break;
          case "quadrant":
            cmp = (QUADRANT_ORDER[a.quadrant] ?? 99) - (QUADRANT_ORDER[b.quadrant] ?? 99);
            break;
          case "due":
            cmp = (a.due || "9999").localeCompare(b.due || "9999");
            break;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [tasks, filterCategory, filterProgress, filterQuadrant, sortKey, sortDir]);

  return (
    <div className="p-4 sm:p-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">カテゴリ: すべて</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterProgress}
          onChange={(e) => setFilterProgress(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">進捗: すべて</option>
          {progressValues.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filterQuadrant}
          onChange={(e) => setFilterQuadrant(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">象限: すべて</option>
          <option value="urgent-important">DO</option>
          <option value="not-urgent-important">SCHEDULE</option>
          <option value="urgent-not-important">DELEGATE</option>
          <option value="not-urgent-not-important">DELETE</option>
          <option value="unassigned">未分類</option>
        </select>
        <button
          onClick={onOpenTagManager}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          タグ管理
        </button>
      </div>

      {/* Mobile: Card list */}
      <div className="sm:hidden flex flex-col gap-3">
        {filtered.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => onToggleComplete(task.id)}
                className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 transition-colors ${
                  task.completed
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {task.completed && (
                  <svg className="w-3 h-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0" onClick={() => onEdit(task)}>
                <p className={`text-sm font-medium ${task.completed ? "line-through text-gray-400" : ""}`}>
                  {task.title}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {task.category && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTagColor(task.category, categories)}`}>
                      {task.category}
                    </span>
                  )}
                  {task.progress && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTagColor(task.progress, progressValues)}`}>
                      {task.progress}
                    </span>
                  )}
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {QUADRANT_SHORT[task.quadrant]}
                  </span>
                  {task.due && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {task.due}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDelete(task.id)}
                className="flex-shrink-0 text-gray-400 hover:text-red-500"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">該当するタスクがありません</p>
        )}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-3 w-8"></th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-gray-900 select-none"
                onClick={() => handleSort("title")}
              >
                タスク <span className="text-xs text-gray-400">{sortIcon("title")}</span>
              </th>
              <th
                className="px-4 py-3 w-28 cursor-pointer hover:text-gray-900 select-none"
                onClick={() => handleSort("category")}
              >
                カテゴリ <span className="text-xs text-gray-400">{sortIcon("category")}</span>
              </th>
              <th
                className="px-4 py-3 w-24 cursor-pointer hover:text-gray-900 select-none"
                onClick={() => handleSort("progress")}
              >
                進捗 <span className="text-xs text-gray-400">{sortIcon("progress")}</span>
              </th>
              <th
                className="px-4 py-3 w-24 cursor-pointer hover:text-gray-900 select-none"
                onClick={() => handleSort("quadrant")}
              >
                象限 <span className="text-xs text-gray-400">{sortIcon("quadrant")}</span>
              </th>
              <th
                className="px-4 py-3 w-24 cursor-pointer hover:text-gray-900 select-none"
                onClick={() => handleSort("due")}
              >
                期日 <span className="text-xs text-gray-400">{sortIcon("due")}</span>
              </th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => (
              <tr
                key={task.id}
                className="border-b last:border-b-0 hover:bg-gray-50 transition-colors group"
              >
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className={`w-5 h-5 rounded border-2 transition-colors ${
                      task.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {task.completed && (
                      <svg className="w-3 h-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </td>
                <td
                  className={`px-4 py-3 cursor-pointer hover:text-blue-600 ${task.completed ? "line-through text-gray-400" : ""}`}
                  onClick={() => onEdit(task)}
                >
                  {task.title}
                </td>
                <td className="px-4 py-3">
                  {task.category && (
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getTagColor(task.category, categories)}`}>
                      {task.category}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {task.progress && (
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getTagColor(task.progress, progressValues)}`}>
                      {task.progress}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {QUADRANT_SHORT[task.quadrant]}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {task.due || "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  該当するタスクがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
