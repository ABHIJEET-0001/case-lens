"use client";

import React, { useState, useEffect } from "react";
import { UserProfile, UserRole, TableDensity, SystemStatusTelemetry } from "@/lib/types";
import { fetchSystemStatus } from "@/lib/api";
import {
  ShieldIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  ScaleIcon,
  SlidersIcon,
  FileTextIcon,
} from "../icons";

interface SettingsViewProps {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  selectedBench: string;
  onBenchChange: (bench: string) => void;
  tableDensity: TableDensity;
  onDensityChange: (density: TableDensity) => void;
}

export function SettingsView({
  currentUser,
  currentRole,
  onRoleChange,
  selectedBench,
  onBenchChange,
  tableDensity,
  onDensityChange,
}: SettingsViewProps) {
  const [telemetry, setTelemetry] = useState<SystemStatusTelemetry | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("12");

  useEffect(() => {
    let isMounted = true;
    async function loadTelemetry() {
      setIsLoadingTelemetry(true);
      const data = await fetchSystemStatus();
      if (isMounted) {
        setTelemetry(data);
        setIsLoadingTelemetry(false);
      }
    }
    loadTelemetry();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Title & Institutional Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#e2ded6] gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#16191c]">
            Platform Settings & System Diagnostics
          </h1>
          <p className="text-xs text-[#636a73] font-sans mt-0.5">
            Workstation preferences, computational environment telemetry, and institutional role controls
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-[#525860] bg-[#f1eeea] px-3 py-1.5 rounded border border-[#dedad0]">
          <span>Build:</span>
          <strong className="text-[#181a1d]">v0.9.4-alpha</strong>
          <span className="text-[#c7c1b5]">•</span>
          <span>e-Courts Registry Spec</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SECTION 1: USER PROFILE */}
        <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#ede9e1]">
            <ShieldIcon className="w-4 h-4 text-[#1c3838]" />
            <h2 className="font-serif text-base font-bold text-[#16191c]">
              Credentialed Profile
            </h2>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#686f7a]">Presiding Officer:</span>
              <span className="font-medium text-[#181a1d]">{currentUser?.fullName || "Justice K. Sharma"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#686f7a]">Institutional Email:</span>
              <span className="font-mono text-[#181a1d]">{currentUser?.email || "justice.sharma@sci.gov.in"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#686f7a]">Active Role:</span>
              <span className="font-mono uppercase text-[10px] px-2 py-0.5 rounded bg-[#eaf4ed] text-[#1f5938] font-bold">
                {currentRole}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#686f7a]">Jurisdiction:</span>
              <span className="font-medium text-[#181a1d]">Supreme Court of India</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#ede9e1] font-mono text-[11px]">
              <span className="text-[#787f8a]">Token Algorithm:</span>
              <span className="text-[#181a1d]">JWT / HMAC-SHA256 (60m)</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: WORKSTATION PREFERENCES */}
        <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#ede9e1]">
            <SlidersIcon className="w-4 h-4 text-[#1c3838]" />
            <h2 className="font-serif text-base font-bold text-[#16191c]">
              Workstation Preferences
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-mono uppercase text-[#686f7a] mb-1">
                Default Roster / Bench Filter
              </label>
              <select
                value={selectedBench}
                onChange={(e) => onBenchChange(e.target.value)}
                className="w-full bg-white border border-[#cfc9be] rounded px-2.5 py-1.5 text-xs text-[#16191c] focus:outline-none focus:border-[#1c3838]"
              >
                <option value="all">All Benches & Rosters</option>
                <option value="Supreme Court of India">Division Bench IV (Supreme Court of India)</option>
                <option value="High Court of Delhi">Writ & Commercial Bench (High Court of Delhi)</option>
                <option value="High Court of Bombay">Appellate Side (High Court of Bombay)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#686f7a] mb-1">
                Docket Table Density
              </label>
              <div className="flex rounded border border-[#cfc9be] overflow-hidden bg-white text-xs font-mono">
                <button
                  type="button"
                  onClick={() => onDensityChange("compact")}
                  className={`flex-1 py-1.5 text-center transition-colors ${
                    tableDensity === "compact"
                      ? "bg-[#1c3838] text-white font-bold"
                      : "text-[#555a62] hover:bg-[#f5f3ec]"
                  }`}
                >
                  Compact (8px padding)
                </button>
                <button
                  type="button"
                  onClick={() => onDensityChange("comfortable")}
                  className={`flex-1 py-1.5 text-center transition-colors border-l border-[#cfc9be] ${
                    tableDensity === "comfortable"
                      ? "bg-[#1c3838] text-white font-bold"
                      : "text-[#555a62] hover:bg-[#f5f3ec]"
                  }`}
                >
                  Comfortable (12px padding)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[#686f7a] mb-1">
                Registry Heartbeat Interval
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="w-full bg-white border border-[#cfc9be] rounded px-2.5 py-1.5 text-xs text-[#16191c] focus:outline-none"
              >
                <option value="12">Standard (12 Seconds)</option>
                <option value="30">Conservative (30 Seconds)</option>
                <option value="60">Low Frequency (60 Seconds)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: SYSTEM RUNTIME STATUS (LIVE TELEMETRY) */}
      <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#ede9e1]">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-4 h-4 text-[#1f5938]" />
            <h2 className="font-serif text-base font-bold text-[#16191c]">
              System Status & Diagnostics (Live Telemetry)
            </h2>
          </div>
          <span className="font-mono text-[11px] text-[#636a73]">
            Endpoint: <code className="bg-[#edeae3] px-1.5 py-0.5 rounded text-[10px]">GET /api/v1/system/status</code>
          </span>
        </div>

        {isLoadingTelemetry ? (
          <div className="p-6 text-center text-xs font-mono text-[#787f8a] animate-pulse">
            Connecting to CaseLens runtime telemetry...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#f6f4ee] rounded border border-[#dfdad0]">
              <span className="text-[10px] text-[#737a84] uppercase block mb-0.5">Backend Service</span>
              <span className="text-sm font-bold text-[#1f5938] flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#1f5938]"></span>
                <span>FastAPI {telemetry?.version}</span>
              </span>
              <span className="text-[10px] text-[#686f7a] block mt-1">Status: {telemetry?.backend}</span>
            </div>

            <div className="p-3 bg-[#f6f4ee] rounded border border-[#dfdad0]">
              <span className="text-[10px] text-[#737a84] uppercase block mb-0.5">PostgreSQL Engine</span>
              <span className="text-sm font-bold text-[#1f5938] flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#1f5938]"></span>
                <span>Postgres 16</span>
              </span>
              <span className="text-[10px] text-[#686f7a] block mt-1">DB: {telemetry?.database}</span>
            </div>

            <div className="p-3 bg-[#f6f4ee] rounded border border-[#dfdad0]">
              <span className="text-[10px] text-[#737a84] uppercase block mb-0.5">Corpus In Database</span>
              <span className="text-sm font-bold text-[#181a1d]">
                {telemetry?.db_judgments_count} Judgments
              </span>
              <span className="text-[10px] text-[#686f7a] block mt-1">
                {telemetry?.db_pending_cases_count} Active Cases
              </span>
            </div>

            <div className="p-3 bg-[#f6f4ee] rounded border border-[#dfdad0]">
              <span className="text-[10px] text-[#737a84] uppercase block mb-0.5">FAISS Vector Index</span>
              <span className="text-sm font-bold text-[#1c3838]">
                {telemetry?.faiss_vector_count} Vectors
              </span>
              <span className="text-[10px] text-[#686f7a] block mt-1">
                {telemetry?.faiss_index_exists ? "Index Flat IP Active" : "Pending Ingestion"}
              </span>
            </div>

            <div className="col-span-2 p-3 bg-[#f6f4ee] rounded border border-[#dfdad0]">
              <span className="text-[10px] text-[#737a84] uppercase block mb-0.5">Embedding Model & Dimension</span>
              <div className="font-bold text-[#181a1d] text-xs truncate">
                {telemetry?.embedding_model}
              </div>
              <div className="text-[10px] text-[#1c3838] font-bold mt-1">
                Real Dimension: {telemetry?.embedding_dimension}-dim • {telemetry?.distance_metric}
              </div>
            </div>

            <div className="col-span-2 p-3 bg-[#f6f4ee] rounded border border-[#dfdad0]">
              <span className="text-[10px] text-[#737a84] uppercase block mb-0.5">Abstractive Summarizer</span>
              <div className="font-bold text-[#181a1d] text-xs truncate">
                {telemetry?.summarizer_mode}
              </div>
              <div className="text-[10px] text-[#686f7a] mt-1">
                API Key Configured: {telemetry?.gemini_api_configured ? "Yes" : "No"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: ML MODEL INFO & SECTION 5: DATA SOURCES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4 space-y-2.5 text-xs">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#ede9e1]">
            <ScaleIcon className="w-4 h-4 text-[#1c3838]" />
            <h2 className="font-serif text-base font-bold text-[#16191c]">
              Machine Learning Architecture
            </h2>
          </div>
          <div className="space-y-1.5 text-[#3b4047]">
            <div><strong>Primary Regressor:</strong> Gradient Boosting Regressor (150 trees, depth 6)</div>
            <div><strong>Hypothesis Target:</strong> Precedent-strength error drop (MAE: 56.5d → 38.0d)</div>
            <div><strong>Calibration:</strong> National Judicial Data Grid (NJDG) log-normal delay curves</div>
            <div><strong>Explainability:</strong> Deterministic additive TreeSHAP feature attribution</div>
          </div>
        </div>

        <div className="bg-[#fcfbf9] border border-[#dedad0] rounded p-4 space-y-2.5 text-xs">
          <div className="flex items-center space-x-2 pb-2 border-b border-[#ede9e1]">
            <FileTextIcon className="w-4 h-4 text-[#1c3838]" />
            <h2 className="font-serif text-base font-bold text-[#16191c]">
              Data Sources & Provenance
            </h2>
          </div>
          <div className="space-y-1.5 text-[#3b4047]">
            <div><strong>Primary Dataset:</strong> Exploration-Lab/ILDC (Indian Legal Documents Corpus)</div>
            <div><strong>Official Registry Rulings:</strong> Supreme Court of India & High Courts</div>
            <div><strong>Text Chunking:</strong> 300 words with 50-word sliding window</div>
            <div><strong>Persistence Path:</strong> <code className="font-mono text-[11px] bg-[#edeae3] px-1 py-0.5 rounded">/app/data/index</code></div>
          </div>
        </div>
      </div>

      {/* SECTION 6: DEMO MODE (RELOCATED FROM HEADER WITH HONEST LABEL) */}
      {(process.env.NEXT_PUBLIC_DEMO_MODE === "true" || telemetry?.environment === "development") && (
      <div className="bg-[#fdf9f4] border-2 border-[#d9822b]/40 rounded p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <AlertCircleIcon className="w-4 h-4 text-[#8c6218]" />
          <h2 className="font-serif text-base font-bold text-[#16191c]">
            Demo mode, not real authentication
          </h2>
        </div>

        <div className="p-2.5 bg-[#fef5ea] border border-[#f3d9b8] rounded text-xs text-[#784f0e] leading-relaxed">
          <strong>Evaluation Disclosure:</strong> This role switcher is provided solely for local evaluation and interface review. It simulates authenticated user sessions and does not replace cryptographic multi-user institutional access controls.
        </div>

        <div className="flex items-center space-x-3 pt-1">
          <button
            type="button"
            onClick={() => onRoleChange("judge")}
            className={`px-3 py-1.5 rounded font-mono text-xs font-semibold transition-all ${
              currentRole === "judge"
                ? "bg-[#1c3838] text-white shadow-xs"
                : "bg-white text-[#4a5058] border border-[#cfc9be] hover:bg-[#ede9df]"
            }`}
          >
            Presiding Judge (Bench View)
          </button>
          <button
            type="button"
            onClick={() => onRoleChange("clerk")}
            className={`px-3 py-1.5 rounded font-mono text-xs font-semibold transition-all ${
              currentRole === "clerk"
                ? "bg-[#1c3838] text-white shadow-xs"
                : "bg-white text-[#4a5058] border border-[#cfc9be] hover:bg-[#ede9df]"
            }`}
          >
            Court Clerk (Filing & Docket)
          </button>
          <button
            type="button"
            onClick={() => onRoleChange("researcher")}
            className={`px-3 py-1.5 rounded font-mono text-xs font-semibold transition-all ${
              currentRole === "researcher"
                ? "bg-[#1c3838] text-white shadow-xs"
                : "bg-white text-[#4a5058] border border-[#cfc9be] hover:bg-[#ede9df]"
            }`}
          >
            Law Researcher (Precedent ANN)
          </button>
        </div>
      </div>
      )}

      {/* SECTION 7: ABOUT & CONSTITUTIONAL DISCLAIMER */}
      <div className="p-4 bg-[#f6f4ee] border border-[#dedad0] rounded text-xs text-[#525860] space-y-2">
        <div className="flex items-center justify-between font-mono text-[11px] text-[#6e7580]">
          <span>CaseLens Judicial Intelligence Platform</span>
          <span>v0.9.4-alpha • e-Courts Architecture</span>
        </div>
        <p className="leading-relaxed text-[#454a52] text-[11px]">
          <strong>Constitutional Notice:</strong> CaseLens provides decision-support and time-to-resolution forecasting based on statistical precedent distributions and procedural metadata. All forecasts, complexity classifications, and priority scores are advisory and non-binding; judicial discretion remains sovereign under Article 141 of the Constitution of India.
        </p>
      </div>
    </div>
  );
}
