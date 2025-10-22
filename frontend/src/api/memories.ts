import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  Candidate,
  Memory,
  MemorySearchHit,
  MemorySearchRequest,
  MemorySearchResponse,
  RetrieveForTaskRequest,
  RetrieveForTaskResponse,
} from "../types/memory";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

type RawMemoryPayload = {
  memory_id: string;
  title: string;
  branch: string;
  content: string;
  salience: number;
};

type RawMemorySearchHit = {
  memory: RawMemoryPayload;
  score: number;
};

type RawMemorySearchResponse = {
  results: RawMemorySearchHit[];
};

type RawRetrieveForTaskResponse = {
  task: string;
  context: RawMemorySearchHit[];
};

function mapMemory(raw: RawMemoryPayload): Memory {
  let parsed: Record<string, unknown> | string = raw.content;
  try {
    parsed = JSON.parse(raw.content);
  } catch (err) {
    parsed = raw.content;
  }

  return {
    id: raw.memory_id,
    title: raw.title,
    branch: raw.branch,
    salience: raw.salience,
    content: parsed,
  };
}

function mapHit(raw: RawMemorySearchHit): MemorySearchHit {
  return {
    memory: mapMemory(raw.memory),
    score: raw.score,
  };
}

async function postJson<TInput, TOutput>(path: string, payload: TInput): Promise<TOutput> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as TOutput;
}

export async function searchMemories(payload: MemorySearchRequest): Promise<MemorySearchResponse> {
  const raw = await postJson<MemorySearchRequest, RawMemorySearchResponse>("/memories/search", payload);
  return {
    results: raw.results.map(mapHit),
  };
}

export async function retrieveForTask(payload: RetrieveForTaskRequest): Promise<RetrieveForTaskResponse> {
  const raw = await postJson<RetrieveForTaskRequest, RawRetrieveForTaskResponse>("/memories/retrieve_for_task", payload);
  return {
    task: raw.task,
    context: raw.context.map(mapHit),
  };
}

export function useMemoriesSearch(
  payload: MemorySearchRequest,
  options?: Omit<UseQueryOptions<MemorySearchResponse>, "queryKey" | "queryFn">
) {
  return useQuery<MemorySearchResponse>({
    queryKey: ["memories", "search", payload],
    queryFn: () => searchMemories(payload),
    enabled: Boolean(payload.query?.trim()),
    ...options,
  });
}

export function useRetrieveForTask(payload: RetrieveForTaskRequest, enabled = true) {
  return useQuery<RetrieveForTaskResponse>({
    queryKey: ["memories", "retrieve", payload],
    queryFn: () => retrieveForTask(payload),
    enabled: enabled && Boolean(payload.task?.trim()),
  });
}

export function useApproveCandidate(onSuccess?: (candidate: Candidate) => void) {
  return useMutation({
    mutationFn: async (candidate: Candidate) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return candidate;
    },
    onSuccess,
  });
}

export function useRejectCandidate(onSuccess?: (candidate: Candidate) => void) {
  return useMutation({
    mutationFn: async (candidate: Candidate) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return candidate;
    },
    onSuccess,
  });
}
