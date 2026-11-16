/**
 * CaseLens TypeScript Definitions
 * Judicial Intelligence Platform
 */

export type UserRole = "clerk" | "researcher" | "judge";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export type ComplexityLevel = "Low" | "Medium" | "High";

export type CaseStatus = "pending" | "hearing" | "reserved" | "disposed";

export interface PrecedentSummary {
  facts: string;
  issue: string;
  holding: string;
  outcomeText: string;
}

export interface Precedent {
  id: string;
  title: string;
  citation: string;
  court: string;
  caseType: string;
  judgmentDate: string;
  outcome: "Allowed" | "Dismissed" | "Disposed" | "Remanded" | "Quashed";
  bench: string;
  similarityScore: number;
  keywordScore: number;
  wordCount: number;
  summary: PrecedentSummary;
  matchedSnippets: string[];
  fullText: string;
}

export interface SHAPFactor {
  feature: string;
  impact: "reduces_delay" | "increases_delay" | "neutral";
  impactDays: number;
  plainEnglishReason: string;
}

export interface CasePrediction {
  predictedDays: number;
  complexity: ComplexityLevel;
  priorityScore: number; // 0 - 100
  confidenceIntervalDays: [number, number];
  shapFactors: SHAPFactor[];
  precedentConfidence: number; // 0 - 1
}

export interface CourtCase {
  id: string;
  caseNo: string;
  caseType: string;
  court: string;
  filingDate: string;
  hearingsCount: number;
  status: CaseStatus;
  bench: string;
  petitioner: string;
  respondent: string;
  actsSections: string[];
  description: string;
  top1Similarity: number;
  meanTop5Similarity: number;
  countAboveThreshold: number;
  prediction: CasePrediction;
  matchedPrecedentIds: string[];
}

export interface ModelMetricComparison {
  metric: string;
  metadataOnly: number;
  withPrecedents: number;
  improvementPct: number;
  unit: string;
}

export interface FeatureImportance {
  rank: number;
  featureName: string;
  category: "Precedent Intelligence" | "Case Metadata" | "Procedural";
  meanShap: number;
  direction: string;
  description: string;
}
