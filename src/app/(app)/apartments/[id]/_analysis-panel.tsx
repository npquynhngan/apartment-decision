"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { AiAnalysis } from "@/lib/llm";
import { analyzeApartment } from "../actions";

type StoredAnalysis = {
  value: AiAnalysis;
  at: string | null;
};

function isAiAnalysis(v: unknown): v is AiAnalysis {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.summary === "string" &&
    Array.isArray(o.pros) &&
    Array.isArray(o.cons) &&
    Array.isArray(o.verify)
  );
}

function formatTimestamp(iso: string | null) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-SG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export function AnalysisPanel({
  apartmentId,
  enabled,
  initialAnalysis,
  initialAt,
}: {
  apartmentId: string;
  enabled: boolean;
  initialAnalysis: unknown;
  initialAt: string | null;
}) {
  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(
    isAiAnalysis(initialAnalysis)
      ? { value: initialAnalysis, at: initialAt }
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await analyzeApartment(apartmentId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        setAnalysis({ value: result.data, at: new Date().toISOString() });
      }
    });
  }

  if (!enabled) {
    return (
      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">AI analysis</h2>
        <p className="text-sm text-muted-foreground">
          Set <code className="text-xs">ANTHROPIC_API_KEY</code> in the server
          environment to enable per-apartment analysis.
        </p>
      </section>
    );
  }

  const generatedAt = formatTimestamp(analysis?.at ?? null);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-semibold tracking-tight">AI analysis</h2>
        <Button
          onClick={handleGenerate}
          disabled={isPending}
          size="sm"
          variant={analysis ? "outline" : "default"}
        >
          {isPending
            ? "Analysing…"
            : analysis
              ? "Regenerate"
              : "Generate analysis"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!analysis && !isPending && !error && (
        <p className="text-sm text-muted-foreground">
          Generate a Claude-written summary, pros, cons, and things to verify
          before viewing.
        </p>
      )}

      {analysis && (
        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-sm leading-relaxed">{analysis.value.summary}</p>

          <div className="grid gap-4 sm:grid-cols-3">
            <AnalysisList
              label="Pros"
              items={analysis.value.pros}
              tone="positive"
            />
            <AnalysisList
              label="Cons"
              items={analysis.value.cons}
              tone="negative"
            />
            <AnalysisList
              label="Verify"
              items={analysis.value.verify}
              tone="neutral"
            />
          </div>

          {generatedAt && (
            <p className="text-xs text-muted-foreground">
              Generated {generatedAt}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function AnalysisList({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "positive" | "negative" | "neutral";
}) {
  const dotClass =
    tone === "positive"
      ? "bg-green-500"
      : tone === "negative"
        ? "bg-destructive"
        : "bg-muted-foreground";

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">None.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span
                className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`}
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
