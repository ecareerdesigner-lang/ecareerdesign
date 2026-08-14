"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReviewPeriodSelect } from "@/components/performance-review/ReviewPeriodSelect.jsx";
import { supabase } from "@/lib/supabase";
import { TOKENS } from "@/lib/design-tokens.js";

export default function NewPerformanceReviewPage() {
  const router = useRouter();
  const [period, setPeriod] = useState("mid_year");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUserId(user.id);
      setCheckingAuth(false);
    }
    checkAuth();
  }, [router]);

  const start = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/performance-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, review_period: period }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start review.");
      router.push(`/performance-review/${data.id}`);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return <p style={{ maxWidth: 560, margin: "40px auto", padding: "0 16px", color: TOKENS.inkSoft }}>Loading...</p>;
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 16px" }}>
      <Link
        href="/"
        style={{
          fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 500,
          padding: "4px 8px", borderRadius: 10, display: "inline-flex",
          alignItems: "center", gap: 8, color: TOKENS.inkSoft,
          textDecoration: "none", marginBottom: 10,
        }}
      >
        ← Home
      </Link>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, margin: "0 0 8px", color: TOKENS.ink }}>
        Performance Review Writer
      </h1>
      <p style={{ fontSize: 15, color: TOKENS.inkSoft, margin: "0 0 20px" }}>Which review is this for?</p>

      <ReviewPeriodSelect value={period} onChange={setPeriod} />

      {error && <p style={{ fontSize: 13, color: TOKENS.red, marginTop: 16 }}>{error}</p>}

      <button
        type="button"
        onClick={start}
        disabled={loading}
        style={{
          marginTop: 20,
          background: TOKENS.accent,
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "12px 22px",
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Starting..." : "Start Review →"}
      </button>
    </div>
  );
}
