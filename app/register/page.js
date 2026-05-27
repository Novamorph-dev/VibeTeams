"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPreSeeded, setIsPreSeeded] = useState(false);
  const customInputRef = useRef(null);

  useEffect(() => {
    const pendingEmail = sessionStorage.getItem("pendingEmail");
    const userEmail = sessionStorage.getItem("userEmail");
    const userData = sessionStorage.getItem("userData");

    if (pendingEmail) {
      setEmail(pendingEmail);
      setIsPreSeeded(false);
      return;
    }
    if (userEmail && userData) {
      const parsed = JSON.parse(userData);
      if (!parsed.domain) {
        setEmail(userEmail);
        setName(parsed.name);
        setIsPreSeeded(true);
        return;
      }
      router.push(parsed.team_id ? "/dashboard" : "/join");
      return;
    }
    router.push("/");
  }, [router]);

  useEffect(() => {
    if (showCustomInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomInput]);

  const handleSelectCustom = () => {
    setDomain(""); // clear predefined selection
    setShowCustomInput(true);
  };

  const handleSelectPredefined = (value) => {
    setDomain(value);
    setShowCustomInput(false);
    setCustomDomain("");
  };

  // The final domain value: predefined or slugified custom
  const effectiveDomain = showCustomInput
    ? customDomain.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    : domain;

  const selectedLabel = showCustomInput
    ? customDomain.trim() || "Custom domain"
    : DOMAINS.find((d) => d.value === domain)?.label || "";

  const selectedEmoji = showCustomInput ? "🔧" : DOMAINS.find((d) => d.value === domain)?.emoji || "";

  const isValid = effectiveDomain.length > 0 && (isPreSeeded || name.trim().length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) { setError("Please fill in all fields"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, domain: effectiveDomain }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      sessionStorage.setItem("userEmail", email);
      sessionStorage.setItem("userData", JSON.stringify(data.user));
      sessionStorage.removeItem("pendingEmail");
      router.push("/join");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen dot-grid">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display font-bold text-xl text-slate-900">
            Vibe<span className="text-indigo-600">Teams</span>
          </span>
          <button onClick={() => router.push("/")} className="text-slate-400 hover:text-slate-700 text-sm transition-colors">
            ← Back
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Steps */}
        <div className="flex items-center gap-3 mb-10">
          {[
            { n: 1, label: "Profile", active: true },
            { n: 2, label: "Join Team", active: false },
            { n: 3, label: "Dashboard", active: false },
          ].map((step, i) => (
            <div key={step.n} className="flex items-center gap-3">
              {i > 0 && <div className={`h-px w-8 ${step.active ? "bg-indigo-400" : "bg-slate-200"}`} />}
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${step.active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {step.n}
                </div>
                <span className={`text-xs font-medium ${step.active ? "text-indigo-600" : "text-slate-400"}`}>
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-8">
          {isPreSeeded ? (
            <>
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
                <span>👋</span> Welcome back, {name.split(" ")[0]}!
              </div>
              <h1 className="font-display text-3xl font-bold text-slate-900 mb-1">Choose your domain</h1>
              <p className="text-slate-400 text-sm mb-8">
                You're registered as <span className="text-indigo-600 font-mono">{email}</span>.
                Pick the industry you want to build for.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl font-bold text-slate-900 mb-1">Create your profile</h1>
              <p className="text-slate-400 text-sm mb-8">
                Registering as <span className="text-indigo-600 font-mono">{email}</span>
              </p>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isPreSeeded && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50
                             text-slate-900 placeholder-slate-400 text-sm
                             focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Choose Your Domain
              </label>
              <p className="text-slate-400 text-xs mb-3">
                What industry are you building for? Don't see yours? Add a custom one below.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                {DOMAINS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => handleSelectPredefined(d.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all
                      ${domain === d.value && !showCustomInput
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <span className="text-base flex-shrink-0">{d.emoji}</span>
                    <span className="leading-tight">{d.label}</span>
                  </button>
                ))}

                {/* Custom domain tile */}
                <button
                  type="button"
                  onClick={handleSelectCustom}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all
                    ${showCustomInput
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-dashed border-slate-300 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                >
                  <span className="text-base flex-shrink-0">✏️</span>
                  <span className="leading-tight">Custom Domain</span>
                </button>
              </div>

              {/* Custom domain input */}
              {showCustomInput && (
                <div className="mt-3 animate-slide-up">
                  <input
                    ref={customInputRef}
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="e.g. Cybersecurity, Agriculture, Logistics..."
                    className="w-full border border-indigo-300 rounded-xl px-4 py-3 bg-white
                               text-slate-900 placeholder-slate-400 text-sm
                               focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                  <p className="text-slate-400 text-xs mt-1.5 font-mono">
                    Stored as: <span className="text-indigo-500">{effectiveDomain || "..."}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Selected preview */}
            {effectiveDomain && (
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                <span className="text-2xl">{selectedEmoji}</span>
                <div>
                  <div className="text-indigo-500 text-xs font-semibold uppercase tracking-wider">Selected</div>
                  <div className="text-indigo-800 font-display font-semibold">{selectedLabel}</div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-display font-semibold
                         py-3.5 px-6 rounded-xl text-sm tracking-wide
                         transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Continue to Team Selection →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
