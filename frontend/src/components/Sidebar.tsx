import { GitBranch, Inbox, Search, FileText, FolderTree, Users, Database, Settings } from "lucide-react";
import { Separator } from "./ui/separator";
import { clsx } from "clsx";

export type SidebarSection =
  | "inbox"
  | "search"
  | "curator"
  | "branches"
  | "clients"
  | "audit"
  | "settings";

const NAV_ITEMS: Array<{ key: SidebarSection; label: string; icon: React.ReactNode }> = [
  { key: "inbox", label: "Inbox", icon: <Inbox className="h-4 w-4" /> },
  { key: "search", label: "Search", icon: <Search className="h-4 w-4" /> },
  { key: "curator", label: "Task Curator", icon: <FileText className="h-4 w-4" /> },
  { key: "branches", label: "Branches", icon: <FolderTree className="h-4 w-4" /> },
  { key: "clients", label: "Clients & Scopes", icon: <Users className="h-4 w-4" /> },
  { key: "audit", label: "Audit", icon: <Database className="h-4 w-4" /> },
  { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

export interface SidebarProps {
  section: SidebarSection;
  onSelect: (section: SidebarSection) => void;
}

export function Sidebar({ section, onSelect }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white/70 p-3 backdrop-blur">
      <div className="flex items-center gap-2 px-2 py-2 text-sm font-semibold text-zinc-900">
        <GitBranch className="h-5 w-5" />
        Memory Gateway
      </div>
      <Separator className="my-2" />
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={clsx(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-zinc-100",
              section === item.key && "bg-zinc-100"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto px-2 py-2 text-[11px] text-zinc-500">Local-first • RAG-only v1</div>
    </aside>
  );
}
