"use client";

import { useActionState, useState } from "react";
import { addCriterion, type CriterionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  "Cost",
  "Location",
  "Size",
  "Amenities",
  "Transport",
  "Safety",
  "Lifestyle",
  "Other",
];

export function AddCriterionForm() {
  const [state, action, isPending] = useActionState<CriterionState, FormData>(
    addCriterion,
    {}
  );
  const [weightA, setWeightA] = useState(5);
  const [weightB, setWeightB] = useState(5);

  return (
    <form action={action} className="rounded-lg border p-4 space-y-4">
      <h2 className="font-medium text-sm">Add criterion</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="add-category">Category</Label>
          <Input
            id="add-category"
            name="category"
            list="category-options"
            placeholder="e.g. Location"
            required
          />
          <datalist id="category-options">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-name">Criterion name</Label>
          <Input
            id="add-name"
            name="name"
            placeholder="e.g. Walking distance to metro"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <Label>Partner A weight</Label>
            <span className="font-semibold tabular-nums">{weightA}</span>
          </div>
          <input
            type="range"
            name="weight_a"
            min={0}
            max={10}
            value={weightA}
            onChange={(e) => setWeightA(Number(e.target.value))}
            className="w-full accent-foreground"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 — doesn&apos;t matter</span>
            <span>10 — essential</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <Label>Partner B weight</Label>
            <span className="font-semibold tabular-nums">{weightB}</span>
          </div>
          <input
            type="range"
            name="weight_b"
            min={0}
            max={10}
            value={weightB}
            onChange={(e) => setWeightB(Number(e.target.value))}
            className="w-full accent-foreground"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 — doesn&apos;t matter</span>
            <span>10 — essential</span>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input
          type="checkbox"
          name="is_dealbreaker"
          className="h-4 w-4 rounded border-gray-300"
        />
        Dealbreaker — apartments scoring ≤ 1 on this are eliminated
      </label>

      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Adding…" : "Add criterion"}
      </Button>
    </form>
  );
}
