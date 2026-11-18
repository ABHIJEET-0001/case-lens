import React from "react";
import {
  ScaleIcon,
  SearchIcon,
  FileTextIcon,
  ClockIcon,
  BarChartIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  SettingsIcon,
} from "./icons";

export type NavTab =
  | "dashboard"
  | "research"
  | "cases"
  | "case-detail"
  | "queue"
  | "model-report"
  | "settings";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  selectedCaseNo?: string;
  urgentQueueCount: number;
}

export function Sidebar({
  activeTab,
  onTabChange,
  selectedCaseNo,
  urgentQueueCount,
}: SidebarProps) {
  const navItems = [
    {
      id: "dashboard" as NavTab,
      label: "Judicial Overview",
      subtitle: "Caseload & Bench Summary",
      icon: ScaleIcon,
      shortcut: "1",
    },
    {
      id: "research" as NavTab,
      label: "Precedent Research",
      subtitle: "FAISS Vector Search",
      icon: SearchIcon,
      shortcut: "2",
    },
    {
      id: "cases" as NavTab,
      label: "Pending Cases Register",
      subtitle: "Active Docket & Filings",
      icon: FileTextIcon,
      shortcut: "3",
    },
    {
      id: "case-detail" as NavTab,
      label: "Case Analysis & Predict",
      subtitle: selectedCaseNo ? `Selected: ${selectedCaseNo}` : "Split Judicial View",
      icon: ClockIcon,
      shortcut: "4",
      highlight: !!selectedCaseNo,
    },
    {
      id: "queue" as NavTab,
      label: "Priority Queue",
      subtitle: "Precedent-backed Ranking",
      icon: AlertCircleIcon,
      shortcut: "5",
      badge: urgentQueueCount,
    },
    {
      id: "model-report" as NavTab,
      label: "Model Benchmark Report",
      subtitle: "SHAP & Model Metrics",
      icon: BarChartIcon,
      shortcut: "6",
    },
    {
      id: "settings" as NavTab,
      label: "Platform Settings",
      subtitle: "Diagnostics & Telemetry",
      icon: SettingsIcon,
      shortcut: "7",
    },
  ];

  return (
    <aside className="w-64 border-r border-[#e2ded6] bg-[#f9f8f5] flex flex-col justify-between shrink-0 min-h-[calc(100vh-57px)]">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#7a818c]">
          Workstation Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded transition-all flex items-start justify-between group ${
                isActive
                  ? "bg-[#1c3838] text-white shadow-xs"
                  : "text-[#3b4046] hover:bg-[#efece5] hover:text-[#181a1d]"
              }`}
            >
              <div className="flex items-start space-x-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isActive ? "text-[#e8e4db]" : "text-[#6b7280] group-hover:text-[#181a1d]"
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-xs font-medium truncate ${
                        isActive ? "text-white" : "text-[#22252a]"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold ${
                          isActive
                            ? "bg-[#8b263e] text-white"
                            : "bg-[#73202f] text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] truncate ${
                      isActive ? "text-[#c2cfcf]" : "text-[#7a818c]"
                    }`}
                  >
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono px-1 py-0.2 rounded shrink-0 ${
                  isActive
                    ? "bg-[#142828] text-[#a4b5b5]"
                    : "bg-[#eae6de] text-[#868d98]"
                }`}
              >
                {item.shortcut}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Institutional Info Banner */}
      <div className="p-3 border-t border-[#e2ded6] bg-[#f4f2ec] text-[11px] text-[#555b63]">
        <div className="flex items-center justify-between font-mono text-[10px] text-[#787f8a] mb-1">
          <span>AI ACT VALIDATION</span>
          <span className="text-[#1f5938] font-semibold">DETERMINISTIC SHAP</span>
        </div>
        <p className="leading-snug text-[#4f555d] text-[11px]">
          Precedent features directly constrain resolution predictions. No ungrounded LLM inference.
        </p>
      </div>
    </aside>
  );
}
