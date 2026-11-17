import React, { useState, useEffect } from "react";
import { CourtCase, Precedent, SystemStatusTelemetry } from "@/lib/types";
import { fetchSystemStatus } from "@/lib/api";
import {
  SearchIcon,
  ClockIcon,
  ScaleIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  FileTextIcon,
} from "../icons";

interface DashboardViewProps {
  cases: CourtCase[];
  precedents: Precedent[];
  onSelectCase: (caseId: string) => void;
  onNavigateToResearch: (initialQuery?: string) => void;
  onNavigateToQueue: () => void;
  onNavigateToCases?: () => void;
}

export function DashboardView({
  cases,
  precedents,
  onSelectCase,
  onNavigateToResearch,
  onNavigateToQueue,
  onNavigateToCases,
}: DashboardViewProps) {
  const [quickSearch, setQuickSearch] = React.useState("");
  const [systemStatus, setSystemStatus] = useState<SystemStatusTelemetry | null>(null);

  useEffect(() => {
    fetchSystemStatus().then((res) => {
      if (res) setSystemStatus(res);
    });
  }, []);

  const pendingCount = cases.filter((c) => c.status === "pending").length;
  const hearingCount = cases.filter((c) => c.status === "hearing").length;
  const reservedCount = cases.filter((c) => c.status === "reserved").length;
  const urgentCount = cases.filter((c) => c.prediction.priorityScore >= 75).length;

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      onNavigateToResearch(quickSearch.trim());
    }
  };

  const sampleQueries = [
    {
      query: "Section 45 PMLA twin conditions bail prolonged custody",
      hits: 14,
      court: "Supreme Court",
      topCite: "(2024) INSC 595",
    },
    {
      query: "Arbitration Act Section 34 patent illegality setting aside award",
      hits: 28,
      court: "Commercial Bench",
      topCite: "(2019) 15 SCC 131",
    },
    {
      query: "Insolvency moratorium corporate bank guarantee Section 14",
      hits: 9,
      court: "High Court",
      topCite: "(2018) 17 SCC 394",
    },
    {
      query: "Section 41A CrPC notice of appearance mechanical arrest guidelines",
      hits: 32,
      court: "Supreme Court",
      topCite: "(2022) 10 SCC 51",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb & System State */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e2ded6] gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#16191c]">
            Judicial Caseload & Docket Intelligence
          </h1>
          <p className="text-xs text-[#636a73] font-sans mt-0.5">
            Registry Master Docket • Precedent-weighted priority queue active
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-[#525860] bg-[#f1eeea] px-3 py-1.5 rounded border border-[#dedad0]">
          <span>FAISS Index:</span>
          <span className="font-semibold text-[#181a1d]">
            {systemStatus ? `${systemStatus.faiss_vector_count} Indexed` : `${precedents.length} Precedents Indexed`}
          </span>
          <span className="text-[#c7c1b5]">•</span>
          <span>
            {systemStatus?.embedding_model
              ? `${systemStatus.embedding_model.split("/").pop()} (${systemStatus.embedding_dimension}d)`
              : "all-MiniLM-L6-v2 (384d)"}
          </span>
        </div>
      </div>

      {/* Primary Institutional Caseload Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-3.5">
          <div className="flex items-center justify-between text-xs text-[#6e7580] mb-1">
            <span className="font-mono uppercase text-[10px] tracking-wider">Total Active</span>
            <FileTextIcon className="w-3.5 h-3.5 text-[#868d98]" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#16191c]">
            {cases.length}
          </div>
          <div className="text-[11px] text-[#636a73] mt-1 flex items-center space-x-1">
            <span className="text-[#1f5938] font-semibold">100%</span>
            <span>precedent-mapped</span>
          </div>
        </div>

        <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-3.5">
          <div className="flex items-center justify-between text-xs text-[#6e7580] mb-1">
            <span className="font-mono uppercase text-[10px] tracking-wider">Under Hearing</span>
            <ClockIcon className="w-3.5 h-3.5 text-[#8c6218]" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#16191c]">
            {hearingCount}
          </div>
          <div className="text-[11px] text-[#8c6218] mt-1">
            Avg. 18.2 hearings / case
          </div>
        </div>

        <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-3.5">
          <div className="flex items-center justify-between text-xs text-[#6e7580] mb-1">
            <span className="font-mono uppercase text-[10px] tracking-wider">Judgment Reserved</span>
            <CheckCircleIcon className="w-3.5 h-3.5 text-[#1f5938]" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#16191c]">
            {reservedCount}
          </div>
          <div className="text-[11px] text-[#1f5938] mt-1">
            Expected orders &lt; 35 days
          </div>
        </div>

        <div className="bg-[#fcfbf9] border border-[#c93b53]/40 rounded p-3.5 bg-gradient-to-br from-[#fcfbf9] to-[#fbf1f3]">
          <div className="flex items-center justify-between text-xs text-[#73202f] mb-1">
            <span className="font-mono uppercase text-[10px] tracking-wider font-semibold">Priority Fast-Track</span>
            <AlertCircleIcon className="w-3.5 h-3.5 text-[#73202f]" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#73202f]">
            {urgentCount}
          </div>
          <div className="text-[11px] text-[#73202f] mt-1 font-medium">
            Requires immediate bench listing
          </div>
        </div>
      </div>

      {/* Main Center Grid: Precedent Search Bar + High Priority Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Search & Precedent Quick Lookup */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick Precedent Search Box */}
          <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#636a73] font-medium">
                Direct Precedent Retrieval
              </span>
              <span className="text-[11px] font-mono text-[#8a919c]">
                Press <kbd className="px-1 py-0.5 bg-[#edeae3] rounded border border-[#d8d4c9] text-[10px]">/</kbd> to focus
              </span>
            </div>

            <form onSubmit={handleQuickSubmit} className="relative">
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Enter legal issue, statute section, or judgment citation (e.g. Section 45 PMLA bail)..."
                className="w-full bg-white border border-[#cfc9be] rounded px-3.5 py-2.5 text-xs text-[#16191c] placeholder:text-[#888f99] focus:outline-none focus:border-[#1c3838] focus:ring-1 focus:ring-[#1c3838] font-sans"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#1c3838] text-white text-xs px-3 rounded font-medium hover:bg-[#142828] transition-colors flex items-center space-x-1"
              >
                <SearchIcon className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </form>

            {/* Recent Institutional Precedent Inquiries */}
            <div className="mt-4 pt-3 border-t border-[#ede9e1]">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#757c87] mb-2 font-medium">
                Frequent Judicial Precedent Searches
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleQueries.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onNavigateToResearch(item.query)}
                    className="text-left p-2 rounded bg-[#f6f4ee] hover:bg-[#ede9df] border border-[#e2ddd3] transition-colors group"
                  >
                    <div className="text-xs font-medium text-[#181a1d] line-clamp-1 group-hover:text-[#1c3838]">
                      {item.query}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#6e7580] mt-1">
                      <span>{item.court}</span>
                      <span className="font-semibold text-[#181a1d]">{item.topCite}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Cases at a Glance */}
          <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#16191c]">
                  Active Registry Docket
                </h3>
                <p className="text-[11px] text-[#636a73]">
                  Select a case to inspect precedent-strength and time-to-resolution prediction
                </p>
              </div>

              <button
                onClick={() => onNavigateToCases ? onNavigateToCases() : onSelectCase(cases[0].id)}
                className="text-xs font-mono text-[#1c3838] hover:underline flex items-center space-x-1 font-medium"
              >
                <span>View Full Register</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#ede9e1] border border-[#ede9e1] rounded bg-white overflow-hidden">
              {cases.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  onClick={() => onSelectCase(c.id)}
                  className="p-3 hover:bg-[#f8f7f3] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-[#16191c]">
                        {c.caseNo}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                          c.status === "reserved"
                            ? "bg-[#eaf4ed] text-[#1f5938] border-[#c0dfc9]"
                            : c.status === "hearing"
                            ? "bg-[#fcf5e8] text-[#8c6218] border-[#f0debe]"
                            : "bg-[#edf1f7] text-[#1d4875] border-[#c8d8ec]"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span className="text-[11px] text-[#636a73] truncate">
                        {c.court}
                      </span>
                    </div>
                    <p className="text-xs text-[#4a5058] line-clamp-1 mt-0.5">
                      {c.petitioner} vs {c.respondent}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 font-mono text-xs">
                    <div className="text-right">
                      <div className="text-[10px] text-[#737a84] uppercase">Top Precedent</div>
                      <div className="font-bold text-[#1c3838]">
                        {(c.top1Similarity * 100).toFixed(1)}% Sim
                      </div>
                    </div>

                    <div className="text-right pl-3 border-l border-[#ede9e1]">
                      <div className="text-[10px] text-[#737a84] uppercase">Est. Resolution</div>
                      <div className="font-bold text-[#16191c]">
                        {c.prediction.predictedDays} Days
                      </div>
                    </div>

                    <ChevronRightIcon className="w-4 h-4 text-[#8a919c]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Priority Queue Preview & Causal Story Summary */}
        <div className="space-y-5">
          {/* Priority Queue Fast-Track Panel */}
          <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#ede9e1]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#16191c]">
                  Priority Queue
                </h3>
                <p className="text-[11px] text-[#636a73]">
                  Ranked by precedent clarity & delay
                </p>
              </div>

              <button
                onClick={onNavigateToQueue}
                className="text-[11px] font-mono text-[#73202f] font-semibold hover:underline"
              >
                Open Queue →
              </button>
            </div>

            <div className="space-y-2.5">
              {cases
                .slice()
                .sort((a, b) => b.prediction.priorityScore - a.prediction.priorityScore)
                .slice(0, 3)
                .map((c, idx) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCase(c.id)}
                    className="p-2.5 rounded bg-white border border-[#e5e1d7] hover:border-[#1c3838] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-[#16191c]">
                        #{idx + 1} {c.caseNo}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-[#73202f]">
                        Priority {c.prediction.priorityScore.toFixed(1)}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#4a5058] line-clamp-1 mb-1.5">
                      {c.description}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[#636a73] pt-1 border-t border-[#f1eee8]">
                      <span>Hearings: {c.hearingsCount}</span>
                      <span className="text-[#1c3838] font-medium">
                        Binding Precedent: {(c.top1Similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Causal Principle Card */}
          <div className="bg-[#f5f3ec] border border-[#d8d3c7] rounded p-4 text-[#3c4249]">
            <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#1c3838] font-bold mb-1.5">
              <ScaleIcon className="w-4 h-4 text-[#1c3838]" />
              <span>Causal Judicial Engine</span>
            </div>

            <p className="text-xs leading-relaxed text-[#444a52]">
              CaseLens connects <strong>precedent retrieval</strong> directly to <strong>time-to-resolution prediction</strong>:
            </p>

            <div className="mt-3 space-y-1.5 text-xs font-mono">
              <div className="p-1.5 bg-white rounded border border-[#dfdbd0] flex items-center justify-between text-[11px]">
                <span className="text-[#636a73]">1. High Precedent Match:</span>
                <span className="font-semibold text-[#1f5938]">Settles Legal Issues</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-[#dfdbd0] flex items-center justify-between text-[11px]">
                <span className="text-[#636a73]">2. Lower Hearing Velocity:</span>
                <span className="font-semibold text-[#1f5938]">Reduces Adjournments</span>
              </div>
              <div className="p-1.5 bg-white rounded border border-[#dfdbd0] flex items-center justify-between text-[11px]">
                <span className="text-[#636a73]">3. Automated Priority:</span>
                <span className="font-semibold text-[#73202f]">Fast-Tracks Ready Cases</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
