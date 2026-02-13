export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000";

export const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

export const BLOOM_COLORS: Record<string, string> = {
  knowledge: "#22d3ee",
  comprehension: "#34d399",
  application: "#fbbf24",
  analysis: "#f97316",
  synthesis: "#a78bfa",
  evaluation: "#f43f5e",
};
