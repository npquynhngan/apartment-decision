"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  signInWithMagicLink,
  signInWithPassword,
  type SignInState,
} from "./actions";

const initialState: SignInState = {};

type Mode = "magic" | "password";

export function SignInForm({ errorParam }: { errorParam?: string }) {
  const [mode, setMode] = useState<Mode>("magic");
  const [magicState, magicAction, magicPending] = useActionState(
    signInWithMagicLink,
    initialState
  );
  const [pwState, pwAction, pwPending] = useActionState(
    signInWithPassword,
    initialState
  );

  if (magicState.success) {
    return (
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a magic link to your email. Click it to sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-md border p-1 text-sm">
        <TabButton active={mode === "magic"} onClick={() => setMode("magic")}>
          Magic link
        </TabButton>
        <TabButton
          active={mode === "password"}
          onClick={() => setMode("password")}
        >
          Password
        </TabButton>
      </div>

      {mode === "magic" ? (
        <form action={magicAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-magic">Email</Label>
            <Input
              id="email-magic"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={magicPending}
            />
          </div>

          {(magicState.error ?? errorParam) && (
            <p className="text-sm text-destructive">
              {magicState.error ?? errorParam}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={magicPending}>
            {magicPending ? "Sending…" : "Send magic link"}
          </Button>
        </form>
      ) : (
        <form action={pwAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-pw">Email</Label>
            <Input
              id="email-pw"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={pwPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pwPending}
            />
          </div>

          {(pwState.error ?? errorParam) && (
            <p className="text-sm text-destructive">
              {pwState.error ?? errorParam}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pwPending}>
            {pwPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
