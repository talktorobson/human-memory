import { useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScoreBar } from "./ScoreBar";
import { Memory } from "../types/memory";
import { useMemoriesSearch } from "../api/memories";

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

export interface SearchPaneProps {
  onOpenMemory?: (memory: Memory) => void;
}

export function SearchPane({ onOpenMemory }: SearchPaneProps) {
  const [query, setQuery] = useState("Normandy");
  const [limit, setLimit] = useState(10);

  const { data, isLoading, isError, error, refetch, isFetching } = useMemoriesSearch({ query, limit });

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 min-w-[16rem]">
          <Search className="h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search memories…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Input
          type="number"
          value={limit}
          min={1}
          max={20}
          className="w-24"
          onChange={(event) => setLimit(Number(event.target.value))}
        />
        <Button variant="outline" onClick={() => refetch()} disabled={!query.trim() || isFetching}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Results</CardTitle>
          <CardDescription>
            {isLoading
              ? "Querying gateway…"
              : isError
              ? "Failed to search"
              : `${data?.results.length ?? 0} memories`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Branch</th>
                  <th className="px-3 py-2">Salience</th>
                  <th className="px-3 py-2">Sensitivity</th>
                  <th className="px-3 py-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {isError && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-red-600">
                      {(error as Error)?.message ?? "Unexpected error"}
                    </td>
                  </tr>
                )}
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-zinc-500">
                      Loading search results…
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && (data?.results.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-zinc-500">
                      No memories found for “{query}”.
                    </td>
                  </tr>
                )}
                {data?.results.map((hit) => (
                  <tr key={hit.memory.id} className="border-t hover:bg-zinc-50">
                    <td className="px-3 py-2 align-middle">
                      <div className="w-24">
                        <ScoreBar value={hit.score} />
                      </div>
                    </td>
                    <td className="px-3 py-2">{hit.memory.title}</td>
                    <td className="px-3 py-2">
                      <Badge className={TYPE_COLORS[hit.memory.type ?? "semantic"]}>{hit.memory.type ?? "semantic"}</Badge>
                    </td>
                    <td className="px-3 py-2">{hit.memory.branch}</td>
                    <td className="px-3 py-2">{Math.round(hit.memory.salience * 100)}%</td>
                    <td className="px-3 py-2">
                      <Badge className={SENS_COLORS[hit.memory.sensitivity ?? "low"]}>
                        {hit.memory.sensitivity ?? "low"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenMemory?.(hit.memory)}
                      >
                        Open
                      </Button>
                    </td>
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
