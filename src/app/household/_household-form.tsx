"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createHousehold,
  joinHousehold,
  type HouseholdState,
} from "./actions";
import { cn } from "@/lib/utils";

const initial: HouseholdState = {};

function SlotPicker({ disabled }: { disabled?: boolean }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Your role</legend>
      <div className="flex gap-3">
        {(["a", "b"] as const).map((slot) => (
          <label
            key={slot}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center rounded-md border border-input py-2 text-sm font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <input
              type="radio"
              name="slot"
              value={slot}
              className="sr-only"
              required
              disabled={disabled}
            />
            Partner {slot.toUpperCase()}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CreateForm() {
  const [state, action, isPending] = useActionState(createHousehold, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hh-name">Household name</Label>
        <Input
          id="hh-name"
          name="name"
          placeholder="e.g. Alice & Bob"
          required
          disabled={isPending}
        />
      </div>
      <SlotPicker disabled={isPending} />
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating…" : "Create household"}
      </Button>
    </form>
  );
}

function JoinForm() {
  const [state, action, isPending] = useActionState(joinHousehold, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-code">Invite code</Label>
        <Input
          id="invite-code"
          name="invite_code"
          placeholder="8-character code"
          required
          disabled={isPending}
          className="uppercase tracking-widest"
        />
      </div>
      <SlotPicker disabled={isPending} />
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Joining…" : "Join household"}
      </Button>
    </form>
  );
}

export function HouseholdSetup() {
  const [tab, setTab] = useState<"create" | "join">("create");

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Set up your household</CardTitle>
        <CardDescription>
          Create a new household or join an existing one with an invite code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab toggle */}
        <div className="flex rounded-lg border p-1 gap-1">
          {(["create", "join"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "create" ? "Create" : "Join"}
            </button>
          ))}
        </div>

        {tab === "create" ? <CreateForm /> : <JoinForm />}
      </CardContent>
    </Card>
  );
}
