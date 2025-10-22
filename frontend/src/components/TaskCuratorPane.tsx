import { useEffect, useMemo, useState } from "react";
import { Copy, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { useRetrieveForTask } from "../api/memories";
import { ScoreBar } from "./ScoreBar";

export function TaskCuratorPane() {
  const [task, setTask] = useState("Plan Normandy weekend with EV");
  const [limit, setLimit] = useState(6);
  const { data, isLoading, isError, error, refetch, isFetching } = useRetrieveForTask({ task, limit }, true);
  const [jsonPreview, setJsonPreview] = useState("");

  const context = data?.context ?? [];

  useEffect(() => {
    if (!isLoading && data) {
      setJsonPreview(JSON.stringify(data, null, 2));
    }
  }, [data, isLoading]);

  const buckets = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const hit of context) {
      const type = hit.memory.type ?? "semantic";
      grouped[type] = (grouped[type] ?? 0) + 1;
    }
    return grouped;
  }, [context]);

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Task</CardTitle>
          <CardDescription>Ask the gateway to assemble a context bundle for your agent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Task description</Label>
            <Textarea rows={5} value={task} onChange={(event) => setTask(event.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Max results</Label>
            <Slider min={1} max={20} value={limit} onChange={(event) => setLimit(Number(event.currentTarget.value))} />
            <div className="mt-1 text-xs text-zinc-600">{limit} memories</div>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={!task.trim() || isFetching}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Regenerate bundle
          </Button>
          {isError && <div className="text-sm text-red-600">{(error as Error)?.message ?? "Failed to retrieve"}</div>}
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Context bundle</CardTitle>
          <CardDescription>
            {isLoading ? "Fetching context…" : `${context.length} memories returned`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-3 overflow-auto">
          <div className="space-y-2 text-sm">
            {Object.entries(buckets).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between rounded border bg-zinc-50 px-3 py-2">
                <span className="capitalize">{type}</span>
                <span className="text-xs text-zinc-500">{count} memories</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {context.map((hit) => (
              <div key={hit.memory.id} className="rounded border bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{hit.memory.title}</div>
                    <div className="text-xs text-zinc-500">{hit.memory.branch}</div>
                  </div>
                  <div className="w-24">
                    <ScoreBar value={hit.score} />
                  </div>
                </div>
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-zinc-50 p-2 text-xs">
                  {JSON.stringify(hit.memory.content, null, 2)}
                </pre>
              </div>
            ))}
            {!isLoading && context.length === 0 && !isError && (
              <div className="rounded border border-dashed p-6 text-center text-sm text-zinc-500">
                No memories returned yet.
              </div>
            )}
          </div>
        </CardContent>
        <div className="flex items-center justify-between border-t px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard?.writeText(jsonPreview)}
            disabled={!jsonPreview}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy JSON
          </Button>
          <span className="text-xs text-zinc-500">Shape mirrors /memories/retrieve_for_task</span>
        </div>
      </Card>
    </div>
  );
}
