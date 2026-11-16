"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserRole, CourtCase, UserProfile } from "@/lib/types";
import {
  MOCK_CASES,
  MOCK_PRECEDENTS,
  MOCK_MODEL_METRICS,
  MOCK_FEATURE_IMPORTANCE,
} from "@/lib/mockData";
import {
  fetchCurrentUser,
  switchDemoRole,
  fetchCases,
  registerNewCase,
  clearStoredToken,
} from "@/lib/api";
import { Header } from "@/components/Header";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { DashboardView } from "@/components/views/DashboardView";
import { ResearchView } from "@/components/views/ResearchView";
import { CasesView } from "@/components/views/CasesView";
import { CaseDetailView } from "@/components/views/CaseDetailView";
import { PriorityQueueView } from "@/components/views/PriorityQueueView";
import { ModelReportView } from "@/components/views/ModelReportView";

export default function CaseLensApp() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [userRole, setUserRole] = useState<UserRole>("judge");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedBench, setSelectedBench] = useState<string>("all");
  const [cases, setCases] = useState<CourtCase[]>(MOCK_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("case-001");
  const [researchQuery, setResearchQuery] = useState<string>("");
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(false);

  // 1. Load initial user profile & check auth session
  useEffect(() => {
    async function initAuth() {
      const user = await fetchCurrentUser();
      if (user) {
        setCurrentUser(user);
        setUserRole(user.role);
      } else {
        // Automatically acquire default judge demo token
        const demoJudge = await switchDemoRole("judge");
        if (demoJudge) {
          setCurrentUser(demoJudge);
          setUserRole(demoJudge.role);
        }
      }
    }
    initAuth();
  }, []);

  // 2. Load Cases from real API
  const loadCases = useCallback(async (court?: string) => {
    setIsLoadingCases(true);
    try {
      const res = await fetchCases(court);
      if (res.cases && res.cases.length > 0) {
        setCases(res.cases);
        setSelectedCaseId(res.cases[0].id);
      } else {
        // Fallback to sample mock data if DB is empty
        setCases(MOCK_CASES);
      }
    } catch {
      setCases(MOCK_CASES);
    } finally {
      setIsLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    loadCases(selectedBench);
  }, [selectedBench, loadCases]);

  // Handle role switch (with real JWT token exchange)
  const handleRoleChange = async (role: UserRole) => {
    setUserRole(role);
    const updatedUser = await switchDemoRole(role);
    if (updatedUser) {
      setCurrentUser(updatedUser);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    clearStoredToken();
    const clerkUser = await switchDemoRole("clerk");
    if (clerkUser) {
      setCurrentUser(clerkUser);
      setUserRole(clerkUser.role);
    }
  };

  const selectedCase =
    cases.find((c) => c.id === selectedCaseId) || cases[0] || MOCK_CASES[0];

  const urgentCount = cases.filter(
    (c) => c.prediction.priorityScore >= 75
  ).length;

  // Global Keyboard Shortcuts (1-6 for tabs)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "1") setActiveTab("dashboard");
      else if (e.key === "2") setActiveTab("research");
      else if (e.key === "3") setActiveTab("cases");
      else if (e.key === "4") setActiveTab("case-detail");
      else if (e.key === "5") setActiveTab("queue");
      else if (e.key === "6") setActiveTab("model-report");
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, []);

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveTab("case-detail");
  };

  const handleNavigateToResearch = (query?: string) => {
    if (query) setResearchQuery(query);
    setActiveTab("research");
  };

  // Register New Case (persists to backend database)
  const handleAddNewCase = async (newCaseData: Partial<CourtCase>) => {
    try {
      const created = await registerNewCase({
        caseNo: newCaseData.caseNo || `NEW/${new Date().getFullYear()}`,
        caseType: newCaseData.caseType || "CRL.A",
        court: newCaseData.court || "Supreme Court of India",
        filingDate: newCaseData.filingDate || new Date().toISOString().split("T")[0],
        hearingsCount: newCaseData.hearingsCount || 1,
        description: newCaseData.description || "Fresh filing awaiting hearing.",
      });

      if (created) {
        setCases((prev) => [created, ...prev]);
        setSelectedCaseId(created.id);
        setActiveTab("case-detail");
        return;
      }
    } catch (err) {
      console.warn("Backend registration failed, adding to local state:", err);
    }

    // Client-side fallback if network fails
    const newCase: CourtCase = {
      id: `case-${Date.now()}`,
      caseNo: newCaseData.caseNo || "NEW/2024",
      caseType: newCaseData.caseType || "CRL.A",
      court: newCaseData.court || "Supreme Court of India",
      filingDate: newCaseData.filingDate || new Date().toISOString().split("T")[0],
      hearingsCount: newCaseData.hearingsCount || 1,
      status: newCaseData.status || "pending",
      bench: newCaseData.bench || "Admission Court",
      petitioner: newCaseData.petitioner || "Petitioner",
      respondent: newCaseData.respondent || "Respondent",
      actsSections: newCaseData.actsSections || ["Constitution Art. 226"],
      description: newCaseData.description || "Fresh petition registered.",
      top1Similarity: newCaseData.top1Similarity || 0.75,
      meanTop5Similarity: newCaseData.meanTop5Similarity || 0.68,
      countAboveThreshold: newCaseData.countAboveThreshold || 2,
      matchedPrecedentIds: newCaseData.matchedPrecedentIds || ["prec-001"],
      prediction: newCaseData.prediction || {
        predictedDays: 120,
        complexity: "Medium",
        priorityScore: 70.0,
        confidenceIntervalDays: [95, 145],
        precedentConfidence: 0.8,
        shapFactors: [
          {
            feature: "Fresh Registration",
            impact: "increases_delay",
            impactDays: 25,
            plainEnglishReason: "Initial docket admission notice required.",
          },
        ],
      },
    };

    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
    setActiveTab("case-detail");
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#171a1d] flex flex-col font-sans selection:bg-[#1c3838] selection:text-white">
      {/* Real Institutional Header */}
      <Header
        currentRole={userRole}
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        activeCaseCount={cases.length}
        selectedBench={selectedBench}
        onBenchChange={setSelectedBench}
        onLogout={handleLogout}
      />

      {/* Main Container: Sidebar + Active View Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Institutional Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedCaseNo={selectedCase?.caseNo}
          urgentQueueCount={urgentCount}
        />

        {/* Center Workspace Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl">
          {activeTab === "dashboard" && (
            <DashboardView
              cases={cases}
              precedents={MOCK_PRECEDENTS}
              onSelectCase={handleSelectCase}
              onNavigateToResearch={handleNavigateToResearch}
              onNavigateToQueue={() => setActiveTab("queue")}
              onNavigateToCases={() => setActiveTab("cases")}
            />
          )}

          {activeTab === "research" && (
            <ResearchView
              precedents={MOCK_PRECEDENTS}
              initialQuery={researchQuery}
              onSelectCaseWithPrecedent={handleSelectCase}
            />
          )}

          {activeTab === "cases" && (
            <CasesView
              cases={cases}
              onSelectCase={handleSelectCase}
              onAddNewCase={handleAddNewCase}
            />
          )}

          {activeTab === "case-detail" && (
            <CaseDetailView
              currentCase={selectedCase}
              precedents={MOCK_PRECEDENTS}
              allCases={cases}
              onSelectAnotherCase={setSelectedCaseId}
              onNavigateToResearch={handleNavigateToResearch}
            />
          )}

          {activeTab === "queue" && (
            <PriorityQueueView
              cases={cases}
              onSelectCase={handleSelectCase}
            />
          )}

          {activeTab === "model-report" && (
            <ModelReportView
              metrics={MOCK_MODEL_METRICS}
              featureImportance={MOCK_FEATURE_IMPORTANCE}
            />
          )}
        </main>
      </div>
    </div>
  );
}
