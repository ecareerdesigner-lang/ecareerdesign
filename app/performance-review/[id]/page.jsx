"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReviewPeriodSelect } from "@/components/performance-review/ReviewPeriodSelect.jsx";
import { GoalsBuilder } from "@/components/performance-review/GoalsBuilder.jsx";
import { AccomplishmentsSection } from "@/components/performance-review/AccomplishmentsSection.jsx";
import { ExportSection } from "@/components/performance-review/ExportSection.jsx";
import { useAutosave } from "@/components/performance-review/useAutosave.js";
import { supabase } from "@/lib/supabase";
import { TOKENS } from "@/lib/design-tokens.js";

export default function PerformanceReviewPage({ params }) {
  const router = useRouter();
  const [review, setReview] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUserId(user.id);
      try {
        const res = await fetch(`/api/performance-review/${params.id}?userId=${user.id}`);
        if (!res.ok) throw new Error((await res.json()).error || "Could not load review.");
        setReview(await res.json());
      } catch (e) {
        setLoadError(e.message);
      }
    }
    init();
  }, [params.id, router]);

  const saveStatus = useAutosave(review, userId);

  if (loadError) {
    return <p style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px", color: TOKENS.red }}>{loadError}</p>;
  }
  if (!review) {
    return <p style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px", color: TOKENS.inkSoft }}>Loading...</p>;
  }

  const update = (patch) => setReview({ ...review, ...patch });

  const sectionHeader = { fontSize: 12, fontWeight: 600, color: TOKENS.inkSoft, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 10px" };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 16px", display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, margin: 0, color: TOKENS.ink }}>
            Performance Review Writer
          </h1>
          <span style={{ fontSize: 12, color: TOKENS.inkSoft }}>
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && <span style={{ color: TOKENS.red }}>Save failed</span>}
          </span>
        </div>
      </div>

      <section>
        <p style={sectionHeader}>1. Review period</p>
        <ReviewPeriodSelect
          value={review.review_period}
          onChange={(review_period) => update({ review_period })}
        />
      </section>

      <section>
        <p style={sectionHeader}>2. Goals &amp; tasks</p>
        <GoalsBuilder
          goals={review.goals}
          onChange={(goals) => update({ goals })}
          reviewId={review.id}
          userId={userId}
        />
      </section>

      <section>
        <p style={sectionHeader}>3. Accomplishments</p>
        <AccomplishmentsSection
          reviewId={review.id}
          userId={userId}
          rawText={review.accomplishments_raw}
          enhancedText={review.accomplishments_enhanced}
          elementsDemonstrated={review.elements_demonstrated}
          goalCount={review.goals.length}
          onRawChange={(accomplishments_raw) => update({ accomplishments_raw })}
          onEnhanced={(accomplishments_enhanced, elements_demonstrated) =>
            update({ accomplishments_enhanced, elements_demonstrated })
          }
        />
      </section>

      <section>
        <p style={sectionHeader}>4. Export</p>
        <ExportSection review={review} />
      </section>
    </div>
  );
}
