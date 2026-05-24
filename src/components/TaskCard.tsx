"use client";

import { useDraggable } from "@dnd-kit/core";
import { Task } from "@/types";
import { stripTags } from "@/lib/notes";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

function formatDue(due: string): string {
  const d = new Date(due + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}日前`;
  if (diff === 0) return "今日";
  if (diff === 1) return "明日";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function dueColor(due: string): string {
  const d = new Date(due + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "text-red-600";
  if (diff === 0) return "text-orange-600";
  if (diff <= 2) return "text-amber-600";
  return "text-gray-500";
}

export default function TaskCard({ task, onToggleComplete, onDelete, onEdit }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const displayNotes = stripTags(task.notes);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col rounded-lg border bg-white px-3 py-2 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? "opacity-50 shadow-lg z-50" : ""
      } ${task.completed ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
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
        <span
          {...listeners}
          {...attributes}
          className={`flex-1 cursor-grab active:cursor-grabbing text-sm ${
            task.completed ? "line-through text-gray-400" : ""
          }`}
          onDoubleClick={() => onEdit(task)}
        >
          {task.title}
        </span>
        <button
          onClick={() => onEdit(task)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {(task.due || displayNotes) && (
        <div className="ml-7 mt-1 flex flex-col gap-0.5">
          {task.due && (
            <span className={`text-xs font-medium ${dueColor(task.due)}`}>
              {formatDue(task.due)}
            </span>
          )}
          {displayNotes && (
            <span className="text-xs text-gray-400 line-clamp-2">{displayNotes}</span>
          )}
        </div>
      )}
    </div>
  );
}
