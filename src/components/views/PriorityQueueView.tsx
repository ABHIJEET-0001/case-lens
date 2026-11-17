import React, { useState } from "react";
import { CourtCase } from "@/lib/types";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  ScaleIcon,
  FilterIcon,
} from "../icons";

interface PriorityQueueViewProps {
  cases: CourtCase[];
  onSelectCase: (caseId: string) => void;
  isLoading?: boolean;
}

export function PriorityQueueView({ cases, onSelectCase, isLoading }: PriorityQueueViewProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "fast-track" | "attention">("all");

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-[#edeae3] rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="h-16 bg-[#edeae3] rounded"></div>
          <div className="h-16 bg-[#edeae3] rounded"></div>
          <div className="h-16 bg-[#edeae3] rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-20 bg-[#edeae3] rounded"></div>
          <div className="h-20 bg-[#edeae3] rounded"></div>
          <div className="h-20 bg-[#edeae3] rounded"></div>
        </div>
      </div>
    );
  }

  // Sorted by priorityScore descending
  const sortedCases = [...cases].sort(
    (a, b) => b.prediction.priorityScore - a.prediction.priorityScore
  );

  const fastTrackCases = sortedCases.filter(
    (c) => c.top1Similarity >= 0.80 && c.prediction.predictedDays <= 120
  );

  const attentionCases = sortedCases.filter(
    (c) => c.hearingsCount >= 15 || c.prediction.complexity === "High" || c.prediction.priorityScore >= 80
  );

  const displayedCases =
    activeFilter === "fast-track"
      ? fastTrackCases
      : activeFilter === "attention"
      ? attentionCases
      : sortedCases;

  return (
    <div className="space-y-5">
      {/* Title & Queue Policy Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#e2ded6] gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#16191c]">
            Judicial Priority Queue
          </h1>
          <p className="text-xs text-[#636a73] font-sans mt-0.5">
            Automated docket ordering combining precedent clarity, statutory urgency, and constitutional liberty factors
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-[#525860]">
          <span className="bg-[#f2efe9] px-2.5 py-1 rounded border border-[#dedad0]">
            Policy: <strong>NJDG Fast-Track & Custody-Weighted</strong>
          </span>
        </div>
      </div>

      {/* Queue Category Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveFilter("all")}
          className={`p-3.5 rounded text-left border transition-all ${
            activeFilter === "all"
              ? "bg-[#1c3838] text-white border-[#1c3838] shadow-xs"
              : "bg-[#fcfbf9] text-[#181a1d] border-[#dedad0] hover:bg-[#f5f3ec]"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1 font-mono uppercase tracking-wider">
            <span>Entire Docket</span>
            <span>{sortedCases.length} Cases</span>
          </div>
          <div className="text-xl font-mono font-bold">Full Ranked Queue</div>
          <div className={`text-[11px] mt-1 ${activeFilter === "all" ? "text-[#c7d5d5]" : "text-[#636a73]"}`}>
            Global priority ordering across all active registry filings
          </div>
        </button>

        <button
          onClick={() => setActiveFilter("fast-track")}
          className={`p-3.5 rounded text-left border transition-all ${
            activeFilter === "fast-track"
              ? "bg-[#1f5938] text-white border-[#1f5938] shadow-xs"
              : "bg-[#fcfbf9] text-[#181a1d] border-[#dedad0] hover:bg-[#f5f3ec]"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1 font-mono uppercase tracking-wider">
            <span className="text-[#1f5938] font-bold">Fast-Track Eligible</span>
            <span className="font-bold">{fastTrackCases.length} Cases</span>
          </div>
          <div className="text-xl font-mono font-bold">High Precedent Clarity</div>
          <div className={`text-[11px] mt-1 ${activeFilter === "fast-track" ? "text-[#c2dfcc]" : "text-[#636a73]"}`}>
            Top precedent match &ge; 80%; settled legal ratio reduces hearing rounds
          </div>
        </button>

        <button
          onClick={() => setActiveFilter("attention")}
          className={`p-3.5 rounded text-left border transition-all ${
            activeFilter === "attention"
              ? "bg-[#73202f] text-white border-[#73202f] shadow-xs"
              : "bg-[#fcfbf9] text-[#181a1d] border-[#dedad0] hover:bg-[#f5f3ec]"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1 font-mono uppercase tracking-wider">
            <span className="text-[#73202f] font-bold">Needs Bench Attention</span>
            <span className="font-bold">{attentionCases.length} Cases</span>
          </div>
          <div className="text-xl font-mono font-bold">Heavy Incarceration / Delay</div>
          <div className={`text-[11px] mt-1 ${activeFilter === "attention" ? "text-[#f0cfd5]" : "text-[#636a73]"}`}>
            Extended pre-trial custody or &gt;15 hearings; expedited resolution required
          </div>
        </button>
      </div>

      {/* Priority Queue Ranked Table */}
      <div className="border border-[#dedad0] rounded bg-[#fcfbf9] overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#f4f2ec] border-b border-[#dedad0] font-mono text-[11px] text-[#555b63] uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center">Rank</th>
              <th className="py-2.5 px-3">Case ID</th>
              <th className="py-2.5 px-3">Subject & Parties</th>
              <th className="py-2.5 px-3">Jurisdiction</th>
              <th className="py-2.5 px-3 text-right">Precedent Strength</th>
              <th className="py-2.5 px-3 text-right">Est. Days</th>
              <th className="py-2.5 px-3 text-right">Priority Score</th>
              <th className="py-2.5 px-3 text-center">Eligibility Tag</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ede9e1] font-sans">
            {displayedCases.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-xs font-mono text-[#636a73]">
                  Zero cases meet the {activeFilter === "fast-track" ? "Fast-Track Eligible" : "Needs Bench Attention"} criteria.
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className="ml-2 text-[#1c3838] underline font-bold"
                  >
                    View Entire Ranked Docket
                  </button>
                </td>
              </tr>
            ) : (
              displayedCases.map((c, idx) => {
              const isFastTrack = c.top1Similarity >= 0.80 && c.prediction.predictedDays <= 120;
              const isAttention = c.prediction.priorityScore >= 80;

              return (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c.id)}
                  className="hover:bg-[#f6f4ee] transition-colors cursor-pointer group"
                >
                  {/* Rank */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-[#181a1d]">
                    #{idx + 1}
                  </td>

                  {/* Case ID */}
                  <td className="py-3 px-3 font-mono font-bold text-[#16191c] whitespace-nowrap">
                    {c.caseNo}
                  </td>

                  {/* Parties & Subject */}
                  <td className="py-3 px-3 max-w-sm">
                    <div className="font-medium text-[#181a1d] truncate">
                      {c.petitioner} vs {c.respondent}
                    </div>
                    <div className="text-[11px] text-[#636a73] line-clamp-1 mt-0.5">
                      {c.description}
                    </div>
                  </td>

                  {/* Court */}
                  <td className="py-3 px-3 text-[#444950] whitespace-nowrap">
                    {c.court}
                  </td>

                  {/* Precedent Strength */}
                  <td className="py-3 px-3 font-mono text-right whitespace-nowrap">
                    <span className="font-bold text-[#1c3838]">
                      {(c.top1Similarity * 100).toFixed(1)}%
                    </span>
                    <div className="text-[10px] text-[#787f8a]">
                      Avg: {(c.meanTop5Similarity * 100).toFixed(0)}%
                    </div>
                  </td>

                  {/* Est. Days */}
                  <td className="py-3 px-3 font-mono text-right font-bold text-[#181a1d] whitespace-nowrap">
                    {c.prediction.predictedDays} d
                  </td>

                  {/* Priority Score */}
                  <td className="py-3 px-3 font-mono text-right whitespace-nowrap">
                    <span
                      className={`text-sm font-bold ${
                        c.prediction.priorityScore >= 80
                          ? "text-[#73202f]"
                          : c.prediction.priorityScore >= 70
                          ? "text-[#8c6218]"
                          : "text-[#181a1d]"
                      }`}
                    >
                      {c.prediction.priorityScore.toFixed(1)}
                    </span>
                  </td>

                  {/* Tag */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {isFastTrack ? (
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#eaf4ed] text-[#1f5938] border border-[#c0dfc9]">
                        Fast-Track
                      </span>
                    ) : isAttention ? (
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#fbeff1] text-[#73202f] border border-[#efc8cf]">
                        Needs Attention
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase text-[#636a73] px-2 py-0.5 rounded bg-[#f1eeea] border border-[#dedad0]">
                        Standard Listing
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="text-xs font-mono text-[#1c3838] group-hover:underline flex items-center justify-center space-x-0.5 font-medium">
                      <span>Examine</span>
                      <ChevronRightIcon className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
