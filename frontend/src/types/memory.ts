export type MemoryType = "semantic" | "episodic" | "procedural" | "prospective";

export type Sensitivity = "low" | "medium" | "high";

export interface MemoryProvenance {
  service: string;
  timestamp: string;
  snippet?: string;
}

export interface MemoryLink {
  rel: string;
  to: string;
}

export interface Memory {
  id: string;
  title: string;
  branch: string;
  salience: number;
  content: Record<string, unknown> | string;
  type?: MemoryType;
  sensitivity?: Sensitivity;
  updatedAt?: string;
  provenance?: MemoryProvenance[];
  links?: MemoryLink[];
}

export interface CandidateConflict {
  memoryId: string;
  kind: "update" | "contradicts";
}

export interface Candidate extends Omit<Memory, "content" | "updatedAt"> {
  rationale?: string;
  conflicts?: CandidateConflict[];
  score?: number;
}

export interface Client {
  id: string;
  name: string;
  branches: string[];
  types: MemoryType[];
  sensitivityMax: Sensitivity;
  lastAccess?: string;
  enabled: boolean;
}

export interface MemorySearchHit {
  memory: Memory;
  score: number;
}

export interface MemorySearchRequest {
  query: string;
  limit?: number;
}

export interface MemorySearchResponse {
  results: MemorySearchHit[];
}

export interface RetrieveForTaskRequest {
  task: string;
  branch?: string;
  limit?: number;
}

export interface RetrieveForTaskResponse {
  task: string;
  context: MemorySearchHit[];
}
