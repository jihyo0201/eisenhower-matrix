"use client";

import { useDroppable } from "@dnd-kit/core";
import { Quadrant, QUADRANT_LABELS, Task } from "@/types";
import TaskCard from "./TaskCard";

interface QuadrantZoneProps {
  quadrant: Exclude<Quadrant, "unassigned">;
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export default function QuadrantZone({ quadrant, tasks, onToggleComplete, onDelete, onEdit }: QuadrantZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant });
  const config = QUADRANT_LABELS[quadrant];

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border-2 p-4 min-h-[200px] transition-colors ${config.color} ${
        isOver ? "ring-2 ring-blue-400 border-blue-400" : ""
      }`}
    >
      <div className="mb-3">
        <h2 className="text-lg font-bold">{config.title}</h2>
        <p className="text-xs text-gray-500">{config.description}</p>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
