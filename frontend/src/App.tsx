import { useState } from "react";
import { Sidebar, SidebarSection } from "./components/Sidebar";
import { InboxPane } from "./components/InboxPane";
import { SearchPane } from "./components/SearchPane";
import { TaskCuratorPane } from "./components/TaskCuratorPane";
import { MemoryInspector } from "./components/MemoryInspector";
import { ClientsScopesPane } from "./components/ClientsScopesPane";
import { Memory } from "./types/memory";

export default function App() {
  const [section, setSection] = useState<SidebarSection>("inbox");
  const [openedMemory, setOpenedMemory] = useState<Memory | null>(null);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-100 text-zinc-900">
      <Sidebar section={section} onSelect={setSection} />
      <main className="flex h-full flex-1 flex-col">
        {section === "inbox" && <InboxPane />}
        {section === "search" && <SearchPane onOpenMemory={setOpenedMemory} />}
        {section === "curator" && <TaskCuratorPane />}
        {section === "clients" && <ClientsScopesPane />}
        {(section === "branches" || section === "audit" || section === "settings") && (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Panel coming soon.
          </div>
        )}
      </main>
      {section === "search" && (
        <div className="w-[32rem] border-l bg-white">
          <MemoryInspector memory={openedMemory} />
        </div>
      )}
    </div>
  );
}
