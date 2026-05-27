"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS, getDomainEmoji, getDomainLabel } from "@/lib/constants";

const MAX_TEAM_SIZE = 4;

export default function JoinPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mode, setMode] = useState(null);
  const [filterDomain, setFilterDomain] = useState("all");
  const [newTeamName, setNewTeamName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isChangingTeam, setIsChangingTeam] = useState(false);

  // Custom domain state for team creation
  const [createDomain, setCreateDomain] = useState(""); // "user" = use user's domain, or a custom value
  const [customCreateDomain, setCustomCreateDomain] = useState("");
  const [showCustomCreateDomain, setShowCustomCreateDomain] = useState(false);
  const customDomainRef = useRef(null);

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    const userData = sessionStorage.getItem("userData");
    const changing = sessionStorage.getItem("changingTeam");

    if (!email) { router.push("/"); return; }

    if (changing === "true") {
      setIsChangingTeam(true);
      sessionStorage.removeItem("changingTeam");
    }

    if (userData) {
      const parsed = JSON.parse(userData);
      // If they have a team and aren't actively changing, go to dashboard
      if (parsed.team_id && changing !== "true") { router.push("/dashboard"); return; }
      setUser({ ...parsed, team_id: null }); // treat as teamless for this flow
      setFilterDomain(parsed.domain);
    } else {
      fetch("/api/users/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.exists) {
            if (data.user.team_id && changing !== "true") { router.push("/dashboard"); return; }
            setUser({ ...data.user, team_id: null });
            setFilterDomain(data.user.domain);
          } else { router.push("/register"); }
        });
    }
  }, [router]);

  useEffect(() => { if (user) fetchTeams(); }, [user]);
  useEffect(() => {
    if (showCustomCreateDomain && customDomainRef.current) customDomainRef.current.focus();
  }, [showCustomCreateDomain]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      setTeams(data.teams || []);
    } catch { setError("Failed to load teams"); }
    finally { setLoading(false); }
  };

  // Effective domain for new team creation
  const effectiveCreateDomain = showCustomCreateDomain
    ? customCreateDomain.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    : (createDomain || user?.domain);

  const handleAutoAssign = async () => {
    setJoining(true); setError("");
    try {
      const res = await fetch("/api/teams/auto-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(data.isNewTeam ? `Created and joined "${data.team.name}"!` : `Joined "${data.team.name}"!`);
      sessionStorage.setItem("userData", JSON.stringify({ ...user, team_id: data.team.id }));
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch { setError("Failed to auto-assign."); }
    finally { setJoining(false); }
  };

  const handleJoinTeam = async (teamId) => {
    setJoining(true); setError("");
    try {
      const res = await fetch(`/api/teams/${teamId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(`Joined "${data.team.name}"!`);
      sessionStorage.setItem("userData", JSON.stringify({ ...user, team_id: data.team.id }));
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch { setError("Failed to join team."); }
    finally { setJoining(false); }
  };

  const handleCreateTeam = async () => {
    if (!effectiveCreateDomain) { setError("Please select or enter a domain for the team"); return; }
    setCreating(true); setError("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName.trim() || undefined,
          domain: effectiveCreateDomain,
          userEmail: user.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(`Created and joined "${data.team.name}"!`);
      sessionStorage.setItem("userData", JSON.stringify({ ...user, team_id: data.team.id }));
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch { setError("Failed to create team."); }
    finally { setCreating(false); }
  };

  const filteredTeams = teams.filter((t) => filterDomain === "all" || t.domain === filterDomain);
  if (!user) return null;

  return (
    <main className="min-h-screen dot-grid">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display font-bold text-xl text-slate-900">
            Vibe<span className="text-indigo-600">Teams</span>
          </span>
          <button onClick={() => router.push(isChangingTeam ? "/dashboard" : "/")} className="text-slate-400 hover:text-slate-700 text-sm transition-colors">
            ← {isChangingTeam ? "Back to Dashboard" : "Home"}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8 animate-slide-up">
          {isChangingTeam && (
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              🔄 Changing team
            </div>
          )}
          <h1 className="font-display text-4xl font-bold text-slate-900">
            {isChangingTeam ? "Choose a new team" : "Find your crew,"}{" "}
            {!isChangingTeam && <span className="text-indigo-600">{user.name.split(" ")[0]}</span>}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Domain: <span className="text-slate-700 font-medium">{getDomainEmoji(user.domain)} {getDomainLabel(user.domain)}</span>
          </p>
        </div>

        {success ? (
          <div className="card p-10 text-center animate-fade-in">
            <div className="text-5xl mb-3">🎉</div>
            <p className="font-display text-xl font-bold text-slate-900">{success}</p>
            <p className="text-slate-400 text-sm mt-2">Redirecting to dashboard...</p>
          </div>
        ) : !mode ? (
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => { setMode("auto"); handleAutoAssign(); }}
              className="card card-hover p-8 text-left border-2 hover:border-indigo-300 transition-all"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl mb-5">⚡</div>
              <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Auto-Assign Me</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Best open slot in <span className="text-indigo-600 font-medium">{getDomainLabel(user.domain)}</span>.
                No spots? A new team is created automatically.
              </p>
              <div className="mt-6 text-indigo-600 text-sm font-semibold">Get matched instantly →</div>
            </button>
            <button
              onClick={() => setMode("manual")}
              className="card card-hover p-8 text-left border-2 hover:border-cyan-300 transition-all"
            >
              <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center text-2xl mb-5">🔍</div>
              <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Browse Teams</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                See all active teams, join any that interests you, or create a new one in any domain.
              </p>
              <div className="mt-6 text-cyan-600 text-sm font-semibold">Browse all teams →</div>
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <button onClick={() => setMode(null)} className="text-slate-400 hover:text-slate-700 text-sm transition-colors flex items-center gap-1">
                ← Change method
              </button>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="border border-slate-200 hover:border-indigo-400 bg-white text-slate-700 font-semibold
                           py-2.5 px-5 rounded-xl text-sm transition-all flex items-center gap-2"
              >
                <span className="text-indigo-600 text-lg leading-none">+</span> Create New Team
              </button>
            </div>

            {/* Create Team Form */}
            {showCreateForm && (
              <div className="card border-indigo-200 p-5 mb-5 animate-slide-up space-y-4">
                <div>
                  <h3 className="font-display font-bold text-slate-800 mb-0.5">Create a New Team</h3>
                  <p className="text-slate-400 text-xs">Choose a domain and optionally name your team.</p>
                </div>

                {/* Domain for new team */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Team Domain</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {/* Use my domain */}
                    <button
                      type="button"
                      onClick={() => { setCreateDomain(""); setShowCustomCreateDomain(false); setCustomCreateDomain(""); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                        ${!showCustomCreateDomain && !createDomain
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                    >
                      <span>{getDomainEmoji(user.domain)}</span>
                      <span>My Domain ({getDomainLabel(user.domain)})</span>
                    </button>

                    {/* Other predefined domains */}
                    {DOMAINS.filter((d) => d.value !== user.domain).map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => { setCreateDomain(d.value); setShowCustomCreateDomain(false); setCustomCreateDomain(""); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                          ${createDomain === d.value && !showCustomCreateDomain
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                      >
                        <span>{d.emoji}</span>
                        <span>{d.label}</span>
                      </button>
                    ))}

                    {/* Custom */}
                    <button
                      type="button"
                      onClick={() => { setShowCustomCreateDomain(true); setCreateDomain(""); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                        ${showCustomCreateDomain
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-dashed border-slate-300 text-slate-500 hover:border-indigo-300"}`}
                    >
                      <span>✏️</span>
                      <span>Custom</span>
                    </button>
                  </div>

                  {showCustomCreateDomain && (
                    <input
                      ref={customDomainRef}
                      type="text"
                      value={customCreateDomain}
                      onChange={(e) => setCustomCreateDomain(e.target.value)}
                      placeholder="e.g. Cybersecurity, Agriculture..."
                      className="w-full border border-indigo-300 rounded-xl px-4 py-2.5 text-sm bg-white
                                 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  )}
                </div>

                {/* Team name */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Team name (optional — we'll generate one)"
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50
                               text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  <button
                    onClick={handleCreateTeam}
                    disabled={creating || !effectiveCreateDomain}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5
                               rounded-xl text-sm transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {creating ? "Creating..." : "Create & Join"}
                  </button>
                </div>
              </div>
            )}

            {/* Domain filter */}
            <div className="flex gap-2 mb-5 flex-wrap">
              <button
                onClick={() => setFilterDomain("all")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all
                  ${filterDomain === "all" ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterDomain(user.domain)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all
                  ${filterDomain === user.domain ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
              >
                ★ {getDomainLabel(user.domain)}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Loading teams...</p>
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-4xl mb-3">🏗️</div>
                <p className="font-display font-semibold text-slate-700 text-lg mb-1">No teams yet</p>
                <p className="text-slate-400 text-sm">Be the first to create one!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredTeams.map((team) => {
                  const isFull = team.member_count >= MAX_TEAM_SIZE;
                  const isUserDomain = team.domain === user.domain;
                  return (
                    <div key={team.id} className={`card card-hover p-5 ${isUserDomain ? "border-indigo-200" : ""}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          {isUserDomain && <span className="text-xs text-indigo-500 font-medium">★ Your Domain</span>}
                          <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">{team.name}</h3>
                          <p className="text-slate-400 text-xs">{getDomainEmoji(team.domain)} {getDomainLabel(team.domain)}</p>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono text-sm font-bold ${isFull ? "text-red-400" : "text-indigo-600"}`}>
                            {team.member_count}/{MAX_TEAM_SIZE}
                          </div>
                          <div className={`text-xs ${isFull ? "text-red-400" : "text-slate-400"}`}>{isFull ? "full" : "open"}</div>
                        </div>
                      </div>

                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: MAX_TEAM_SIZE }).map((_, i) => (
                          <div key={i} className={`flex-1 h-1.5 rounded-full ${i < team.member_count ? (isUserDomain ? "bg-indigo-500" : "bg-cyan-400") : "bg-slate-100"}`} />
                        ))}
                      </div>

                      {team.members?.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 mb-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {m.name[0].toUpperCase()}
                          </div>
                          <span className="text-slate-600 text-xs">{m.name}</span>
                        </div>
                      ))}

                      <button
                        onClick={() => handleJoinTeam(team.id)}
                        disabled={isFull || joining}
                        className={`w-full mt-4 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all disabled:cursor-not-allowed
                          ${isFull ? "bg-slate-100 text-slate-400" : isUserDomain
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                            : "bg-slate-900 hover:bg-slate-700 text-white"}`}
                      >
                        {isFull ? "Team Full" : joining ? "Joining..." : "Join Team →"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
