"use client";

import { useEffect, useRef, useState } from "react";

export function useAutosave(review, userId) {
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!review || !userId) return;

    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");

    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/performance-review/${review.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...review, userId }),
        });
        setStatus(res.ok ? "saved" : "error");
      } catch {
        setStatus("error");
      }
    }, 1500);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(review), userId]);

  return status;
}
