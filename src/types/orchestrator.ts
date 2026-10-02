export type OrchestrationMode = 
  | 'tri-synthesis' 
  | 'specialist-routing' 
  | 'debate-consensus' 
  | 'parallel-swarm';

export interface ApiKeys {
  gemini?: string;
  groq?: string;
  deepseek?: string;
}

export interface ModelSelection {
  gemini: string;
  groq: string;
  deepseek: string;
}

export interface SpecialistNodeTelemetry {
  category: string;
  model: string;
  latencyMs: number;
  isLive: boolean;
  status: string;
  output: string;
}

export interface OrchestrationResult {
  success: boolean;
  mode: OrchestrationMode;
  prompt: string;
  masterSolution: string;
  telemetry: {
    totalLatencyMs: number;
    nodes: {
      groq: SpecialistNodeTelemetry;
      deepseek: SpecialistNodeTelemetry;
      gemini: SpecialistNodeTelemetry;
    };
    consensusConfidence: number;
    specializationWeights: {
      executionSpeed: number;
      analyticalDepth: number;
      cognitiveSynthesis: number;
    };
  };
  timestamp?: number;
}

export interface PresetPrompt {
  id: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
  mode: OrchestrationMode;
  icon: string;
}

export const AVAILABLE_MODELS = {
  gemini: [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Flagship General & Synthesis)', default: true },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (High Throughput)' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Complex Reasoning)' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Meta via Groq LPU)', default: true },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra-Low Latency)', default: false },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (MoE Architecture)' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B (Groq LPU)' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek-V3 (State-of-the-Art General & Code)', default: true },
    { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Deep Chain-of-Thought Reasoning)' },
  ],
};

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: 'system-arch',
    title: 'High-Concurrency Event Bus',
    category: 'Architecture & Scalability',
    description: 'Design a distributed event-driven message bus capable of 1M+ RPS with zero message loss.',
    prompt: `Design a high-throughput, low-latency distributed event streaming architecture capable of ingesting 1,000,000 events/second with sub-10ms delivery guarantees and zero data loss under network partitions. 
Include:
1. Producer-broker-consumer pipeline with backpressure strategies
2. Storage tier, compaction, and deduplication idempotency keys
3. Failure recovery, leader election, and distributed consensus
4. Concrete TypeScript / Go implementation pattern for the core broker worker`,
    mode: 'tri-synthesis',
    icon: 'Layers',
  },
  {
    id: 'algorithmic-hard',
    title: 'Complex Graph Dynamic Programming',
    category: 'Deep Algorithmic Rigor',
    description: 'Solve the Minimum Cost Hamiltonian Cycle with real-time dynamic edge weight fluctuations.',
    prompt: `Formally prove and implement an optimal approximation algorithm for the Minimum Cost Path in a directed weighted graph where edge weights change dynamically according to a Poisson arrival process.
1. Provide mathematical invariants, state space definition, and complexity bounds.
2. Outline the algorithmic proof of correctness and edge-case handling for zero/negative cycles.
3. Write clean, memory-efficient production code in Python or TypeScript with strict type annotations.`,
    mode: 'tri-synthesis',
    icon: 'Cpu',
  },
  {
    id: 'security-audit',
    title: 'Zero-Knowledge & Auth Guard Audit',
    category: 'Security & Verification',
    description: 'Audit an enterprise OAuth2 + PKCE + WebAuthn cryptographic authentication boundary.',
    prompt: `Perform an exhaustive security audit on a mission-critical Auth Gateway implementing OAuth 2.1 with PKCE, JWT with asymmetric rotating keys (Ed25519), and WebAuthn FIDO2 biometrics.
1. Identify all potential attack vectors (replay attacks, timing attacks, confused deputy, token substitution).
2. Detail cryptographic proof verification and formal state validation.
3. Provide hardened implementation snippets for constant-time comparison, token verification, and automated key rotation.`,
    mode: 'tri-synthesis',
    icon: 'ShieldCheck',
  },
  {
    id: 'ai-debate',
    title: 'Monolith vs Microservices Dilemma',
    category: 'Consensus Debate',
    description: 'Debate modular monolith vs event-driven microservices for a 50-engineer fintech startup.',
    prompt: `A Series B fintech startup with 50 engineers processing $500M in transaction volume is debating whether to migrate their modular monolithic PostgreSQL core to event-driven Kubernetes microservices. 
1. Present the rigorous arguments for both sides.
2. Cross-examine the operational overhead, latency penalties, distributed transaction headaches (Saga pattern vs 2PC), and development velocity.
3. Synthesize a definitive consensus roadmap with milestone triggers.`,
    mode: 'debate-consensus',
    icon: 'GitFork',
  },
];
