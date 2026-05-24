"use client";

import { Task } from "@/types";

interface CompletedListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CompletedList({ tasks, onToggleComplete, onDelete }: CompletedListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">完了したタスクはありません</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm"
          >
            <button
              onClick={() => onToggleComplete(task.id)}
              className="flex-shrink-0 w-5 h-5 rounded border-2 bg-green-500 border-green-500 text-white"
            >
              <svg className="w-3 h-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <span className="text-sm line-through text-gray-400">{task.title}</span>
              {task.due && (
                <span className="ml-2 text-xs text-gray-400">{task.due}</span>
              )}
            </div>
            <button
              onClick={() => onDelete(task.id)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
