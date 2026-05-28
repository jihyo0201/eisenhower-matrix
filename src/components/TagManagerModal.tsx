"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Task } from "@/types";

interface TagManagerModalProps {
  tasks: Task[];
  onDeleteTag: (type: "category" | "progress", value: string) => void;
  onClose: () => void;
}

export default function TagManagerModal({ tasks, onDeleteTag, onClose }: TagManagerModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ type: "category" | "progress"; value: string } | null>(null);

  const categories = useMemo(
    () => [...new Set(tasks.map((t) => t.category).filter(Boolean))] as string[],
    [tasks]
  );
  const progressValues = useMemo(
    () => [...new Set(tasks.map((t) => t.progress).filter(Boolean))] as string[],
    [tasks]
  );

  const countByTag = (type: "category" | "progress", value: string) =>
    tasks.filter((t) => t[type] === value).length;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleDelete = (type: "category" | "progress", value: string) => {
    onDeleteTag(type, value);
    setConfirmTarget(null);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-auto w-full max-w-md rounded-xl border bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="p-6">
        <h3 className="text-lg font-bold mb-4">タグ管理</h3>

        <div className="flex flex-col gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">カテゴリ</h4>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-400">カテゴリなし</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {categories.map((c) => (
                  <li key={c} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50">
                    <span className="text-sm">
                      {c}
                      <span className="ml-2 text-xs text-gray-400">({countByTag("category", c)}件)</span>
                    </span>
                    {confirmTarget?.type === "category" && confirmTarget?.value === c ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete("category", c)}
                          className="rounded bg-red-500 px-2 py-0.5 text-xs text-white hover:bg-red-600"
                        >
                          削除
                        </button>
                        <button
                          onClick={() => setConfirmTarget(null)}
                          className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-300"
                        >
                          戻す
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmTarget({ type: "category", value: c })}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">進捗</h4>
            {progressValues.length === 0 ? (
              <p className="text-sm text-gray-400">進捗なし</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {progressValues.map((p) => (
                  <li key={p} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50">
                    <span className="text-sm">
                      {p}
                      <span className="ml-2 text-xs text-gray-400">({countByTag("progress", p)}件)</span>
                    </span>
                    {confirmTarget?.type === "progress" && confirmTarget?.value === p ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete("progress", p)}
                          className="rounded bg-red-500 px-2 py-0.5 text-xs text-white hover:bg-red-600"
                        >
                          削除
                        </button>
                        <button
                          onClick={() => setConfirmTarget(null)}
                          className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-300"
                        >
                          戻す
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmTarget({ type: "progress", value: p })}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </dialog>
  );
}
