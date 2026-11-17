import React, { useState } from "react";
import { CourtCase, CaseStatus, TableDensity } from "@/lib/types";
import {
  FileTextIcon,
  FilterIcon,
  ChevronRightIcon,
  SearchIcon,
  ClockIcon,
  AlertCircleIcon,
  ArrowUpDownIcon,
} from "../icons";

interface CasesViewProps {
  cases: CourtCase[];
  onSelectCase: (caseId: string) => void;
  onAddNewCase: (newCase: Partial<CourtCase>) => void;
  tableDensity?: TableDensity;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function CasesView({
  cases,
  onSelectCase,
  onAddNewCase,
  tableDensity = "compact",
  isLoading = false,
  error = null,
  onRetry,
}: CasesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [courtFilter, setCourtFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"filingDate" | "hearings" | "priority" | "predictedDays">("priority");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAddModal, setShowAddModal] = useState(false);

  // New case form state
  const [newCaseNo, setNewCaseNo] = useState("");
  const [newCourt, setNewCourt] = useState("Supreme Court of India");
  const [newPetitioner, setNewPetitioner] = useState("");
  const [newRespondent, setNewRespondent] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const filteredCases = cases
    .filter((c) => {
      if (courtFilter !== "all" && !c.court.toLowerCase().includes(courtFilter.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && c.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          c.caseNo.toLowerCase().includes(q) ||
          c.petitioner.toLowerCase().includes(q) ||
          c.respondent.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "priority") {
        comparison = b.prediction.priorityScore - a.prediction.priorityScore;
      } else if (sortBy === "predictedDays") {
        comparison = a.prediction.predictedDays - b.prediction.predictedDays;
      } else if (sortBy === "hearings") {
        comparison = b.hearingsCount - a.hearingsCount;
      } else if (sortBy === "filingDate") {
        comparison = new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime();
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });

  const cellPad = tableDensity === "compact" ? "py-2 px-3" : "py-3 px-3.5";

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNo.trim() || !newPetitioner.trim()) return;

    onAddNewCase({
      caseNo: newCaseNo.trim(),
      court: newCourt,
      caseType: "CRL.A",
      filingDate: new Date().toISOString().split("T")[0],
      hearingsCount: 1,
      status: "pending",
      bench: "Registrar Court (Fresh Admission)",
      petitioner: newPetitioner.trim(),
      respondent: newRespondent.trim() || "State of India",
      description: newDescription.trim() || "Fresh filing awaiting preliminary hearing.",
      top1Similarity: 0.72,
      meanTop5Similarity: 0.65,
      countAboveThreshold: 2,
      matchedPrecedentIds: ["prec-001"],
      prediction: {
        predictedDays: 140,
        complexity: "Medium",
        priorityScore: 65.0,
        confidenceIntervalDays: [110, 175],
        precedentConfidence: 0.75,
        shapFactors: [
          {
            feature: "Fresh Filing Status",
            impact: "increases_delay",
            impactDays: +30,
            plainEnglishReason: "Initial issuance of notice and counter-affidavit completion pending.",
          },
        ],
      },
    });

    setShowAddModal(false);
    setNewCaseNo("");
    setNewPetitioner("");
    setNewRespondent("");
    setNewDescription("");
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#e2ded6] gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#16191c]">
            Pending Cases Register
          </h1>
          <p className="text-xs text-[#636a73] font-sans mt-0.5">
            Active judicial docket with precedent-strength metrics & estimated time-to-resolution
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-[#1c3838] text-white text-xs font-medium rounded hover:bg-[#142828] transition-colors flex items-center space-x-1"
          >
            <span>+ Register New Case</span>
          </button>
        </div>
      </div>

      {/* Table Control Bar: Search + Filter Badges */}
      <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="w-3.5 h-3.5 text-[#7a818c] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Case No (e.g. CRL.A 1421), Party names, or Acts..."
            className="w-full bg-white border border-[#cfc9be] rounded pl-9 pr-3 py-1.5 text-xs text-[#16191c] placeholder:text-[#888f99] focus:outline-none focus:border-[#1c3838]"
          />
        </div>

        <div className="flex items-center space-x-3 flex-wrap">
          <div className="flex items-center space-x-1.5">
            <span className="font-mono text-[11px] text-[#636a73]">Court:</span>
            <select
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              className="bg-white border border-[#cfc9be] rounded px-2 py-1 text-xs text-[#16191c] focus:outline-none"
            >
              <option value="all">All Courts</option>
              <option value="supreme court">Supreme Court</option>
              <option value="delhi">Delhi HC</option>
              <option value="bombay">Bombay HC</option>
              <option value="karnataka">Karnataka HC</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-mono text-[11px] text-[#636a73]">Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#cfc9be] rounded px-2 py-1 text-xs text-[#16191c] focus:outline-none"
            >
              <option value="all">All Stages</option>
              <option value="hearing">Under Hearing</option>
              <option value="reserved">Reserved for Orders</option>
              <option value="pending">Pending Notice</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dense e-Courts Tabular Case Register */}
      <div className="border border-[#dedad0] rounded bg-[#fcfbf9] overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#f4f2ec] border-b border-[#dedad0] font-mono text-[11px] text-[#555b63] uppercase tracking-wider">
              <th className="py-2.5 px-3">Case Number</th>
              <th className="py-2.5 px-3">Parties & Subject</th>
              <th className="py-2.5 px-3">Court / Bench</th>
              <th
                onClick={() => handleSort("filingDate")}
                className="py-2.5 px-3 cursor-pointer hover:text-[#181a1d]"
              >
                Filing Date {sortBy === "filingDate" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("hearings")}
                className="py-2.5 px-3 cursor-pointer hover:text-[#181a1d] text-center"
              >
                Hearings {sortBy === "hearings" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="py-2.5 px-3 text-center">Stage</th>
              <th className="py-2.5 px-3 text-right">Top Precedent</th>
              <th
                onClick={() => handleSort("predictedDays")}
                className="py-2.5 px-3 cursor-pointer hover:text-[#181a1d] text-right"
              >
                Est. Days {sortBy === "predictedDays" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("priority")}
                className="py-2.5 px-3 cursor-pointer hover:text-[#181a1d] text-right"
              >
                Priority {sortBy === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ede9e1] font-sans">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className={cellPad}><div className="h-3.5 bg-[#eae6dc] rounded w-28"></div></td>
                  <td className={cellPad}><div className="h-3.5 bg-[#eae6dc] rounded w-44"></div></td>
                  <td className={cellPad}><div className="h-3.5 bg-[#eae6dc] rounded w-28"></div></td>
                  <td className={cellPad}><div className="h-3.5 bg-[#eae6dc] rounded w-20"></div></td>
                  <td className={`${cellPad} text-center`}><div className="h-3.5 bg-[#eae6dc] rounded w-8 mx-auto"></div></td>
                  <td className={`${cellPad} text-center`}><div className="h-3.5 bg-[#eae6dc] rounded w-16 mx-auto"></div></td>
                  <td className={`${cellPad} text-right`}><div className="h-3.5 bg-[#eae6dc] rounded w-16 ml-auto"></div></td>
                  <td className={`${cellPad} text-right`}><div className="h-3.5 bg-[#eae6dc] rounded w-12 ml-auto"></div></td>
                  <td className={`${cellPad} text-right`}><div className="h-3.5 bg-[#eae6dc] rounded w-10 ml-auto"></div></td>
                  <td className={`${cellPad} text-center`}><div className="h-3.5 bg-[#eae6dc] rounded w-12 mx-auto"></div></td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-xs">
                  <div className="text-[#73202f] font-mono font-bold mb-1">
                    Failed to synchronize registry docket from database
                  </div>
                  <div className="text-[#636a73] mb-3">{error}</div>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="px-3 py-1 bg-[#1c3838] text-white font-mono rounded text-xs hover:bg-[#142828]"
                    >
                      Retry Connection
                    </button>
                  )}
                </td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-xs font-mono text-[#636a73]">
                  No active court cases match the selected filter criteria.
                  <button
                    onClick={() => {
                      setCourtFilter("all");
                      setStatusFilter("all");
                      setSearchTerm("");
                    }}
                    className="ml-2 text-[#1c3838] underline font-bold"
                  >
                    Clear Filters
                  </button>
                </td>
              </tr>
            ) : (
              filteredCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c.id)}
                  className="hover:bg-[#f6f4ee] transition-colors cursor-pointer group"
                >
                  {/* Case Number */}
                  <td className={`${cellPad} font-mono font-bold text-[#16191c] whitespace-nowrap`}>
                    {c.caseNo}
                  </td>

                  {/* Parties */}
                  <td className={`${cellPad} max-w-xs`}>
                    <div className="font-medium text-[#181a1d] truncate">
                      {c.petitioner} vs {c.respondent}
                    </div>
                    <div className="text-[11px] text-[#636a73] line-clamp-1 mt-0.5">
                      {c.description}
                    </div>
                  </td>

                  {/* Court */}
                  <td className={`${cellPad} text-[#444950] whitespace-nowrap`}>
                    <div className="font-medium">{c.court}</div>
                    <div className="text-[11px] text-[#737a82] font-mono">{c.bench}</div>
                  </td>

                  {/* Filing Date */}
                  <td className={`${cellPad} font-mono text-[#52575f] whitespace-nowrap`}>
                    {c.filingDate}
                  </td>

                  {/* Hearings */}
                  <td className={`${cellPad} font-mono text-center font-semibold text-[#181a1d]`}>
                    {c.hearingsCount}
                  </td>

                  {/* Stage */}
                  <td className={`${cellPad} text-center whitespace-nowrap`}>
                    <span
                      className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                        c.status === "reserved"
                          ? "bg-[#eaf4ed] text-[#1f5938] border-[#c0dfc9]"
                          : c.status === "hearing"
                          ? "bg-[#fcf5e8] text-[#8c6218] border-[#f0debe]"
                          : "bg-[#edf1f7] text-[#1d4875] border-[#c8d8ec]"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>

                  {/* Top Precedent Similarity */}
                  <td className={`${cellPad} font-mono text-right whitespace-nowrap`}>
                    <div className="font-bold text-[#1c3838]">
                      {(c.top1Similarity * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-[#787f8a]">
                      {c.countAboveThreshold} matches &gt; 0.65
                    </div>
                  </td>

                  {/* Predicted Days */}
                  <td className={`${cellPad} font-mono text-right font-bold text-[#181a1d] whitespace-nowrap`}>
                    {c.prediction.predictedDays} d
                  </td>

                  {/* Priority */}
                  <td className={`${cellPad} font-mono text-right whitespace-nowrap`}>
                    <span
                      className={`font-bold ${
                        c.prediction.priorityScore >= 75
                          ? "text-[#73202f]"
                          : "text-[#555a62]"
                      }`}
                    >
                      {c.prediction.priorityScore.toFixed(1)}
                    </span>
                  </td>

                  {/* Action */}
                  <td className={`${cellPad} text-center whitespace-nowrap`}>
                    <span className="text-xs font-mono text-[#1c3838] group-hover:underline flex items-center justify-center space-x-0.5 font-medium">
                      <span>Inspect</span>
                      <ChevronRightIcon className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Case Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-[#fcfbf9] border border-[#dcd7cb] rounded max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2ded6]">
              <h3 className="font-serif text-lg font-bold text-[#16191c]">
                Register New Pending Case
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#636a73] hover:text-[#181a1d]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-[11px] text-[#555a62] uppercase mb-1">
                  Case Number (e.g. CRL.A. 1950/2024)
                </label>
                <input
                  type="text"
                  required
                  value={newCaseNo}
                  onChange={(e) => setNewCaseNo(e.target.value)}
                  placeholder="e.g. CRL.A. 1950/2024"
                  className="w-full bg-white border border-[#cfc9be] rounded px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-[#555a62] uppercase mb-1">
                  Court Jurisdiction
                </label>
                <select
                  value={newCourt}
                  onChange={(e) => setNewCourt(e.target.value)}
                  className="w-full bg-white border border-[#cfc9be] rounded px-3 py-2 text-xs"
                >
                  <option value="Supreme Court of India">Supreme Court of India</option>
                  <option value="High Court of Delhi">High Court of Delhi</option>
                  <option value="High Court of Bombay">High Court of Bombay</option>
                  <option value="High Court of Karnataka">High Court of Karnataka</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[11px] text-[#555a62] uppercase mb-1">
                    Petitioner
                  </label>
                  <input
                    type="text"
                    required
                    value={newPetitioner}
                    onChange={(e) => setNewPetitioner(e.target.value)}
                    placeholder="e.g. Arvind Mehta"
                    className="w-full bg-white border border-[#cfc9be] rounded px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-[#555a62] uppercase mb-1">
                    Respondent
                  </label>
                  <input
                    type="text"
                    value={newRespondent}
                    onChange={(e) => setNewRespondent(e.target.value)}
                    placeholder="e.g. State of Maharashtra"
                    className="w-full bg-white border border-[#cfc9be] rounded px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] text-[#555a62] uppercase mb-1">
                  Factual Summary & Statutory Sections
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Summarize the core facts, allegations, and legal challenge..."
                  className="w-full bg-white border border-[#cfc9be] rounded px-3 py-2 text-xs font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#e2ded6]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-[#cfc9be] bg-[#f2efe9] text-[#4a5058] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-[#1c3838] text-white text-xs font-medium hover:bg-[#142828]"
                >
                  Add to Docket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
