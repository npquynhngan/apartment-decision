"use client";

import { useState, useTransition } from "react";
import { updateCriterion, deleteCriterion } from "./actions";
import { Button } from "@/components/ui/button";
import {
  AUTO_SOURCES,
  autoSourceLabel,
  type AutoSource,
} from "@/lib/commute";
import type { Criterion } from "@/types/database";

function isAutoSource(v: string | null): v is AutoSource {
  return v != null && (AUTO_SOURCES as readonly string[]).includes(v);
}

function CriterionRow({ criterion }: { criterion: Criterion }) {
  const [weightA, setWeightA] = useState(criterion.weight_a);
  const [weightB, setWeightB] = useState(criterion.weight_b);
  const [isDealbreaker, setIsDealbreaker] = useState(criterion.is_dealbreaker);
  const [autoSource, setAutoSource] = useState<string>(
    criterion.auto_source ?? "manual"
  );
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const autoBadge = isAutoSource(criterion.auto_source)
    ? autoSourceLabel(criterion.auto_source)
    : null;

  function markDirty() {
    setDirty(true);
    setError(null);
  }

  function handleSave() {
    const fd = new FormData();
    fd.set("id", criterion.id);
    fd.set("name", criterion.name);
    fd.set("category", criterion.category);
    fd.set("weight_a", String(weightA));
    fd.set("weight_b", String(weightB));
    if (isDealbreaker) fd.set("is_dealbreaker", "on");
    fd.set("auto_source", autoSource);

    startTransition(async () => {
      const result = await updateCriterion(fd);
      if (result?.error) setError(result.error);
      else setDirty(false);
    });
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5">
            {criterion.category}
          </span>
          <span className="font-medium text-sm">{criterion.name}</span>
          {isDealbreaker && (
            <span className="text-xs font-medium text-destructive bg-destructive/10 rounded px-1.5 py-0.5">
              Dealbreaker
            </span>
          )}
          {autoBadge && (
            <span className="text-xs font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              Auto · {autoBadge}
            </span>
          )}
        </div>
        <form action={deleteCriterion} className="shrink-0">
          <input type="hidden" name="id" value={criterion.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            title="Delete criterion"
          >
            ×
          </Button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Partner A weight</span>
            <span className="font-semibold tabular-nums">{weightA}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={weightA}
            onChange={(e) => {
              setWeightA(Number(e.target.value));
              markDirty();
            }}
            className="w-full accent-foreground"
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Partner B weight</span>
            <span className="font-semibold tabular-nums">{weightB}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            value={weightB}
            onChange={(e) => {
              setWeightB(Number(e.target.value));
              markDirty();
            }}
            className="w-full accent-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={isDealbreaker}
            onChange={(e) => {
              setIsDealbreaker(e.target.checked);
              markDirty();
            }}
            className="h-3.5 w-3.5 rounded"
          />
          Dealbreaker
        </label>

        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Auto-score</span>
          <select
            value={autoSource}
            onChange={(e) => {
              setAutoSource(e.target.value);
              markDirty();
            }}
            className="h-7 rounded-md border bg-transparent px-2 text-xs"
          >
            <option value="manual">Manual</option>
            <option value="commute_home">Distance to home</option>
            <option value="commute_work">Distance to work</option>
          </select>
        </label>

        {dirty && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isPending}
            className="h-7 text-xs"
          >
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        )}

        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </div>
  );
}

export function CriteriaList({
  criteria,
}: {
  criteria: Criterion[];
  userSlot: "a" | "b" | null;
}) {
  if (criteria.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No criteria yet — add your first one above.
      </p>
    );
  }

  const groups = criteria.reduce<Record<string, Criterion[]>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {category}
          </h3>
          <div className="space-y-2">
            {items.map((c) => (
              <CriterionRow key={c.id} criterion={c} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
