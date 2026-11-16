import React, { useState } from "react";
import { CourtCase, Precedent } from "@/lib/types";
import {
  ScaleIcon,
  ClockIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  FileTextIcon,
} from "../icons";

interface CaseDetailViewProps {
  currentCase: CourtCase;
  precedents: Precedent[];
  allCases: CourtCase[];
  onSelectAnotherCase: (caseId: string) => void;
  onNavigateToResearch: (query: string) => void;
}

export function CaseDetailView({
  currentCase,
  precedents,
  allCases,
  onSelectAnotherCase,
  onNavigateToResearch,
}: CaseDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"factors" | "all-precedents">("factors");

  // Matched precedents for this case
  const matchedPrecedents = precedents.filter((p) =>
    currentCase.matchedPrecedentIds.includes(p.id)
  );

  return (
    <div className="space-y-5">
      {/* Top Breadcrumb & Case Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#e2ded6] gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded bg-[#1c3838] text-white flex items-center justify-center font-mono text-xs font-bold">
            §
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif text-xl font-bold text-[#16191c]">
                {currentCase.caseNo}
              </h1>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                  currentCase.status === "reserved"
                    ? "bg-[#eaf4ed] text-[#1f5938] border-[#c0dfc9]"
                    : currentCase.status === "hearing"
                    ? "bg-[#fcf5e8] text-[#8c6218] border-[#f0debe]"
                    : "bg-[#edf1f7] text-[#1d4875] border-[#c8d8ec]"
                }`}
              >
                {currentCase.status}
              </span>
            </div>
            <p className="text-xs text-[#636a73] font-sans">
              {currentCase.court} • {currentCase.bench}
            </p>
          </div>
        </div>

        {/* Switch Case Dropdown */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-mono text-[11px] text-[#636a73]">Inspect Case:</span>
          <select
            value={currentCase.id}
            onChange={(e) => onSelectAnotherCase(e.target.value)}
            className="bg-white border border-[#cfc9be] rounded px-2.5 py-1 text-xs font-mono font-medium text-[#16191c] focus:outline-none focus:border-[#1c3838]"
          >
            {allCases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseNo} ({c.petitioner.split(" ")[0]} vs {c.respondent.split(" ")[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CORE SPLIT VIEW: Left = Case Facts | Right = Precedent Intelligence & SHAP Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Case Metadata, Registry Details, Full Description (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Metadata Dossier Card */}
          <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4 space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#636a73] font-semibold pb-2 border-b border-[#ede9e1]">
              Court Registry Record
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[#787f8a] block text-[11px]">Petitioner(s)</span>
                <span className="font-medium text-[#181a1d]">{currentCase.petitioner}</span>
              </div>

              <div>
                <span className="text-[#787f8a] block text-[11px]">Respondent(s)</span>
                <span className="font-medium text-[#181a1d]">{currentCase.respondent}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div>
                  <span className="text-[#787f8a] block">Filing Date</span>
                  <span className="font-bold text-[#181a1d]">{currentCase.filingDate}</span>
                </div>
                <div>
                  <span className="text-[#787f8a] block">Recorded Hearings</span>
                  <span className="font-bold text-[#181a1d]">{currentCase.hearingsCount} sessions</span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[#787f8a] block text-[11px] mb-1">Applicable Acts & Sections</span>
                <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                  {currentCase.actsSections.map((sec, idx) => (
                    <span
                      key={idx}
                      className="bg-[#f0ece5] text-[#33383f] px-2 py-0.5 rounded border border-[#dedad0]"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Facts Description Card */}
          <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4 space-y-2.5">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#636a73] font-semibold">
              Factual Matrix & Submissions
            </div>

            <p className="text-xs leading-relaxed text-[#353a42] font-sans">
              {currentCase.description}
            </p>

            <div className="pt-2">
              <button
                onClick={() => onNavigateToResearch(currentCase.actsSections[0] || currentCase.caseType)}
                className="text-xs font-mono text-[#1c3838] hover:underline flex items-center space-x-1 font-semibold"
              >
                <span>Search Similar Precedents in Corpus →</span>
              </button>
            </div>
          </div>

          {/* Procedural History Timeline */}
          <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4 space-y-2.5 text-xs">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#636a73] font-semibold">
              Hearing Milestones
            </div>

            <div className="space-y-2 font-mono text-[11px] border-l-2 border-[#1c3838]/40 pl-3">
              <div>
                <span className="text-[#7a818c]">Listing 14 • 14-Oct-2024:</span>
                <p className="text-[#181a1d] font-sans">
                  Arguments heard on applicability of Article 21 to twin conditions. Notice issued.
                </p>
              </div>
              <div>
                <span className="text-[#7a818c]">Listing 11 • 22-Jul-2024:</span>
                <p className="text-[#181a1d] font-sans">
                  Enforcement Directorate granted 3 weeks to file supplementary status report.
                </p>
              </div>
              <div>
                <span className="text-[#7a818c]">Listing 1 • 12-Apr-2023:</span>
                <p className="text-[#181a1d] font-sans">
                  Special Leave Petition admitted; lower court records requisitioned.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Precedent Retrieval Feeds Prediction Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* CAUSAL PREDICTION HERO PANEL */}
          <div className="bg-[#fcfbf9] border border-[#c4bfb4] rounded p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#ede9e1]">
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-[#1c3838]" />
                <span className="font-serif text-base font-bold text-[#16191c]">
                  Resolution Forecast & Prioritization
                </span>
              </div>

              <div className="flex items-center space-x-1 text-[11px] font-mono text-[#1f5938] bg-[#eaf4ed] px-2 py-0.5 rounded border border-[#c0dfc9]">
                <span>Precedent Confidence:</span>
                <strong>{(currentCase.prediction.precedentConfidence * 100).toFixed(0)}%</strong>
              </div>
            </div>

            {/* 3 Metric Badges: Predicted Days | Complexity | Priority Index */}
            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="bg-[#f6f4ee] border border-[#dedad0] rounded p-3 text-center">
                <span className="text-[10px] text-[#737a84] uppercase block">
                  Est. Resolution
                </span>
                <span className="text-2xl font-bold text-[#16191c]">
                  {currentCase.prediction.predictedDays}
                </span>
                <span className="text-[10px] text-[#636a73] block mt-0.5">
                  Days (±{currentCase.prediction.confidenceIntervalDays[1] - currentCase.prediction.predictedDays}d CI)
                </span>
              </div>

              <div className="bg-[#f6f4ee] border border-[#dedad0] rounded p-3 text-center">
                <span className="text-[10px] text-[#737a84] uppercase block">
                  Complexity
                </span>
                <span
                  className={`text-xl font-bold inline-block mt-0.5 ${
                    currentCase.prediction.complexity === "High"
                      ? "text-[#73202f]"
                      : currentCase.prediction.complexity === "Medium"
                      ? "text-[#8c6218]"
                      : "text-[#1f5938]"
                  }`}
                >
                  {currentCase.prediction.complexity}
                </span>
                <span className="text-[10px] text-[#636a73] block mt-0.5">
                  XGBoost Regressor
                </span>
              </div>

              <div className="bg-[#f6f4ee] border border-[#dedad0] rounded p-3 text-center">
                <span className="text-[10px] text-[#737a84] uppercase block">
                  Priority Score
                </span>
                <span className="text-2xl font-bold text-[#73202f]">
                  {currentCase.prediction.priorityScore.toFixed(1)}
                </span>
                <span className="text-[10px] text-[#73202f] block font-semibold mt-0.5">
                  Rank #1 on Docket
                </span>
              </div>
            </div>

            {/* Causal Explanation: Why Precedent Feeds Prediction */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[#181a1d]">
                  SHAP Explainability Factors (Why this duration?)
                </span>
                <span className="text-[11px] font-mono text-[#636a73]">
                  Additive Attribution Days
                </span>
              </div>

              <div className="space-y-2 font-sans text-xs">
                {currentCase.prediction.shapFactors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-white border border-[#e5e1d7] flex items-start space-x-3"
                  >
                    <div className="shrink-0 mt-0.5">
                      {factor.impact === "reduces_delay" ? (
                        <div className="w-5 h-5 rounded-full bg-[#eaf4ed] text-[#1f5938] flex items-center justify-center font-bold font-mono text-[11px]">
                          ↓
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#fbeff1] text-[#73202f] flex items-center justify-center font-bold font-mono text-[11px]">
                          ↑
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#181a1d]">
                          {factor.feature}
                        </span>
                        <span
                          className={`font-mono text-xs font-bold ${
                            factor.impact === "reduces_delay"
                              ? "text-[#1f5938]"
                              : "text-[#73202f]"
                          }`}
                        >
                          {factor.impactDays > 0 ? `+${factor.impactDays}` : factor.impactDays} Days
                        </span>
                      </div>
                      <p className="text-[11px] text-[#4a5058] mt-0.5 leading-snug">
                        {factor.plainEnglishReason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TOP MATCHED PRECEDENTS PANEL (Visual Connection) */}
          <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#ede9e1]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#16191c]">
                  Retrieved Precedent Authorities ({matchedPrecedents.length})
                </h3>
                <p className="text-[11px] text-[#636a73]">
                  Past Indian judgments providing ratio decidendi for this case
                </p>
              </div>

              <div className="text-[11px] font-mono text-[#1c3838] font-bold">
                Cosine Similarity: {(currentCase.top1Similarity * 100).toFixed(1)}% Top Match
              </div>
            </div>

            <div className="space-y-2.5">
              {matchedPrecedents.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded bg-white border border-[#e5e1d7] space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-serif text-sm font-bold text-[#181a1d] hover:text-[#1c3838]">
                        {p.title}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-mono text-[#636a73]">
                        <span className="font-semibold text-[#181a1d]">{p.citation}</span>
                        <span>•</span>
                        <span>{p.court}</span>
                        <span>•</span>
                        <span>{p.judgmentDate}</span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs shrink-0">
                      <span className="font-bold text-[#1c3838]">
                        {(p.similarityScore * 100).toFixed(1)}%
                      </span>
                      <div className="text-[10px] text-[#737a84]">Vector Match</div>
                    </div>
                  </div>

                  <p className="text-xs text-[#3b4047] leading-relaxed line-clamp-2">
                    <strong>Holding:</strong> {p.summary.holding}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
