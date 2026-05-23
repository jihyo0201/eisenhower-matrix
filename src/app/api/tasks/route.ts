import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const TASKS_API = "https://tasks.googleapis.com/tasks/v1";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listRes = await fetch(`${TASKS_API}/users/@me/lists`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!listRes.ok) {
    return NextResponse.json({ error: "Failed to fetch task lists" }, { status: listRes.status });
  }
  const listData = await listRes.json();
  const taskLists = listData.items || [];

  const allTasks: Array<{
    id: string;
    title: string;
    notes: string;
    due: string | null;
    status: string;
    taskListId: string;
  }> = [];

  for (const list of taskLists) {
    const tasksRes = await fetch(
      `${TASKS_API}/lists/${list.id}/tasks?showCompleted=true&maxResults=100`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    );
    if (tasksRes.ok) {
      const tasksData = await tasksRes.json();
      for (const task of tasksData.items || []) {
        if (task.title) {
          allTasks.push({
            id: task.id,
            title: task.title,
            notes: task.notes || "",
            due: task.due ? task.due.split("T")[0] : null,
            status: task.status,
            taskListId: list.id,
          });
        }
      }
    }
  }

  return NextResponse.json({ tasks: allTasks });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, notes, due } = await request.json();
  if (!title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  // Get default task list
  const listRes = await fetch(`${TASKS_API}/users/@me/lists`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!listRes.ok) {
    return NextResponse.json({ error: "Failed to fetch task lists" }, { status: listRes.status });
  }
  const listData = await listRes.json();
  const defaultList = listData.items?.[0];
  if (!defaultList) {
    return NextResponse.json({ error: "No task list found" }, { status: 404 });
  }

  const body: Record<string, string> = { title };
  if (notes) body.notes = notes;
  if (due) body.due = `${due}T00:00:00.000Z`;

  const res = await fetch(`${TASKS_API}/lists/${defaultList.id}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to create task" }, { status: res.status });
  }

  const created = await res.json();
  return NextResponse.json({
    googleTaskId: created.id,
    taskListId: defaultList.id,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId, taskListId, title, notes, due, status } = await request.json();
  if (!taskId || !taskListId) {
    return NextResponse.json({ error: "taskId and taskListId required" }, { status: 400 });
  }

  const body: Record<string, string> = {};
  if (title !== undefined) body.title = title;
  if (notes !== undefined) body.notes = notes;
  if (due !== undefined) body.due = due ? `${due}T00:00:00.000Z` : "";
  if (status !== undefined) body.status = status;

  const res = await fetch(`${TASKS_API}/lists/${taskListId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to update task" }, { status: res.status });
  }

  const updated = await res.json();
  return NextResponse.json({ task: updated });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId, taskListId } = await request.json();
  if (!taskId || !taskListId) {
    return NextResponse.json({ error: "taskId and taskListId required" }, { status: 400 });
  }

  const res = await fetch(`${TASKS_API}/lists/${taskListId}/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
