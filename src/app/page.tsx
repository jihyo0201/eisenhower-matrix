import EisenhowerMatrix from "@/components/EisenhowerMatrix";

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-bold">Eisenhower Matrix</h1>
        <p className="text-sm text-gray-500">重要度 × 緊急度でタスクを整理する</p>
      </header>
      <div className="flex-1">
        <EisenhowerMatrix />
      </div>
    </main>
  );
}
