"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addReminder, type ReminderState } from "./actions";

export function AddReminderForm({
  apartments,
  defaultApartmentId,
}: {
  apartments: { id: string; name: string }[];
  defaultApartmentId?: string;
}) {
  const [state, formAction, pending] = useActionState<
    ReminderState,
    FormData
  >(addReminder, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border p-4 space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="reminder-text">Reminder</Label>
          <Input
            id="reminder-text"
            name="text"
            required
            maxLength={200}
            placeholder="Ask about pet policy"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reminder-due">Due</Label>
          <Input
            id="reminder-due"
            type="datetime-local"
            name="due_at"
            required
          />
        </div>
      </div>
      {apartments.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="reminder-apartment">Apartment (optional)</Label>
          <select
            id="reminder-apartment"
            name="apartment_id"
            defaultValue={defaultApartmentId ?? "none"}
            className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
          >
            <option value="none">— None —</option>
            {apartments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Adding…" : "Add reminder"}
        </Button>
        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>
    </form>
  );
}
