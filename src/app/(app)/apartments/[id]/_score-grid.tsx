"use client";

import { useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { computeApartmentScore } from "@/lib/scoring";
import type { Criterion, Score } from "@/types/database";
import { upsertScore } from "../actions";

type Key = `${string}:${"a" | "b"}`;

function keyOf(criterion_id: string, slot: "a" | "b"): Key {
  return `${criterion_id}:${slot}`;
}

function formatScore(v: number | null) {
  if (v == null) return "—";
  return `${Math.round(v * 100)}%`;
}

export function ScoreGrid({
  apartmentId,
  criteria,
  initialScores,
  userSlot,
}: {
  apartmentId: string;
  criteria: Criterion[];
  initialScores: Score[];
  userSlot: "a" | "b" | null;
}) {
  const [values, setValues] = useState<Map<Key, number>>(
    () =>
      new Map(
        initialScores.map((s) => [keyOf(s.criterion_id, s.user_slot), s.value])
      )
  );
  const [errors, setErrors] = useState<Map<Key, string>>(new Map());
  const [pendingKeys, setPendingKeys] = useState<Set<Key>>(new Set());
  const [, startTransition] = useTransition();

  const liveScore = useMemo(() => {
    const scores = Array.from(values.entries()).map(([k, value]) => {
      const [criterion_id, slot] = k.split(":") as [string, "a" | "b"];
      return { criterion_id, user_slot: slot, value };
    });
    return computeApartmentScore(criteria, scores);
  }, [values, criteria]);

  function setScore(criterion_id: string, slot: "a" | "b", value: number) {
    const k = keyOf(criterion_id, slot);
    setValues((prev) => {
      const next = new Map(prev);
      next.set(k, value);
      return next;
    });
    setErrors((prev) => {
      if (!prev.has(k)) return prev;
      const next = new Map(prev);
      next.delete(k);
      return next;
    });
    setPendingKeys((prev) => {
      const next = new Set(prev);
      next.add(k);
      return next;
    });
    startTransition(async () => {
      const result = await upsertScore({
        apartment_id: apartmentId,
        criterion_id,
        user_slot: slot,
        value,
      });
      setPendingKeys((prev) => {
        const next = new Set(prev);
        next.delete(k);
        return next;
      });
      if (result?.error) {
        setErrors((prev) => {
          const next = new Map(prev);
          next.set(k, result.error!);
          return next;
        });
      }
    });
  }

  if (criteria.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No criteria yet. Add some on the Criteria page first, then come back
          to score this apartment.
        </p>
      </div>
    );
  }

  const groups = criteria.reduce<Record<string, Criterion[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 bg-muted/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <ScoreStat
            label="Partner A"
            value={liveScore.score_a}
            highlight={userSlot === "a"}
          />
          <ScoreStat
            label="Combined"
            value={liveScore.effective_score}
            highlight
            strikethrough={liveScore.dealbreaker_failed}
          />
          <ScoreStat
            label="Partner B"
            value={liveScore.score_b}
            highlight={userSlot === "b"}
          />
        </div>
        {liveScore.dealbreaker_failed && (
          <p className="text-xs text-destructive text-center mt-2">
            Dealbreaker failed — effective score is 0.
          </p>
        )}
      </div>

      {Object.entries(groups).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {category}
          </h3>
          <div className="rounded-lg border overflow-hidden divide-y">
            {items.map((c) => {
              const keyA = keyOf(c.id, "a");
              const keyB = keyOf(c.id, "b");
              return (
                <div key={c.id} className="p-3 sm:p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{c.name}</span>
                    {c.is_dealbreaker && (
                      <span className="text-xs font-medium text-destructive bg-destructive/10 rounded px-1.5 py-0.5">
                        Dealbreaker
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      weight A {c.weight_a} · B {c.weight_b}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ScoreRow
                      label="Partner A"
                      highlight={userSlot === "a"}
                      value={values.get(keyA)}
                      pending={pendingKeys.has(keyA)}
                      error={errors.get(keyA)}
                      onChange={(v) => setScore(c.id, "a", v)}
                    />
                    <ScoreRow
                      label="Partner B"
                      highlight={userSlot === "b"}
                      value={values.get(keyB)}
                      pending={pendingKeys.has(keyB)}
                      error={errors.get(keyB)}
                      onChange={(v) => setScore(c.id, "b", v)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreStat({
  label,
  value,
  highlight,
  strikethrough,
}: {
  label: string;
  value: number | null;
  highlight?: boolean;
  strikethrough?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "text-xl font-semibold tabular-nums",
          !highlight && "text-muted-foreground",
          strikethrough && "line-through"
        )}
      >
        {formatScore(value)}
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  highlight,
  value,
  pending,
  error,
  onChange,
}: {
  label: string;
  highlight?: boolean;
  value: number | undefined;
  pending: boolean;
  error: string | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span
          className={cn(
            highlight ? "font-medium" : "text-muted-foreground"
          )}
        >
          {label}
          {highlight && " (you)"}
        </span>
        {pending && <span className="text-muted-foreground">Saving…</span>}
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "h-8 flex-1 rounded border text-sm font-medium transition-colors",
              value === n
                ? "bg-foreground text-background border-foreground"
                : "bg-background hover:bg-muted"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
