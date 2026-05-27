"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS, getDomainEmoji, getDomainLabel } from "@/lib/constants";

const MAX_TEAM_SIZE = 4;

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterDomain, setFilterDomain] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Rename state
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameError, setRenameError] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  const loadDashboard = useCallback(async (verifiedEmail) => {
    setLoading(true);
    try {
      const [teamsRes, userRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/users/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: verifiedEmail }),
        }),
      ]);
      const teamsData = await teamsRes.json();
      const userData = await userRes.json();
      setTeams(teamsData.teams || []);
      if (userData.exists) setCurrentUser(userData.user);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("userEmail");
    if (storedEmail) {
      setEmail(storedEmail);
      loadDashboard(storedEmail);
    }
  }, [loadDashboard]);

  const handleEmailVerify = async (e) => {
    e.preventDefault();
    if (!emailInput.includes("@")) { setEmailError("Please enter a valid email address"); return; }
    setVerifying(true); setEmailError("");
    try {
      const res = await fetch("/api/users/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      if (!data.exists) { setEmailError("No account found with this email."); return; }
      sessionStorage.setItem("userEmail", emailInput.toLowerCase());
      setEmail(emailInput.toLowerCase());
      setCurrentUser(data.user);
      loadDashboard(emailInput.toLowerCase());
    } catch { setEmailError("Failed to verify email."); }
    finally { setVerifying(false); }
  };

  const handleRenameSubmit = async (teamId) => {
    if (!newName.trim()) { setRenameError("Name cannot be empty"); return; }
    setRenameSaving(true); setRenameError("");
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), userEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) { setRenameError(data.error || "Failed to rename"); return; }
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, name: data.team.name } : t));
      setRenaming(false);
      setNewName("");
    } catch { setRenameError("Something went wrong"); }
    finally { setRenameSaving(false); }
  };

  const handleChangeTeam = async () => {
    try {
      await fetch("/api/users/leave-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email }),
      });
      const userData = sessionStorage.getItem("userData");
      if (userData) {
        const parsed = JSON.parse(userData);
        sessionStorage.setItem("userData", JSON.stringify({ ...parsed, team_id: null }));
      }
    } catch {}
    sessionStorage.setItem("changingTeam", "true");
    router.push("/join");
  };

  const filteredTeams = teams.filter((team) => {
    const domainMatch = filterDomain === "all" || team.domain === filterDomain;
    const searchMatch = !searchQuery ||
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDomainLabel(team.domain).toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.members?.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return domainMatch && searchMatch;
  });

  const totalParticipants = teams.reduce((sum, t) => sum + t.member_count, 0);
  const fullTeams = teams.filter((t) => t.member_count === MAX_TEAM_SIZE).length;
  const domainsActive = new Set(teams.map((t) => t.domain)).size;
  // Use == (not ===) to handle string/number mismatch from sessionStorage vs API
  const userTeam = currentUser?.team_id
    ? teams.find((t) => t.id == currentUser.team_id)
    : null;
  const isTeamCreator = userTeam?.created_by === email;

  if (!email) {
    return (
      <main className="min-h-screen dot-grid flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <span className="font-display font-bold text-2xl text-slate-900">
              Vibe<span className="text-indigo-600">Teams</span>
            </span>
          </div>
          <div className="card p-8">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl mb-5">🔐</div>
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Verify your email</h2>
            <p className="text-slate-400 text-sm mb-6">Enter your registered email to view the dashboard.</p>
            <form onSubmit={handleEmailVerify} className="space-y-4">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50
                           text-slate-900 placeholder-slate-400 font-mono text-sm
                           focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              {emailError && <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2"><p className="text-red-600 text-xs">{emailError}</p></div>}
              <button
                type="submit"
                disabled={verifying}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-display font-semibold
                           py-3.5 px-6 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "View Dashboard →"}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => router.push("/")} className="text-slate-400 hover:text-indigo-600 text-sm transition-colors">
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen dot-grid">
      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span onClick={() => router.push("/")} className="font-display font-bold text-xl text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors">
              Vibe<span className="text-indigo-600">Teams</span>
            </span>
            <span className="text-slate-200">/</span>
            <span className="text-slate-400 text-sm">dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => loadDashboard(email)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-slate-600 text-xs font-mono">{email}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Your team banner */}
        {currentUser && userTeam && (
          <div className="mb-8 bg-indigo-50 border border-indigo-200 rounded-2xl overflow-hidden animate-slide-up">
            {/* Top row: label + Change Team button */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <span className="text-indigo-500 text-xs font-semibold uppercase tracking-wider">Your Team</span>
              <button
                onClick={handleChangeTeam}
                className="bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-600
                           hover:text-white text-indigo-600 text-sm font-semibold px-4 py-2 rounded-xl
                           transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Change Team
              </button>
            </div>

            {/* Team info */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-6 pb-5">
              <div>
                {renaming ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      autoFocus
                      type="text"
                      value={newName}
                      onChange={(e) => { setNewName(e.target.value); setRenameError(""); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSubmit(userTeam.id);
                        if (e.key === "Escape") { setRenaming(false); setRenameError(""); }
                      }}
                      className="border border-indigo-300 rounded-lg px-3 py-1.5 text-slate-900 font-display
                                 font-bold text-xl bg-white focus:border-indigo-500 focus:ring-2
                                 focus:ring-indigo-100 transition-all w-64"
                    />
                    <button onClick={() => handleRenameSubmit(userTeam.id)} disabled={renameSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50">
                      {renameSaving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => { setRenaming(false); setRenameError(""); }}
                      className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1.5 transition-colors">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display text-2xl font-bold text-slate-900">{userTeam.name}</h2>
                    {isTeamCreator && (
                      <button onClick={() => { setRenaming(true); setNewName(userTeam.name); }}
                        title="Rename team"
                        className="text-indigo-400 hover:text-indigo-600 transition-colors p-1 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                {renameError && <p className="text-red-500 text-xs mb-1">{renameError}</p>}
                <p className="text-slate-500 text-sm">
                  {getDomainEmoji(userTeam.domain)} {getDomainLabel(userTeam.domain)}
                  <span className="mx-2 text-slate-300">·</span>
                  {userTeam.member_count}/{MAX_TEAM_SIZE} members
                  {isTeamCreator && <span className="ml-2 text-indigo-400 text-xs">(you created this team)</span>}
                </p>
              </div>

              {/* Member avatars */}
              <div className="flex gap-2">
                {userTeam.members?.map((m) => (
                  <div key={m.id} title={m.name}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2
                      ${m.email === currentUser.email
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white border-slate-200 text-slate-600"}`}
                  >
                    {m.name[0].toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentUser && !currentUser.team_id && (
          <div className="mb-8 bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="font-display font-semibold text-amber-800">You haven't joined a team yet!</p>
              <p className="text-amber-600 text-sm">Find your crew or create a new team.</p>
            </div>
            <button onClick={() => router.push("/join")}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all">
              Find a Team →
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Teams", value: teams.length, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Participants", value: totalParticipants, color: "text-cyan-600", bg: "bg-cyan-50" },
            { label: "Full Teams", value: fullTeams, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "Active Domains", value: domainsActive, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className={`inline-flex w-10 h-10 rounded-xl ${stat.bg} items-center justify-center mb-3`}>
                <div className={`font-display text-lg font-bold ${stat.color}`}>{loading ? "—" : stat.value}</div>
              </div>
              <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams or members..."
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 bg-white
                         text-slate-900 placeholder-slate-400 text-sm
                         focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>
          <select
            value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)}
            className="border border-slate-200 rounded-xl px-4 py-3 bg-white text-slate-700 text-sm
                       focus:border-indigo-400 transition-all cursor-pointer"
          >
            <option value="all">All Domains</option>
            {DOMAINS.map((d) => <option key={d.value} value={d.value}>{d.emoji} {d.label}</option>)}
          </select>
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="text-center py-24">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Loading teams...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="card text-center py-24">
            <div className="text-5xl mb-4">🏗️</div>
            <p className="font-display text-xl font-bold text-slate-600 mb-2">No teams found</p>
            <p className="text-slate-400 text-sm">{teams.length === 0 ? "Be the first to create a team!" : "Try a different filter"}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => {
              const isFull = team.member_count >= MAX_TEAM_SIZE;
              const isMyTeam = team.id === currentUser?.team_id;
              return (
                <div key={team.id} className={`card card-hover p-5 ${isMyTeam ? "border-indigo-300 border-2" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{getDomainEmoji(team.domain)}</span>
                        {isMyTeam && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Your Team</span>}
                      </div>
                      <h3 className="font-display font-bold text-slate-900 text-lg leading-tight truncate">{team.name}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{getDomainLabel(team.domain)}</p>
                    </div>
                    <div className="ml-3 text-right flex-shrink-0">
                      <div className={`font-mono text-sm font-bold ${isFull ? "text-red-400" : "text-indigo-600"}`}>
                        {team.member_count}/{MAX_TEAM_SIZE}
                      </div>
                      <div className={`text-xs ${isFull ? "text-red-400" : "text-slate-400"}`}>{isFull ? "full" : "open"}</div>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: MAX_TEAM_SIZE }).map((_, i) => (
                      <div key={i} className={`flex-1 h-1.5 rounded-full ${i < team.member_count ? (isMyTeam ? "bg-indigo-500" : "bg-slate-300") : "bg-slate-100"}`} />
                    ))}
                  </div>

                  <div className="space-y-2">
                    {team.members?.map((member) => (
                      <div key={member.id} className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                          ${member.email === currentUser?.email ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                          {member.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-slate-800 text-sm font-medium truncate">
                            {member.name}
                            {member.email === currentUser?.email && <span className="text-indigo-400 text-xs ml-1">(you)</span>}
                            {member.email === team.created_by && <span className="text-slate-400 text-xs ml-1">★</span>}
                          </div>
                          <div className="text-slate-400 text-xs truncate font-mono">{member.email}</div>
                        </div>
                      </div>
                    ))}
                    {Array.from({ length: MAX_TEAM_SIZE - (team.members?.length || 0) }).map((_, i) => (
                      <div key={`e${i}`} className="flex items-center gap-2.5 opacity-40">
                        <div className="w-7 h-7 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                          <span className="text-xs text-slate-400">+</span>
                        </div>
                        <span className="text-slate-400 text-xs">open slot</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-300 text-xs">
            VibeTeams ·{" "}
            <button onClick={() => router.push("/")} className="text-indigo-400 hover:underline">Home</button>
          </p>
        </div>
      </div>
    </main>
  );
}
