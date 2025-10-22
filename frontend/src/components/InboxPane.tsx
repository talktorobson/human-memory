import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Copy, Eye, Filter, RefreshCcw, Search, Shield, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { DetailRow } from "./DetailRow";
import { ScoreBar } from "./ScoreBar";
import { Candidate, Sensitivity } from "../types/memory";
import { useApproveCandidate, useRejectCandidate, useRetrieveForTask } from "../api/memories";

const TYPE_COLORS: Record<string, string> = {
  semantic: "bg-blue-100 text-blue-700",
  episodic: "bg-purple-100 text-purple-700",
  procedural: "bg-emerald-100 text-emerald-700",
  prospective: "bg-amber-100 text-amber-800",
};

const SENS_COLORS: Record<Sensitivity, string> = {
  low: "bg-zinc-100 text-zinc-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-700",
};

function toCandidate(hit: Candidate): Candidate {
  return {
    ...hit,
    type: hit.type ?? "semantic",
    sensitivity: hit.sensitivity ?? "low",
  };
}

export function InboxPane() {
  const [task, setTask] = useState("Plan Normandy weekend with EV");
  const [query, setQuery] = useState("");
  const [showSensitive, setShowSensitive] = useState(true);
  const { data, isLoading, isError, error, refetch, isFetching } = useRetrieveForTask({ task, limit: 8 }, true);

  const mappedCandidates = useMemo(() => {
    return (
      data?.context.map((hit) =>
        toCandidate({
          id: hit.memory.id,
          title: hit.memory.title,
          branch: hit.memory.branch,
          salience: hit.memory.salience,
          sensitivity: hit.memory.sensitivity ?? "low",
          type: hit.memory.type ?? "semantic",
          provenance: hit.memory.provenance,
          rationale: `Suggested for task “${data.task}”`,
          conflicts: [],
          score: hit.score,
        })
      ) ?? []
    );
  }, [data]);

  const filtered = useMemo(() => {
    return mappedCandidates.filter((candidate) => {
      const sensitivity = candidate.sensitivity ?? "low";
      const matchesSensitivity = showSensitive || sensitivity !== "high";
      const needle = query.toLowerCase();
      const matchesText =
        !needle ||
        candidate.title.toLowerCase().includes(needle) ||
        candidate.branch.toLowerCase().includes(needle);
      return matchesSensitivity && matchesText;
    });
  }, [mappedCandidates, query, showSensitive]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && filtered.length) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (selectedId && !filtered.find((c) => c.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((c) => c.id === selectedId) ?? null;

  const approveMutation = useApproveCandidate();
  const rejectMutation = useRejectCandidate();

  const actionDisabled = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="flex h-full">
      <div className="w-72 space-y-4 border-r bg-white p-4 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-zinc-500">Task</Label>
          <Input
            value={task}
            onChange={(event) => setTask(event.target.value)}
            placeholder="Describe the task candidates should support"
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => refetch()}
            disabled={!task.trim() || isFetching}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh suggestions
          </Button>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-zinc-500">Search</Label>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-zinc-500" />
            <Input placeholder="Title or branch…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        <div className="pt-2">
          <Label className="text-xs uppercase tracking-wide text-zinc-500">Sensitivity</Label>
          <div className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
            <input
              id="toggle-sensitivity"
              type="checkbox"
              checked={showSensitive}
              onChange={() => setShowSensitive((current) => !current)}
            />
            <label htmlFor="toggle-sensitivity">Show high-sensitivity</label>
          </div>
        </div>
        <Separator />
        <div className="text-xs text-zinc-500">⌘↵ Approve • ⌘⌫ Reject</div>
      </div>

      <div className="flex-1 overflow-hidden border-r bg-zinc-50">
        <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-zinc-600">
          <span>
            {isLoading
              ? "Loading suggestions…"
              : isError
              ? "Unable to load suggestions"
              : `${filtered.length} of ${mappedCandidates.length} candidates`}
          </span>
          {isFetching && !isLoading && <span className="text-xs text-zinc-500">Refreshing…</span>}
        </div>
        <div className="h-full overflow-auto p-3">
          {isError && (
            <Card className="border-red-200 bg-red-50 text-red-700">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Failed to load candidates</CardTitle>
                <CardDescription>{(error as Error)?.message ?? "Unexpected error"}</CardDescription>
              </CardHeader>
            </Card>
          )}
          {!isError && filtered.length === 0 && !isLoading ? (
            <div className="p-6 text-sm text-zinc-500">No candidates match your filters.</div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((candidate) => (
                <Card
                  key={candidate.id}
                  className={`cursor-pointer transition ${selected?.id === candidate.id ? "ring-2 ring-zinc-300" : ""}`}
                  onClick={() => setSelectedId(candidate.id)}
                >
                  <CardHeader className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{candidate.title}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-2 text-xs">
                          <Badge className={TYPE_COLORS[candidate.type ?? "semantic"]}>{candidate.type ?? "semantic"}</Badge>
                          <span className="text-zinc-600">{candidate.branch}</span>
                          <span className="inline-flex items-center gap-1 text-zinc-500">
                            <Clock className="h-3 w-3" />
                            score {Math.round((candidate.score ?? candidate.salience) * 100) / 100}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={SENS_COLORS[candidate.sensitivity ?? "low"]}>
                          {candidate.sensitivity ?? "low"}
                        </Badge>
                        <div className="w-32">
                          <ScoreBar value={candidate.salience} />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              {isLoading && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base text-zinc-500">Fetching candidates…</CardTitle>
                  </CardHeader>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-[36rem] bg-white p-4">
        {selected ? (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selected.title}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={TYPE_COLORS[selected.type ?? "semantic"]}>{selected.type ?? "semantic"}</Badge>
                  <Badge variant="secondary">{selected.branch}</Badge>
                  <Badge className={SENS_COLORS[selected.sensitivity ?? "low"]}>
                    {selected.sensitivity ?? "low"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(JSON.stringify(selected))}>
                  <Copy className="mr-1 h-4 w-4" /> Copy JSON
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="mr-1 h-4 w-4" /> Preview JSON
                </Button>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="space-y-3 overflow-auto pr-1">
              <DetailRow label="Why suggested">
                <p className="text-sm text-zinc-700">{selected.rationale ?? "Returned by the retrieval service."}</p>
              </DetailRow>
              <DetailRow label="Salience">
                <div className="w-48">
                  <ScoreBar value={selected.salience} />
                </div>
              </DetailRow>
              <DetailRow label="Provenance">
                {selected.provenance?.length ? (
                  <div className="space-y-2">
                    {selected.provenance.map((p, index) => (
                      <div key={`${p.service}-${index}`} className="rounded border bg-zinc-50 p-2 text-xs">
                        <div className="text-zinc-600">
                          {p.service} • {new Date(p.timestamp).toLocaleString()}
                        </div>
                        {p.snippet && <div className="mt-1 text-zinc-800">“{p.snippet}”</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500">Not supplied</span>
                )}
              </DetailRow>
              <DetailRow label="Access plan">
                <div className="flex items-center gap-2 text-xs text-zinc-700">
                  <Shield className="h-3 w-3" /> Default scopes pending backend wiring
                </div>
              </DetailRow>
            </div>
            <div className="mt-auto flex items-center justify-between pt-4">
              <div className="text-xs text-zinc-500">⌘↵ Approve • ⌘⌫ Reject</div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  disabled={actionDisabled}
                  onClick={() => selected && rejectMutation.mutate(selected)}
                >
                  <X className="mr-1 h-4 w-4" /> Reject
                </Button>
                <Button disabled={actionDisabled} onClick={() => selected && approveMutation.mutate(selected)}>
                  <Check className="mr-1 h-4 w-4" /> Approve
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Select a candidate to inspect.
          </div>
        )}
      </div>
    </div>
  );
}
