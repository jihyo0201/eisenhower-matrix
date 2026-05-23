"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Task } from "@/types";
import TaskCard from "./TaskCard";

interface UnassignedSidebarProps {
  tasks: Task[];
  onAddTask: (title: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export default function UnassignedSidebar({ tasks, onAddTask, onToggleComplete, onDelete, onEdit }: UnassignedSidebarProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle("");
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 transition-colors ${
        isOver ? "ring-2 ring-blue-400 border-blue-400" : ""
      }`}
    >
      <h2 className="text-lg font-bold mb-1">未分類タスク</h2>
      <p className="text-xs text-gray-500 mb-3">ドラッグして象限に配置</p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="新しいタスクを追加..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          追加
        </button>
      </form>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            タスクがありません
          </p>
        )}
      </div>
    </div>
  );
}
