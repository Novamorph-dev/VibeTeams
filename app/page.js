"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getDomainEmoji, getDomainLabel } from "@/lib/constants";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await fetch(`/api/users?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" },
        });
        const d = await res.json();
        setParticipants(d.users || []);
      } catch {}
      finally { setLoadingParticipants(false); }
    };
    fetchParticipants();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.exists) {
        sessionStorage.clear();
        sessionStorage.setItem("userEmail", email.toLowerCase());
        sessionStorage.setItem("userData", JSON.stringify(data.user));

        if (!data.user.domain) {
          router.push("/register");
        } else if (data.user.team_id) {
          // Already on a team — go to dashboard to manage it
          router.push("/dashboard");
        } else {
          router.push("/join");
        }
      } else {
        // New user — clear stale data so register page starts fresh
        sessionStorage.clear();
        sessionStorage.setItem("pendingEmail", email.toLowerCase());
        router.push("/register");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = participants.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q)
    );
  });

  const teamed = participants.filter((p) => p.team_id).length;

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display font-bold text-xl text-slate-900">
            Vibe<span className="text-indigo-600">Teams</span>
          </span>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
          >
            View Dashboard →
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Top row: image left, form right */}
        <div className="grid lg:grid-cols-2 gap-10 items-center mb-12">

          {/* Left: showcase image */}
          <div className="animate-fade-in rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <Image
              src="/showcase.png"
              alt="Vibe Coding Showcase — Wharton Club of the National Capital Region"
              width={1456}
              height={816}
              className="w-full h-auto object-cover"
              priority
            />
          </div>

          {/* Right: headline + stats + form */}
          <div className="animate-slide-up">
            <h2 className="font-display text-3xl font-bold text-slate-900 mb-3">
              Find your vibe coding crew
            </h2>
            <p className="text-slate-500 text-base mb-8 leading-relaxed">
              Get matched with up to 3 others in your domain. Build something people actually want.
            </p>

            {/* Stats row */}
            <div className="flex gap-8 mb-10">
              {[
                { value: participants.length, label: "Participants" },
                { value: teamed, label: "In Teams" },
                { value: participants.length - teamed, label: "Unassigned" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-bold text-slate-900">{s.value}</div>
                  <div className="text-slate-400 text-xs font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Email form */}
            <div className="card p-6">
              <p className="font-display font-semibold text-slate-800 mb-1">Enter your email to get started</p>
              <p className="text-slate-400 text-sm mb-5">
                Already registered? We'll drop you right in.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900
                             placeholder-slate-400 font-mono text-sm bg-slate-50
                             focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                             transition-all duration-200"
                />
                {error && (
                  <p className="text-red-500 text-xs font-mono">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-display
                             font-semibold py-3 px-6 rounded-xl text-sm tracking-wide
                             transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Checking..." : "Continue →"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom: participant list full width */}
        <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-slate-800">Participants</h2>
                <p className="text-slate-400 text-xs mt-0.5">{participants.length} registered</p>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono
                           bg-slate-50 text-slate-700 placeholder-slate-400 w-40
                           focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="accent-line" />

            {/* Column headers */}
            <div className="grid grid-cols-12 px-5 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-5">Name</div>
              <div className="col-span-5">Email</div>
              <div className="col-span-1">Domain</div>
              <div className="col-span-1 text-right">Status</div>
            </div>

            {/* List — no height cap, shows all */}
            <div className="divide-y divide-slate-50">
              {loadingParticipants ? (
                <div className="py-12 text-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-slate-400 text-xs">Loading participants...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-400 text-sm">
                    {participants.length === 0 ? "No participants yet." : "No results found."}
                  </p>
                </div>
              ) : (
                filtered.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-12 items-center px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    {/* Avatar + Name */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background: p.team_id ? "linear-gradient(135deg, #4F46E5, #06B6D4)" : "#F1F5F9",
                          color: p.team_id ? "white" : "#94A3B8",
                        }}
                      >
                        {(p.name || "?")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800 text-sm truncate">{p.name}</span>
                    </div>

                    {/* Email */}
                    <div className="col-span-5 font-mono text-slate-400 text-xs truncate pr-4">
                      {p.email}
                    </div>

                    {/* Domain */}
                    <div className="col-span-1 text-base" title={getDomainLabel(p.domain)}>
                      {p.domain ? getDomainEmoji(p.domain) : <span className="text-slate-300 text-xs">—</span>}
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex justify-end">
                      {p.team_id ? (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          ✓ teamed
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                          open
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {participants.length > 0 && (
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-400 text-xs font-mono">{teamed}/{participants.length} in a team</span>
                <div className="flex gap-1 items-center">
                  {Array.from({ length: Math.min(participants.length, 12) }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < teamed ? "bg-indigo-500" : "bg-slate-200"}`} />
                  ))}
                  {participants.length > 12 && (
                    <span className="text-slate-400 text-xs ml-1">+{participants.length - 12}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
