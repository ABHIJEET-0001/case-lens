/**
 * src/lib/api.ts
 * ──────────────
 * Typed API Client for CaseLens backend services.
 */
import { CourtCase, UserProfile, UserRole, SHAPFactor, SystemStatusTelemetry, Precedent } from "./types";

const TOKEN_KEY = "caselens_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearStoredToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export interface HealthStatus {
  status: "ok" | "degraded" | "offline" | "checking";
  db: string;
  index_loaded?: boolean;
  version?: string;
  environment?: string;
  embedding_model?: string;
  embedding_dimension?: number;
}

/**
 * Health check with timeout
 */
export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("/api/v1/health", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { status: "offline", db: "error" };
    }
    const data = await res.json();
    return {
      status: data.status === "ok" ? "ok" : data.status === "degraded" ? "degraded" : "offline",
      db: data.db || "disconnected",
      index_loaded: data.index_loaded,
      version: data.version,
      environment: data.environment,
      embedding_model: data.embedding_model,
      embedding_dimension: data.embedding_dimension,
    };
  } catch {
    return { status: "offline", db: "unreachable" };
  }
}

/**
 * Auth: Read current authenticated user
 */
export async function fetchCurrentUser(): Promise<UserProfile | null> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch("/api/v1/auth/me", { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name || data.email,
      role: (data.role?.toLowerCase() as UserRole) || "judge",
      isActive: data.is_active,
    };
  } catch {
    return null;
  }
}

/**
 * Auth: Switch demo role and acquire valid JWT
 */
export async function switchDemoRole(role: UserRole): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/v1/auth/demo-switch/${role}`, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access_token) {
      setStoredToken(data.access_token);
    }
    const u = data.user;
    return {
      id: u.id,
      email: u.email,
      fullName: u.full_name || u.email,
      role: (u.role?.toLowerCase() as UserRole) || role,
      isActive: u.is_active,
    };
  } catch {
    return null;
  }
}

/**
 * Convert backend case schema to UI CourtCase
 */
export function mapBackendCaseToCourtCase(c: any): CourtCase {
  let shapFactors: SHAPFactor[] = [];
  if (typeof c.shap_reasons === "string" && c.shap_reasons.trim()) {
    try {
      const parsed = JSON.parse(c.shap_reasons);
      if (Array.isArray(parsed)) {
        shapFactors = parsed.map((item: any) => ({
          feature: item.feature || "Precedent Alignment",
          impact: item.impact || "reduces_delay",
          impactDays: item.impact_days ?? 0,
          plainEnglishReason: item.plain_english_reason || item.reason || "",
        }));
      }
    } catch {
      shapFactors = [];
    }
  }

  // Derive parties from description or defaults
  let petitioner = "Petitioner";
  let respondent = "State of India";
  if (c.description && c.description.toLowerCase().includes("vs")) {
    const parts = c.description.split(/vs\.?|versus/i);
    if (parts.length >= 2) {
      petitioner = parts[0].trim().slice(0, 40);
      respondent = parts[1].trim().slice(0, 40);
    }
  } else if (c.case_no) {
    petitioner = `Petitioner (${c.case_no})`;
    respondent = "Respondent Authority";
  }

  const predDays = Math.round(c.predicted_days || 90);

  return {
    id: c.id,
    caseNo: c.case_no,
    caseType: c.case_type || "CRL.A",
    court: c.court,
    filingDate: c.filing_date,
    hearingsCount: c.hearings_count || 1,
    status: (c.status?.toLowerCase() as any) || "pending",
    bench: c.court.includes("Supreme") ? "Division Bench IV" : "Single Bench (Writ)",
    petitioner,
    respondent,
    actsSections: ["Constitution Art. 21", "CrPC Sec. 439"],
    description: c.description || "Active petition pending registry hearing.",
    top1Similarity: c.top1_similarity ?? 0.75,
    meanTop5Similarity: c.mean_top5_similarity ?? 0.68,
    countAboveThreshold: c.count_above_threshold ?? 2,
    matchedPrecedentIds: ["prec-001", "prec-002"],
    prediction: {
      predictedDays: predDays,
      complexity: (c.complexity as any) || "Medium",
      priorityScore: c.priority_score ?? 70.0,
      confidenceIntervalDays: [Math.max(15, predDays - 25), predDays + 35],
      precedentConfidence: c.top1_similarity ?? 0.8,
      shapFactors: shapFactors.length > 0 ? shapFactors : [
        {
          feature: "Precedent Convergence",
          impact: "reduces_delay",
          impactDays: -30,
          plainEnglishReason: "Settled constitutional authority narrows deliberative scope.",
        },
      ],
    },
  };
}

/**
 * Fetch Cases from real API
 */
export async function fetchCases(court?: string): Promise<{ total: number; cases: CourtCase[] }> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = new URL("/api/v1/cases", window.location.origin);
    if (court && court !== "all") {
      url.searchParams.set("court", court);
    }

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch cases: ${res.status}`);
    }
    const data = await res.json();
    const mapped = (data.cases || []).map(mapBackendCaseToCourtCase);
    return {
      total: data.total ?? mapped.length,
      cases: mapped,
    };
  } catch (err) {
    console.error("fetchCases error:", err);
    return { total: 0, cases: [] };
  }
}

/**
 * Create a new Case in the real database
 */
export async function registerNewCase(caseIn: {
  caseNo: string;
  caseType: string;
  court: string;
  filingDate: string;
  hearingsCount: number;
  description: string;
}): Promise<CourtCase | null> {
  try {
    const token = getStoredToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const payload = {
      case_no: caseIn.caseNo,
      case_type: caseIn.caseType,
      court: caseIn.court,
      filing_date: caseIn.filingDate,
      hearings_count: caseIn.hearingsCount,
      description: caseIn.description,
      status: "pending",
    };

    const res = await fetch("/api/v1/cases", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed");
    }

    const data = await res.json();
    return mapBackendCaseToCourtCase(data);
  } catch (err) {
    console.error("registerNewCase error:", err);
    throw err;
  }
}

/**
 * Fetch System Runtime Status & Corpus Diagnostics
 */
export async function fetchSystemStatus(): Promise<SystemStatusTelemetry | null> {
  try {
    const res = await fetch("/api/v1/system/status", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("fetchSystemStatus error:", err);
    return null;
  }
}

/**
 * Fetch live caseload count from backend
 */
export async function fetchCasesCount(): Promise<number> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = getStoredToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch("/api/v1/cases/count", { headers });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch benchmark model evaluation metrics from backend
 */
export async function fetchModelMetrics(): Promise<{
  metrics: import("./types").ModelMetricComparison[];
  featureImportance: import("./types").FeatureImportance[];
} | null> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = getStoredToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch("/api/v1/model/metrics", { headers });
    if (!res.ok) return null;
    const data = await res.json();
    const metrics: import("./types").ModelMetricComparison[] = (data.comparison || []).map((row: any) => ({
      metric: row.metric,
      metadataOnly: row.metadata_only,
      withPrecedents: row.with_precedents,
      improvementPct: row.improvement_pct,
      unit: row.unit,
    }));
    const featureImportance: import("./types").FeatureImportance[] = (data.feature_importance || []).map((f: any) => ({
      rank: f.rank,
      featureName: f.feature_name,
      category: f.category || "Precedent Intelligence",
      meanShap: f.importance_score,
      direction: "Reduces delay variance",
      description: `Feature weight in gradient boosting tree: ${f.importance_score}`,
    }));
    return { metrics, featureImportance };
  } catch (err) {
    console.error("fetchModelMetrics error:", err);
    return null;
  }
}

/**
 * Perform precedent search against hybrid backend
 */
export async function searchPrecedents(
  query: string,
  method: "hybrid" | "semantic" | "keyword" = "hybrid",
  filters?: { court?: string; case_type?: string }
): Promise<Precedent[]> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const token = getStoredToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch("/api/v1/search", {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        method,
        top_k: 20,
        filters: filters || {},
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      citation: r.citation,
      court: r.court,
      caseType: r.case_type,
      judgmentDate: r.judgment_date,
      outcome: r.outcome,
      bench: r.bench,
      similarityScore: r.similarity_score,
      keywordScore: r.keyword_score,
      wordCount: r.word_count || 0,
      summary: r.summary || {
        facts: r.matched_snippet || "",
        issue: "Statutory interpretation and application.",
        holding: "Judgment rendered according to law.",
        outcomeText: r.outcome,
      },
      matchedSnippets: [r.matched_snippet].filter(Boolean),
      fullText: r.matched_snippet || "",
    }));
  } catch (err) {
    console.error("searchPrecedents error:", err);
    return [];
  }
}

