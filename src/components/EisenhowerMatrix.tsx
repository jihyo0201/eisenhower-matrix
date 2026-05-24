"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Task, Quadrant } from "@/types";
import { parseTag, buildNotes } from "@/lib/notes";
import QuadrantZone from "./QuadrantZone";
import UnassignedSidebar from "./UnassignedSidebar";
import TaskEditModal from "./TaskEditModal";
import CompletedList from "./CompletedList";
import TableView from "./TableView";

export default function EisenhowerMatrix() {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<"matrix" | "table" | "completed">("matrix");
  const hasSynced = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const syncGoogleTasks = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const googleTasks: Task[] = data.tasks.map(
        (gt: { id: string; title: string; notes: string; due: string | null; status: string; taskListId: string }) => {
          const quadrantMatch = gt.notes?.match(/\[eisenhower:(.+?)\]/);
          const quadrant: Quadrant = quadrantMatch
            ? (quadrantMatch[1] as Quadrant)
            : "unassigned";
          const category = parseTag(gt.notes || "", "category");
          const progress = parseTag(gt.notes || "", "progress");
          return {
            id: crypto.randomUUID(),
            title: gt.title,
            notes: gt.notes || "",
            due: gt.due || undefined,
            quadrant,
            completed: gt.status === "completed",
            category,
            progress,
            googleTaskId: gt.id,
            taskListId: gt.taskListId,
          };
        }
      );

      setTasks(googleTasks);
      setLoaded(true);
    } catch (e) {
      console.error("Sync failed:", e);
      setLoaded(true);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && !hasSynced.current) {
      hasSynced.current = true;
      syncGoogleTasks();
    } else if (status === "unauthenticated") {
      setLoaded(true);
    }
  }, [status, syncGoogleTasks]);

  const addTask = useCallback(async (title: string) => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const data = await res.json();
        const task: Task = {
          id: crypto.randomUUID(),
          title,
          notes: "",
          quadrant: "unassigned",
          completed: false,
          googleTaskId: data.googleTaskId,
          taskListId: data.taskListId,
        };
        setTasks((prev) => [...prev, task]);
      }
    } catch (e) {
      console.error("Failed to create task:", e);
    }
  }, [session]);

  const toggleComplete = useCallback(async (id: string) => {
    let toggledTask: Task | undefined;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          toggledTask = { ...t, completed: !t.completed };
          return toggledTask;
        }
        return t;
      })
    );

    if (toggledTask?.googleTaskId && toggledTask?.taskListId) {
      try {
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: toggledTask.googleTaskId,
            taskListId: toggledTask.taskListId,
            status: toggledTask.completed ? "completed" : "needsAction",
          }),
        });
      } catch (e) {
        console.error("Failed to sync completion:", e);
      }
    }
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

  const updateTask = useCallback(async (id: string, updates: { title: string; notes: string; due?: string; category?: string; progress?: string }) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newNotes = buildNotes(updates.notes, task.quadrant, updates.category, updates.progress);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, title: updates.title, notes: newNotes, due: updates.due, category: updates.category, progress: updates.progress }
          : t
      )
    );

    if (task.googleTaskId && task.taskListId) {
      try {
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: task.googleTaskId,
            taskListId: task.taskListId,
            title: updates.title,
            notes: newNotes,
            due: updates.due,
          }),
        });
      } catch (e) {
        console.error("Failed to update Google Tasks:", e);
      }
    }
  }, [tasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const quadrant = over.id as Quadrant;

    let movedTask: Task | undefined;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === active.id) {
          const newNotes = buildNotes(t.notes, quadrant, t.category, t.progress);
          movedTask = { ...t, quadrant, notes: newNotes };
          return movedTask;
        }
        return t;
      })
    );

    if (movedTask?.googleTaskId && movedTask?.taskListId) {
      try {
        await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: movedTask.googleTaskId,
            taskListId: movedTask.taskListId,
            notes: movedTask.notes,
          }),
        });
      } catch (e) {
        console.error("Failed to sync quadrant:", e);
      }
    }
  }, []);

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const tasksByQuadrant = (q: Quadrant) => activeTasks.filter((t) => t.quadrant === q);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">{syncing ? "Google Tasksを読み込み中..." : "読み込み中..."}</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {/* Tabs */}
      <div className="border-b bg-white px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "matrix"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            マトリクス
          </button>
          <button
            onClick={() => setActiveTab("table")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "table"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            テーブル
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "completed"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            完了済み
            {completedTasks.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                {completedTasks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "matrix" && (
        <div className="flex flex-col lg:flex-row gap-6 p-6 h-full">
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
                    onClick={() => { hasSynced.current = false; syncGoogleTasks(); }}
                    disabled={syncing}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {syncing ? "同期中..." : "再同期"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn("google")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Googleアカウントでログイン
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
      )}

      {activeTab === "table" && (
        <TableView
          tasks={activeTasks}
          onToggleComplete={toggleComplete}
          onDelete={deleteTask}
          onEdit={setEditingTask}
        />
      )}

      {activeTab === "completed" && (
        <CompletedList
          tasks={completedTasks}
          onToggleComplete={toggleComplete}
          onDelete={deleteTask}
        />
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          allTasks={tasks}
          onSave={updateTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </DndContext>
  );
}
