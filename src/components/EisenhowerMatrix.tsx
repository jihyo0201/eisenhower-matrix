"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Task, Quadrant } from "@/types";
import QuadrantZone from "./QuadrantZone";
import UnassignedSidebar from "./UnassignedSidebar";
import TaskEditModal from "./TaskEditModal";

const STORAGE_KEY = "eisenhower-tasks";

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export default function EisenhowerMatrix() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    setTasks(loadTasks());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveTasks(tasks);
  }, [tasks, loaded]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const addTask = useCallback(async (title: string) => {
    const localId = crypto.randomUUID();
    const task: Task = {
      id: localId,
      title,
      notes: "",
      quadrant: "unassigned",
      completed: false,
    };
    setTasks((prev) => [...prev, task]);

    // Create in Google Tasks if logged in
    if (session?.accessToken) {
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (res.ok) {
          const data = await res.json();
          setTasks((prev) =>
            prev.map((t) =>
              t.id === localId
                ? { ...t, googleTaskId: data.googleTaskId, taskListId: data.taskListId }
                : t
            )
          );
        }
      } catch (e) {
        console.error("Failed to create in Google Tasks:", e);
      }
    }
  }, [session]);

  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task?.googleTaskId && task?.taskListId) {
      try {
        await fetch("/api/tasks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: task.googleTaskId,
            taskListId: task.taskListId,
          }),
        });
      } catch (e) {
        console.error("Failed to delete from Google Tasks:", e);
      }
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [tasks]);

  const updateTask = useCallback(async (id: string, updates: { title: string; notes: string; due?: string }) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    // Update locally
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, title: updates.title, notes: updates.notes, due: updates.due }
          : t
      )
    );

    // Sync to Google Tasks if linked
    if (task.googleTaskId && task.taskListId) {
      try {
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: task.googleTaskId,
            taskListId: task.taskListId,
            title: updates.title,
            notes: updates.notes,
            due: updates.due,
          }),
        });
      } catch (e) {
        console.error("Failed to update Google Tasks:", e);
      }
    }
  }, [tasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const quadrant = over.id as Quadrant;
    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, quadrant } : t))
    );
  }, []);

  const syncGoogleTasks = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setTasks((prev) => {
        const localOnly = prev.filter((t) => !t.googleTaskId);
        const existingByGoogleId = new Map(
          prev.filter((t) => t.googleTaskId).map((t) => [t.googleTaskId, t])
        );

        const googleTasks: Task[] = data.tasks.map(
          (gt: { id: string; title: string; notes: string; due: string | null; taskListId: string }) => {
            const existing = existingByGoogleId.get(gt.id);
            if (existing) {
              return {
                ...existing,
                title: gt.title,
                notes: gt.notes || "",
                due: gt.due || undefined,
                taskListId: gt.taskListId,
              };
            }
            const quadrantMatch = gt.notes?.match(/\[eisenhower:(.+?)\]/);
            const quadrant: Quadrant = quadrantMatch
              ? (quadrantMatch[1] as Quadrant)
              : "unassigned";
            return {
              id: crypto.randomUUID(),
              title: gt.title,
              notes: gt.notes || "",
              due: gt.due || undefined,
              quadrant,
              completed: false,
              googleTaskId: gt.id,
              taskListId: gt.taskListId,
            };
          }
        );

        return [...localOnly, ...googleTasks];
      });
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setSyncing(false);
    }
  }, []);

  const tasksByQuadrant = (q: Quadrant) => tasks.filter((t) => t.quadrant === q);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col lg:flex-row gap-6 p-6 h-full">
        {/* Sidebar */}
        <div className="lg:w-72 flex-shrink-0 flex flex-col gap-4">
          <div className="rounded-xl border bg-white p-4">
            {session ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    ログアウト
                  </button>
                </div>
                <button
                  onClick={syncGoogleTasks}
                  disabled={syncing}
                  className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {syncing ? "同期中..." : "Google Tasksを同期"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Googleアカウントで連携
              </button>
            )}
          </div>

          <UnassignedSidebar
            tasks={tasksByQuadrant("unassigned")}
            onAddTask={addTask}
            onToggleComplete={toggleComplete}
            onDelete={deleteTask}
            onEdit={setEditingTask}
          />
        </div>

        {/* Matrix */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
          <QuadrantZone
            quadrant="urgent-important"
            tasks={tasksByQuadrant("urgent-important")}
            onToggleComplete={toggleComplete}
            onDelete={deleteTask}
            onEdit={setEditingTask}
          />
          <QuadrantZone
            quadrant="not-urgent-important"
            tasks={tasksByQuadrant("not-urgent-important")}
            onToggleComplete={toggleComplete}
            onDelete={deleteTask}
            onEdit={setEditingTask}
          />
          <QuadrantZone
            quadrant="urgent-not-important"
            tasks={tasksByQuadrant("urgent-not-important")}
            onToggleComplete={toggleComplete}
            onDelete={deleteTask}
            onEdit={setEditingTask}
          />
          <QuadrantZone
            quadrant="not-urgent-not-important"
            tasks={tasksByQuadrant("not-urgent-not-important")}
            onToggleComplete={toggleComplete}
            onDelete={deleteTask}
            onEdit={setEditingTask}
          />
        </div>
      </div>

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onSave={updateTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </DndContext>
  );
}
