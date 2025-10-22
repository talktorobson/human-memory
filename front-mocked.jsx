import React, { useMemo, useState, useEffect } from "react";
import { Search, Shield, Lock, ChevronRight, Check, X, GitBranch, Clock, Filter, RefreshCcw, Trash2, Copy, FolderTree, Settings, Users, FileText, Database, KeyRound, Eye, EyeOff, Link2, History as HistoryIcon, Network } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

// --- Mock Data --------------------------------------------------------------

type MemoryType = "semantic" | "episodic" | "procedural" | "prospective";

type Memory = {
  id: string;
  title: string;
  type: MemoryType;
  branch: string;
  salience: number;
  sensitivity: "low" | "medium" | "high";
  content: Record<string, any>;
  provenance: { service: string; timestamp: string; snippet: string }[];
  updated_at: string;
  links?: { rel: string; to: string }[];
};

type Candidate = Omit<Memory, "content" | "updated_at"> & { rationale: string; conflicts?: { memory_id: string; kind: "update" | "contradicts" }[] };

type Client = {
  id: string;
  name: string;
  branches: string[];
  types: MemoryType[];
  sensitivityMax: "low" | "medium" | "high";
  lastAccess?: string;
  enabled: boolean;
};

const MEMORIES: Memory[] = [
  {
    id: "mem_normandy_trip",
    title: "2025‑10‑13 Normandy Trip (visited & skipped)",
    type: "episodic",
    branch: "Travel/Normandy",
    salience: 0.83,
    sensitivity: "low",
    content: { when: "2025‑10‑13", where: "Normandy", summary: "Visited Utah Beach & Museum, D913, Pointe du Hoc, Bayeux, Caen Memorial; skipped Airborne Museum, American Cemetery, Omaha." },
    provenance: [{ service: "chatgpt", timestamp: "2025-10-13T16:03:00Z", snippet: "Went to this Weekend…" }],
    updated_at: "2025‑10‑13",
    links: [{ rel: "mentions", to: "mem_unvisited_sites" }],
  },
  {
    id: "mem_unvisited_sites",
    title: "Normandy Unvisited Sites",
    type: "semantic",
    branch: "Travel/Normandy",
    salience: 0.7,
    sensitivity: "low",
    content: { list: ["Airborne Museum", "American Cemetery", "Omaha Beach"] },
    provenance: [{ service: "chatgpt", timestamp: "2025-10-09T20:15:00Z", snippet: "what do you think about adding utah landing museum and airborne museum?" }],
    updated_at: "2025‑10‑09",
  },
  {
    id: "mem_vehicle",
    title: "Drives Tesla Model Y Propulsion",
    type: "semantic",
    branch: "Identity",
    salience: 0.9,
    sensitivity: "low",
    content: { asset: "Tesla Model Y", fuel: "EV" },
    provenance: [{ service: "chatgpt", timestamp: "2025-10-03T12:00:00Z", snippet: "I have a Tesla model y propulsion, memorize that" }],
    updated_at: "2025‑10‑03",
  },
  {
    id: "mem_buffers_proc",
    title: "Buffers logic v1 (working days; SSI vs SDT)",
    type: "procedural",
    branch: "Work/AHS",
    salience: 0.76,
    sensitivity: "medium",
    content: { steps: ["Apply global/static buffer", "Working days only", "SSI at order intake", "SDT at availability check"], notes: "Spain Pyxis adds +2d service buffer" },
    provenance: [{ service: "chatgpt", timestamp: "2025-10-15T09:41:00Z", snippet: "Today we have defined 2 buffers…" }],
    updated_at: "2025‑10‑15",
  },
];

const CANDIDATES: Candidate[] = [
  {
    id: "cand_42",
    title: "Visited Utah Beach; skipped Omaha",
    type: "episodic",
    branch: "Travel/Normandy",
    salience: 0.82,
    sensitivity: "low",
    rationale: "Likely relevant for future Normandy plans.",
    provenance: [
      { service: "chatgpt", timestamp: "2025-10-13T16:03:00Z", snippet: "Went to this Weekend… skipped Airborne Museum…" },
    ],
    conflicts: [{ memory_id: "mem_normandy_trip", kind: "update" }],
  },
  {
    id: "cand_77",
    title: "Buffers logic: working days only; SSI vs SDT application points",
    type: "procedural",
    branch: "Work/AHS",
    salience: 0.74,
    sensitivity: "medium",
    rationale: "Affects scheduling availability and API design decisions.",
    provenance: [{ service: "chatgpt", timestamp: "2025-10-15T09:41:00Z", snippet: "Today we have defined 2 buffers…" }],
  },
  {
    id: "cand_88",
    title: "Drives Tesla Model Y Propulsion",
    type: "semantic",
    branch: "Identity",
    salience: 0.9,
    sensitivity: "low",
    rationale: "Impacts trip planning (EV charging, tolls).",
    provenance: [{ service: "chatgpt", timestamp: "2025-10-03T12:00:00Z", snippet: "I have a Tesla model y propulsion, memorize that" }],
  },
];

const CLIENTS: Client[] = [
  { id: "cli_trip", name: "Trip Planner Agent", branches: ["Travel"], types: ["semantic", "episodic", "procedural"], sensitivityMax: "medium", lastAccess: "2025-10-20T18:03:00Z", enabled: true },
  { id: "cli_work", name: "Work Spec Agent", branches: ["Work/AHS"], types: ["semantic", "procedural"], sensitivityMax: "medium", lastAccess: "2025-10-19T10:22:00Z", enabled: true },
  { id: "cli_legal", name: "Legal Draft Agent", branches: ["Legal"], types: ["semantic", "procedural", "episodic"], sensitivityMax: "low", enabled: false },
];

const TYPE_COLORS: Record<MemoryType, string> = {
  semantic: "bg-blue-100 text-blue-700",
  episodic: "bg-purple-100 text-purple-700",
  procedural: "bg-emerald-100 text-emerald-700",
  prospective: "bg-amber-100 text-amber-800",
};

const SENS_COLORS: Record<"low" | "medium" | "high", string> = {
  low: "bg-zinc-100 text-zinc-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-700",
};

// --- Utilities --------------------------------------------------------------

function ScoreBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
      <div className="h-full bg-zinc-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-1">
      <div className="w-28 text-xs text-zinc-500 pt-1">{label}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function pretty(obj: any) { return JSON.stringify(obj, null, 2); }

// --- Components -------------------------------------------------------------

function Sidebar({ section, setSection }: { section: string; setSection: (v: string) => void }) {
  const items = [
    { key: "inbox", label: "Inbox", icon: <InboxIcon /> },
    { key: "search", label: "Search", icon: <Search className="w-4 h-4" /> },
    { key: "curator", label: "Task Curator", icon: <FileText className="w-4 h-4" /> },
    { key: "branches", label: "Branches", icon: <FolderTree className="w-4 h-4" /> },
    { key: "clients", label: "Clients & Scopes", icon: <Users className="w-4 h-4" /> },
    { key: "audit", label: "Audit", icon: <Database className="w-4 h-4" /> },
    { key: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];
  return (
    <div className="w-64 border-r bg-white/60 backdrop-blur-sm h-full p-3 flex flex-col">
      <div className="flex items-center gap-2 px-2 py-2">
        <GitBranch className="w-5 h-5" />
        <span className="font-semibold">Memory Gateway</span>
      </div>
      <Separator className="my-2" />
      <div className="space-y-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => setSection(it.key)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-zinc-100 transition ${
              section === it.key ? "bg-zinc-100" : ""
            }`}
          >
            {it.icon}
            <span>{it.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-auto text-[11px] text-zinc-500 px-2 py-2">
        Local‑first • RAG‑only v1
      </div>
    </div>
  );
}

function InboxPane() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(CANDIDATES[0]?.id ?? null);
  const [showSensitive, setShowSensitive] = useState(true);

  const filtered = useMemo(() => {
    return CANDIDATES.filter((c) =>
      (showSensitive || c.sensitivity !== "high") &&
      (c.title.toLowerCase().includes(query.toLowerCase()) || c.branch.toLowerCase().includes(query.toLowerCase()))
    );
  }, [query, showSensitive]);

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (selected && !filtered.some((c) => c.id === selected.id)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selected]);

  return (
    <div className="flex h-full">
      {/* Filters Column */}
      <div className="w-60 border-r p-3 space-y-3 bg-white">
        <div className="flex items-center gap-2 text-sm font-medium"><Filter className="w-4 h-4"/> Filters</div>
        <div className="space-y-2">
          <Label className="text-xs">Search</Label>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-zinc-500"/>
            <Input placeholder="Title or branch…" value={query} onChange={(e)=>setQuery(e.target.value)} />
          </div>
        </div>
        <div className="pt-2">
          <Label className="text-xs">Sensitivity</Label>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <input id="sens" type="checkbox" checked={showSensitive} onChange={()=>setShowSensitive(!showSensitive)} />
            <label htmlFor="sens">Show high‑sensitivity</label>
          </div>
        </div>
        <Separator className="my-3"/>
        <div className="text-xs text-zinc-500">⌘↵ Approve • ⌘⌫ Reject</div>
      </div>

      {/* List Column */}
      <div className="flex-1 border-r p-3 overflow-auto bg-zinc-50">
        <div className="grid gap-2">
          {filtered.map((c) => (
            <Card key={c.id} className={`cursor-pointer ${selected?.id === c.id ? "ring-2 ring-zinc-300" : ""}`} onClick={()=>setSelectedId(c.id)}>
              <CardHeader className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{c.title}</CardTitle>
                    <CardDescription className="mt-1 text-xs flex items-center gap-2">
                      <Badge className={TYPE_COLORS[c.type]}>{c.type}</Badge>
                      <span className="text-zinc-600">{c.branch}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3"/>new</span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={SENS_COLORS[c.sensitivity]}>
                      {c.sensitivity}
                    </Badge>
                    <div className="w-32"><ScoreBar value={c.salience}/></div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-zinc-500 p-6">No candidates match your filters.</div>
          )}
        </div>
      </div>

      {/* Inspector Column */}
      <div className="w-[36rem] p-4 bg-white">
        {selected ? (
          <div className="h-full flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selected.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={TYPE_COLORS[selected.type]}>{selected.type}</Badge>
                  <Badge variant="secondary">{selected.branch}</Badge>
                  <Badge className={SENS_COLORS[selected.sensitivity]}>{selected.sensitivity}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1"/>Preview JSON</Button>
                <Button variant="outline" size="sm"><Copy className="w-4 h-4 mr-1"/>Copy</Button>
              </div>
            </div>
            <Separator className="my-3"/>
            <div className="space-y-2">
              <Row label="Why suggested"><p className="text-sm text-zinc-700">{selected.rationale}</p></Row>
              <Row label="Salience"><div className="w-48"><ScoreBar value={selected.salience}/></div></Row>
              <Row label="Provenance">
                <div className="space-y-2">
                  {selected.provenance.map((p, i) => (
                    <div key={i} className="text-xs p-2 rounded-md border bg-zinc-50">
                      <div className="flex items-center gap-2 text-zinc-600"><FileText className="w-3 h-3"/> {p.service} • {new Date(p.timestamp).toLocaleString()}</div>
                      <div className="mt-1 text-zinc-800">“{p.snippet}”</div>
                    </div>
                  ))}
                </div>
              </Row>
              <Row label="Conflicts">
                {selected.conflicts?.length ? (
                  <div className="text-xs">
                    {selected.conflicts.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">↔ <span>{c.kind} with <code className="bg-zinc-100 px-1 rounded">{c.memory_id}</code></span></div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500">None</span>
                )}
              </Row>
              <Row label="Access plan">
                <div className="text-xs text-zinc-700 flex items-center gap-2">
                  <Shield className="w-3 h-3"/> Default scopes: <Badge variant="secondary">Travel</Badge> <Badge variant="secondary">semantic/episodic</Badge>
                </div>
              </Row>
            </div>
            <div className="mt-auto pt-4 flex items-center justify-between">
              <div className="text-xs text-zinc-500">⌘↵ Approve • ⌘⌫ Reject</div>
              <div className="flex gap-2">
                <Button variant="destructive"><X className="w-4 h-4 mr-1"/>Reject</Button>
                <Button><Check className="w-4 h-4 mr-1"/>Approve</Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">Select a candidate to inspect.</div>
        )}
      </div>
    </div>
  );
}

function SearchPane({ openMemory }: { openMemory: (id: string) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    return MEMORIES.map((m) => ({ ...m, score: (m.title.toLowerCase().includes(q.toLowerCase()) ? 0.5 : 0) + m.salience * 0.5 }))
      .filter((r) => (q ? r.title.toLowerCase().includes(q.toLowerCase()) || r.branch.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => (b as any).score - (a as any).score);
  }, [q]);

  return (
    <div className="h-full flex flex-col p-4 gap-3">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4"/>
        <Input placeholder="Search memories…" value={q} onChange={(e)=>setQ(e.target.value)} />
        <Button variant="outline"><RefreshCcw className="w-4 h-4 mr-1"/>Reindex</Button>
      </div>
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Results</CardTitle>
          <CardDescription>Hybrid (kw + vector) • mock data</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white text-zinc-500">
                <tr>
                  <th className="text-left px-3 py-2 w-24">Score</th>
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Branch</th>
                  <th className="text-left px-3 py-2">Salience</th>
                  <th className="text-left px-3 py-2">Sensitivity</th>
                  <th className="text-left px-3 py-2 w-32">Updated</th>
                  <th className="text-left px-3 py-2 w-28">Open</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-zinc-50">
                    <td className="px-3 py-2 align-middle"><div className="w-20"><ScoreBar value={(r as any).score} /></div></td>
                    <td className="px-3 py-2">{r.title}</td>
                    <td className="px-3 py-2"><Badge className={TYPE_COLORS[r.type]}>{r.type}</Badge></td>
                    <td className="px-3 py-2">{r.branch}</td>
                    <td className="px-3 py-2">{Math.round(r.salience*100)}%</td>
                    <td className="px-3 py-2"><Badge className={SENS_COLORS[r.sensitivity]}>{r.sensitivity}</Badge></td>
                    <td className="px-3 py-2 text-zinc-500">{r.updated_at}</td>
                    <td className="px-3 py-2"><Button variant="outline" size="sm" onClick={()=>openMemory(r.id)}>Open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskCuratorPane() {
  const [task, setTask] = useState("Plan Normandy weekend with EV");
  const [semanticK, setSemanticK] = useState(6);
  const [episodicK, setEpisodicK] = useState(4);
  const [proceduralK, setProceduralK] = useState(2);
  const [jsonPreview, setJsonPreview] = useState<string>("");

  const bundle = useMemo(() => {
    const sem = MEMORIES.filter((m) => m.type === "semantic").slice(0, semanticK);
    const epi = MEMORIES.filter((m) => m.type === "episodic").slice(0, episodicK);
    const pro = MEMORIES.filter((m) => m.type === "procedural").slice(0, proceduralK);
    return { semantic: sem, episodic: epi, procedural: pro };
  }, [semanticK, episodicK, proceduralK]);

  useEffect(()=>{
    setJsonPreview(pretty({ task, bundle, provenance: { search: "kw+vec", graph_hops: 1 } }));
  }, [task, bundle]);

  function copyJSON(){
    navigator.clipboard?.writeText(jsonPreview);
  }

  return (
    <div className="h-full p-4 grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Task</CardTitle>
          <CardDescription>Preview what `/memories/retrieve_for_task` would return.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Task description</Label>
          <Textarea value={task} onChange={(e)=>setTask(e.target.value)} rows={5} />
          <Separator/>
          <Label className="block mb-2">k per type</Label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs mb-2">semantic: {semanticK}</div>
              <Slider value={[semanticK]} min={0} max={10} step={1} onValueChange={(v)=>setSemanticK(v[0])}/>
            </div>
            <div>
              <div className="text-xs mb-2">episodic: {episodicK}</div>
              <Slider value={[episodicK]} min={0} max={10} step={1} onValueChange={(v)=>setEpisodicK(v[0])}/>
            </div>
            <div>
              <div className="text-xs mb-2">procedural: {proceduralK}</div>
              <Slider value={[proceduralK]} min={0} max={10} step={1} onValueChange={(v)=>setProceduralK(v[0])}/>
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <Button variant="outline" onClick={copyJSON}><Copy className="w-4 h-4 mr-1"/>Copy JSON</Button>
            <Button><Eye className="w-4 h-4 mr-1"/>Open as Context</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bundle Preview</CardTitle>
          <CardDescription>Grouped by type • mock data</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="semantic">
            <TabsList>
              <TabsTrigger value="semantic">Semantic ({bundle.semantic.length})</TabsTrigger>
              <TabsTrigger value="episodic">Episodic ({bundle.episodic.length})</TabsTrigger>
              <TabsTrigger value="procedural">Procedural ({bundle.procedural.length})</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>
            <TabsContent value="semantic">
              <div className="space-y-2">
                {bundle.semantic.map((m)=> (
                  <MiniMemoryCard key={m.id} m={m} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="episodic">
              <div className="space-y-2">
                {bundle.episodic.map((m)=> (
                  <MiniMemoryCard key={m.id} m={m} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="procedural">
              <div className="space-y-2">
                {bundle.procedural.map((m)=> (
                  <MiniMemoryCard key={m.id} m={m} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="json">
              <pre className="bg-zinc-50 border rounded p-3 text-xs overflow-auto max-h-[40vh]">{jsonPreview}</pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniMemoryCard({ m }: { m: Memory }){
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{m.title}</CardTitle>
          <Badge className={TYPE_COLORS[m.type]}>{m.type}</Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <span>{m.branch}</span>
          <Badge className={SENS_COLORS[m.sensitivity]}>{m.sensitivity}</Badge>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function MemoryDetailPane({ id }: { id: string }){
  const m = useMemo(() => MEMORIES.find(mm => mm.id === id) ?? MEMORIES[0], [id]);
  return (
    <div className="h-full p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{m.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={TYPE_COLORS[m.type]}>{m.type}</Badge>
            <Badge variant="secondary">{m.branch}</Badge>
            <Badge className={SENS_COLORS[m.sensitivity]}>{m.sensitivity}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Copy className="w-4 h-4 mr-1"/>Copy JSON</Button>
          <Button variant="outline" size="sm"><Trash2 className="w-4 h-4 mr-1"/>Forget</Button>
        </div>
      </div>
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="provenance">Provenance</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Structured Content</CardTitle></CardHeader>
            <CardContent>
              <pre className="bg-zinc-50 border rounded p-3 text-xs overflow-auto">{pretty(m.content)}</pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="provenance">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Sources</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {m.provenance.map((p,i)=> (
                <div key={i} className="text-xs p-2 rounded-md border bg-zinc-50">
                  <div className="flex items-center gap-2 text-zinc-600"><FileText className="w-3 h-3"/> {p.service} • {new Date(p.timestamp).toLocaleString()}</div>
                  <div className="mt-1 text-zinc-800">“{p.snippet}”</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="access">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Effective Permissions</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {CLIENTS.map(c => (
                <div key={c.id} className="flex items-center justify-between border rounded p-2">
                  <div className="flex items-center gap-2"><Shield className="w-4 h-4"/> {c.name}</div>
                  <div className="text-xs text-zinc-600">{c.enabled ? "enabled" : "disabled"} • max {c.sensitivityMax}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Version Timeline</CardTitle></CardHeader>
            <CardContent className="text-sm text-zinc-600">
              <div className="flex items-center gap-2"><HistoryIcon className="w-4 h-4"/> {m.updated_at}: last update (mock)</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="graph">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Linked Memories (1‑hop)</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {m.links?.length ? m.links.map((l, i) => (
                <div key={i} className="flex items-center gap-2"><Link2 className="w-4 h-4"/> {l.rel} → <code className="bg-zinc-100 px-1 rounded">{l.to}</code></div>
              )) : <div className="text-zinc-500">No links</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClientsScopesPane(){
  const [rows, setRows] = useState<Client[]>(CLIENTS);
  function toggleEnabled(id: string){ setRows(r => r.map(x => x.id===id ? { ...x, enabled: !x.enabled } : x)); }
  return (
    <div className="h-full p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Clients & Scopes</h2>
        <Button variant="outline"><KeyRound className="w-4 h-4 mr-1"/>Rotate Keys</Button>
      </div>
      <Card className="overflow-hidden">
        <CardHeader className="py-3"><CardTitle className="text-base">Agents</CardTitle><CardDescription>Per‑branch scopes and sensitivity ceilings (mock)</CardDescription></CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white text-zinc-500">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Branches</th>
                  <th className="text-left px-3 py-2">Types</th>
                  <th className="text-left px-3 py-2">Sensitivity max</th>
                  <th className="text-left px-3 py-2">Last access</th>
                  <th className="text-left px-3 py-2">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.branches.join(", ")}</td>
                    <td className="px-3 py-2">{r.types.join(" · ")}</td>
                    <td className="px-3 py-2"><Badge className={SENS_COLORS[r.sensitivityMax]}>{r.sensitivityMax}</Badge></td>
                    <td className="px-3 py-2 text-zinc-500">{r.lastAccess ?? "—"}</td>
                    <td className="px-3 py-2"><Switch checked={r.enabled} onCheckedChange={()=>toggleEnabled(r.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Header({ section, setSection }: { section: string; setSection: (v: string)=>void }) {
  return (
    <div className="h-14 border-b bg-white/70 backdrop-blur flex items-center px-4 justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={()=>setSection("inbox")} className={section!=="inbox"?"text-zinc-500":""}>Inbox</Button>
        <Button variant="ghost" size="sm" onClick={()=>setSection("search")} className={section!=="search"?"text-zinc-500":""}>Search</Button>
        <Button variant="ghost" size="sm" onClick={()=>setSection("curator")} className={section!=="curator"?"text-zinc-500":""}>Task Curator</Button>
        <Button variant="ghost" size="sm" onClick={()=>setSection("clients")} className={section!=="clients"?"text-zinc-500":""}>Clients & Scopes</Button>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Lock className="w-4 h-4"/> Local‑first • RAG‑only v1
      </div>
    </div>
  );
}

function InboxIcon(){
  return (
    <div className="relative w-4 h-4">
      <div className="absolute inset-0 border rounded"/>
      <div className="absolute left-1 right-1 bottom-0 h-1.5 bg-zinc-800 rounded"/>
    </div>
  );
}

// --- App -------------------------------------------------------------------

export default function App() {
  const [section, setSection] = useState("inbox");
  const [openMemId, setOpenMemId] = useState<string | null>(null);

  function openMemory(id: string){
    setOpenMemId(id);
    setSection("memory");
  }

  return (
    <div className="w-full h-full grid" style={{ gridTemplateRows: "56px 1fr" }}>
      <Header section={section} setSection={setSection} />
      <div className="grid" style={{ gridTemplateColumns: "256px 1fr" }}>
        <Sidebar section={section} setSection={setSection} />
        <main className="h-[calc(100vh-56px)]">
          {section === "inbox" && <InboxPane />}
          {section === "search" && <SearchPane openMemory={openMemory} />}
          {section === "curator" && <TaskCuratorPane />}
          {section === "clients" && <ClientsScopesPane />}
          {section === "memory" && openMemId && <MemoryDetailPane id={openMemId} />}
          {!(section === "inbox" || section === "search" || section === "curator" || section === "clients" || section === "memory") && (
            <div className="h-full grid place-items-center text-zinc-500">This area is stubbed for v1.</div>
          )}
        </main>
      </div>
    </div>
  );
}
