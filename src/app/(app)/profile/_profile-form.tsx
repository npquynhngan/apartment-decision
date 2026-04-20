"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type ProfileState } from "./actions";

type Profile = {
  display_name: string | null;
  home_address: string | null;
  work_address: string | null;
  home_coords: { lat: number; lng: number } | null;
  work_coords: { lat: number; lng: number } | null;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState<
    ProfileState,
    FormData
  >(updateProfile, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          name="display_name"
          defaultValue={profile.display_name ?? ""}
          placeholder="e.g. Ngân"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="home-address">Home address</Label>
        <Input
          id="home-address"
          name="home_address"
          defaultValue={profile.home_address ?? ""}
          placeholder="Where you currently live (used for commute distance)"
        />
        {profile.home_coords && (
          <p className="text-xs text-muted-foreground">
            Geocoded: {profile.home_coords.lat.toFixed(4)},{" "}
            {profile.home_coords.lng.toFixed(4)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="work-address">Work address</Label>
        <Input
          id="work-address"
          name="work_address"
          defaultValue={profile.work_address ?? ""}
          placeholder="Where you go most days"
        />
        {profile.work_coords && (
          <p className="text-xs text-muted-foreground">
            Geocoded: {profile.work_coords.lat.toFixed(4)},{" "}
            {profile.work_coords.lng.toFixed(4)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {!state.error && state.message && (
          <p className="text-sm text-muted-foreground">{state.message}</p>
        )}
      </div>
    </form>
  );
}
