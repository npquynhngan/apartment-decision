"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithMagicLink, type SignInState } from "./actions";

const initialState: SignInState = {};

export function SignInForm({ errorParam }: { errorParam?: string }) {
  const [state, action, isPending] = useActionState(
    signInWithMagicLink,
    initialState
  );

  if (state.success) {
    return (
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a magic link to your email. Click it to sign in.
        </p>
      </div>
    );
  }

  const displayError = state.error ?? errorParam;

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={isPending}
        />
      </div>

      {displayError && (
        <p className="text-sm text-destructive">{displayError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending…" : "Send magic link"}
      </Button>
    </form>
  );
}
