"use client";

import React, { useState } from "react";
import { loginWithCredentials, switchDemoRole } from "@/lib/api";
import { UserProfile } from "@/lib/types";

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithCredentials(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: "clerk" | "researcher" | "judge") => {
    setLoading(true);
    setError(null);
    try {
      const user = await switchDemoRole(role);
      if (user) onLogin(user);
      else setError("Demo login failed — backend may be offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center">
      <div className="w-full max-w-sm border border-[#e2ded6] rounded-lg bg-white shadow-sm p-8">
        <h1 className="text-xl font-semibold text-[#1c3838] mb-1">CaseLens</h1>
        <p className="text-xs text-[#6b7280] mb-6">Judicial Intelligence Platform</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#e2ded6] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1c3838]"
              placeholder="you@ecourts.gov.in"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#e2ded6] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1c3838]"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1c3838] text-white py-2 rounded text-sm font-medium hover:bg-[#14292929] disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 border-t border-[#e2ded6] pt-4">
          <p className="text-xs text-[#6b7280] mb-2">
            Demo logins (synthetic data — not real court records):
          </p>
          <div className="flex gap-2">
            {(["clerk", "researcher", "judge"] as const).map((role) => (
              <button
                key={role}
                onClick={() => handleDemoLogin(role)}
                disabled={loading}
                className="flex-1 border border-[#e2ded6] rounded px-2 py-1.5 text-xs capitalize text-[#374151] hover:bg-[#f7f5f0] disabled:opacity-50"
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
