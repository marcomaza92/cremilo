"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const VALID_SECTIONS = [
  "payment-methods",
  "categories",
  "rates",
  "preferences",
] as const;

type ConfigSection = (typeof VALID_SECTIONS)[number];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidSection(value: string | null): value is ConfigSection {
  return VALID_SECTIONS.includes(value as ConfigSection);
}

function isValidUuid(value: string | null): boolean {
  return value !== null && UUID_RE.test(value);
}

export function useConfigDeepLink() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const section = searchParams.get("section");
    const highlight = searchParams.get("highlight");

    if (!isValidSection(section)) {
      return;
    }

    const sectionEl = document.getElementById(`config-section-${section}`);
    if (!sectionEl) {
      return;
    }

    sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });

    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (isValidUuid(highlight)) {
      const rowEl = document.getElementById(`config-row-${highlight}`);
      if (rowEl) {
        rowEl.classList.add("config-row--highlighted");
        timerId = setTimeout(() => {
          rowEl.classList.remove("config-row--highlighted");
        }, 1000);
      }
    }

    return () => {
      clearTimeout(timerId);
    };
  }, [searchParams]);
}
