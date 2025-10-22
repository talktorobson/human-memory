import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Memory } from "../types/memory";
import { ScoreBar } from "./ScoreBar";

const TYPE_COLORS: Record<string, string> = {
  semantic: "bg-blue-100 text-blue-700",
  episodic: "bg-purple-100 text-purple-700",
  procedural: "bg-emerald-100 text-emerald-700",
  prospective: "bg-amber-100 text-amber-800",
};

const SENS_COLORS: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-700",
};

export interface MemoryInspectorProps {
  memory: Memory | null;
}

export function MemoryInspector({ memory }: MemoryInspectorProps) {
  if (!memory) {
    return <div className="flex h-full items-center justify-center text-sm text-zinc-500">Select a memory to inspect.</div>;
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{memory.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge className={TYPE_COLORS[memory.type ?? "semantic"]}>{memory.type ?? "semantic"}</Badge>
            <Badge variant="secondary">{memory.branch}</Badge>
            <Badge className={SENS_COLORS[memory.sensitivity ?? "low"]}>{memory.sensitivity ?? "low"}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(JSON.stringify(memory, null, 2))}>
            Copy JSON
          </Button>
          <Button variant="outline" size="sm">Forget</Button>
        </div>
      </div>
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="provenance">Provenance</TabsTrigger>
          <TabsTrigger value="meta">Meta</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Structured content</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[40vh] overflow-auto rounded bg-zinc-50 p-3 text-xs">
                {JSON.stringify(memory.content, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="provenance">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {memory.provenance?.length ? (
                memory.provenance.map((item, index) => (
                  <div key={`${item.service}-${index}`} className="rounded border bg-zinc-50 p-2">
                    <div className="text-zinc-600">
                      {item.service} • {new Date(item.timestamp).toLocaleString()}
                    </div>
                    {item.snippet && <div className="mt-1 text-zinc-800">“{item.snippet}”</div>}
                  </div>
                ))
              ) : (
                <div className="text-zinc-500">No provenance info</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="meta">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600">
              <div>Salience</div>
              <ScoreBar value={memory.salience} />
              {memory.updatedAt && <div>Updated {new Date(memory.updatedAt).toLocaleString()}</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
