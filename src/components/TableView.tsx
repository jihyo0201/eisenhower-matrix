"use client";

import { useState } from "react";
import { Task, QUADRANT_LABELS, Quadrant } from "@/types";

interface TableViewProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const QUADRANT_SHORT: Record<string, string> = {
  "urgent-important": "DO",
  "not-urgent-important": "SCHEDULE",
  "urgent-not-important": "DELEGATE",
  "not-urgent-not-important": "DELETE",
  "unassigned": "未分類",
};

const PROGRESS_COLORS: Record<string, string> = {
  "未着手": "bg-gray-100 text-gray-700",
  "進行中": "bg-blue-100 text-blue-700",
  "完了": "bg-green-100 text-green-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  "仕事": "bg-purple-100 text-purple-700",
  "プライベート": "bg-pink-100 text-pink-700",
  "勉強": "bg-indigo-100 text-indigo-700",
  "健康": "bg-emerald-100 text-emerald-700",
  "その他": "bg-gray-100 text-gray-700",
};

export default function TableView({ tasks, onToggleComplete, onDelete, onEdit }: TableViewProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterProgress, setFilterProgress] = useState<string>("all");
  const [filterQuadrant, setFilterQuadrant] = useState<string>("all");

  const categories = [...new Set(tasks.map((t) => t.category).filter(Boolean))] as string[];

  const filtered = tasks.filter((t) => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterProgress !== "all" && t.progress !== filterProgress) return false;
    if (filterQuadrant !== "all" && t.quadrant !== filterQuadrant) return false;
    return true;
  });

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
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
          <option value="未着手">未着手</option>
          <option value="進行中">進行中</option>
          <option value="完了">完了</option>
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3">タスク</th>
              <th className="px-4 py-3 w-24">カテゴリ</th>
              <th className="px-4 py-3 w-20">進捗</th>
              <th className="px-4 py-3 w-24">象限</th>
              <th className="px-4 py-3 w-24">期日</th>
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
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[task.category] || "bg-gray-100 text-gray-700"}`}>
                      {task.category}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {task.progress && (
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PROGRESS_COLORS[task.progress] || ""}`}>
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
