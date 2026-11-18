"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserProfile, UserRole } from "@/lib/types";
import { ScaleIcon, CheckCircleIcon, AlertCircleIcon, SettingsIcon } from "./icons";
import { fetchHealth, fetchCasesCount, HealthStatus } from "@/lib/api";

interface HeaderProps {
  currentRole: UserRole;
  currentUser: UserProfile | null;
  activeCaseCount: number;
  selectedBench: string;
  onBenchChange: (bench: string) => void;
  onLogout: () => void;
  onOpenSettings?: () => void;
}

export function Header({
  currentRole,
  currentUser,
  activeCaseCount,
  selectedBench,
  onBenchChange,
  onLogout,
  onOpenSettings,
}: HeaderProps) {
  const [health, setHealth] = useState<HealthStatus>({
    status: "checking",
    db: "checking...",
  });
  const [liveCaseCount, setLiveCaseCount] = useState<number | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Poll /health every 30 seconds (3-state: ok / degraded / offline)
  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      const res = await fetchHealth();
      if (isMounted) setHealth(res);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // Fetch live caseload count on mount
  useEffect(() => {
    fetchCasesCount().then((count) => setLiveCaseCount(count));
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b border-[#e2ded6] bg-[#fbfaf7] px-6 py-2.5 text-[#181a1d] sticky top-0 z-40">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding & Registry Live Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#1c3838] flex items-center justify-center text-white shadow-xs">
              <ScaleIcon className="w-4 h-4 text-[#e3ded4]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-lg font-bold tracking-tight text-[#16191c]">
                  CaseLens
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider bg-[#eae6dc] text-[#555a60] px-1.5 py-0.5 rounded border border-[#d8d3c7]">
                  e-Courts Int. v0.9
                </span>
              </div>
              <p className="text-[11px] text-[#6b7280] font-sans">
                Judicial Intelligence & Resolution Prediction Platform
              </p>
            </div>
          </div>

          {/* Dynamic Health Status Indicator */}
          <div className="hidden md:flex items-center pl-5 border-l border-[#e2ded6] space-x-3 text-xs text-[#525860]">
            <div className="flex items-center space-x-1.5">
              {health.status === "ok" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#1f5938] animate-pulse"></span>
                  <span className="font-mono text-[11px] font-medium text-[#1f5938]">
                    Connected
                  </span>
                </>
              ) : health.status === "degraded" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#8c6218] animate-pulse"></span>
                  <span className="font-mono text-[11px] font-medium text-[#8c6218]">
                    Degraded
                  </span>
                </>
              ) : health.status === "checking" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#8c6218] animate-ping"></span>
                  <span className="font-mono text-[11px] font-medium text-[#8c6218]">
                    Connecting...
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#8b263e]"></span>
                  <span className="font-mono text-[11px] font-medium text-[#8b263e]">
                    Offline
                  </span>
                </>
              )}
            </div>
            <span className="text-[#c4bfb4]">•</span>
            <span>
              Caseload:{" "}
              <strong className="font-mono text-[#181a1d]">
                {liveCaseCount !== null ? liveCaseCount : activeCaseCount} Active
              </strong>
            </span>
          </div>
        </div>

        {/* Right: Authenticated User Profile Menu */}
        <div className="flex items-center space-x-3">
          {/* Authenticated User Menu Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 bg-[#f0ece5] hover:bg-[#e7e2d7] border border-[#dcd6c8] px-2.5 py-1.5 rounded transition-colors text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-[#1c3838] text-white font-mono text-[10px] flex items-center justify-center font-bold">
                {currentRole === "judge" ? "J" : currentRole === "clerk" ? "C" : "R"}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-[#181a1d] text-[11px] leading-tight truncate max-w-[120px]">
                  {currentUser?.fullName || "Presiding Judge"}
                </div>
                <div className="text-[10px] text-[#636a73] font-mono leading-none capitalize">
                  {currentRole}
                </div>
              </div>
            </button>

            {/* Menu Popover */}
            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-64 bg-[#fcfbf9] border border-[#dedad0] rounded shadow-lg p-3 text-xs space-y-2.5 z-50 animate-in fade-in duration-100">
                <div className="border-b border-[#ede9e1] pb-2">
                  <div className="font-serif font-bold text-[#16191c]">
                    {currentUser?.fullName || "Justice K. Sharma"}
                  </div>
                  <div className="font-mono text-[11px] text-[#636a73] truncate">
                    {currentUser?.email || "justice.sharma@sci.gov.in"}
                  </div>
                  <div className="mt-1 flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#eaf4ed] text-[#1f5938] font-bold">
                      {currentRole.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-[#8a919c]">
                      JWT Active (HS256)
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#555b63] space-y-1">
                  <div><strong>Jurisdiction:</strong> Supreme Court Registry</div>
                  <div><strong>Status:</strong> Active Credentialed User</div>
                </div>

                <div className="pt-2 border-t border-[#ede9e1] space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onOpenSettings) onOpenSettings();
                    }}
                    className="w-full text-left font-mono text-[11px] text-[#1c3838] hover:text-[#142828] font-medium py-1 px-1 rounded hover:bg-[#efece5] transition-colors flex items-center justify-between"
                  >
                    <span>Platform Settings & Telemetry</span>
                    <span className="text-[10px] bg-[#e4dfd5] px-1 rounded text-[#555b63]">7</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left font-mono text-[11px] text-[#8b263e] hover:text-[#5e1828] font-medium py-1 px-1 rounded hover:bg-[#faebee] transition-colors"
                  >
                    Sign Out / Reset Session →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
