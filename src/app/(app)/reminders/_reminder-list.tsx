"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { toggleReminder, deleteReminder } from "./actions";

type ReminderItem = {
  id: string;
  text: string;
  due_at: string;
  done: boolean;
  apartment_id: string | null;
  apartment_name: string | null;
};

function formatDue(iso: string) {
  return new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function relativeDue(iso: string, now: number) {
  const target = new Date(iso).getTime();
  const diffMin = Math.round((target - now) / 60_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  const diffDay = Math.round(diffHr / 24);
  return rtf.format(diffDay, "day");
}

export function ReminderList({
  reminders,
  showApartment = true,
  emptyHint,
}: {
  reminders: ReminderItem[];
  showApartment?: boolean;
  emptyHint?: string;
}) {
  if (reminders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
        {emptyHint ?? "Nothing here."}
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {reminders.map((r) => (
        <Row key={r.id} reminder={r} showApartment={showApartment} />
      ))}
    </ul>
  );
}

function Row({
  reminder,
  showApartment,
}: {
  reminder: ReminderItem;
  showApartment: boolean;
}) {
  const [done, setDone] = useState(reminder.done);
  const [, startTransition] = useTransition();
  const now = Date.now();
  const overdue = !done && new Date(reminder.due_at).getTime() < now;

  function handleToggle(next: boolean) {
    setDone(next);
    startTransition(async () => {
      await toggleReminder(reminder.id, next);
    });
  }

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        done && "opacity-60"
      )}
    >
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => handleToggle(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0"
        aria-label="Mark reminder done"
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm",
            done && "line-through text-muted-foreground"
          )}
        >
          {reminder.text}
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "tabular-nums",
              overdue && "text-destructive font-medium"
            )}
          >
            {formatDue(reminder.due_at)} ({relativeDue(reminder.due_at, now)})
          </span>
          {showApartment && reminder.apartment_name && reminder.apartment_id && (
            <>
              <span>·</span>
              <Link
                href={`/apartments/${reminder.apartment_id}`}
                className="underline underline-offset-2 hover:text-foreground"
              >
                {reminder.apartment_name}
              </Link>
            </>
          )}
        </div>
      </div>
      <form action={deleteReminder}>
        <input type="hidden" name="id" value={reminder.id} />
        {reminder.apartment_id && (
          <input
            type="hidden"
            name="apartment_id"
            value={reminder.apartment_id}
          />
        )}
        <button
          type="submit"
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Delete reminder"
        >
          Delete
        </button>
      </form>
    </li>
  );
}
