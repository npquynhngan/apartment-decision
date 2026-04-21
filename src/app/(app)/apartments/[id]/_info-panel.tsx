"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Apartment } from "@/types/database";
import { ApartmentForm } from "../_form";
import { deleteApartment } from "../actions";

function formatRent(v: number | null) {
  if (v == null) return null;
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(v);
}

export function InfoPanel({ apartment }: { apartment: Apartment }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-2xl bg-oatmeal shadow-warm p-4 space-y-4">
        <h2 className="text-sm font-medium text-dusk-indigo">Edit apartment</h2>
        <ApartmentForm
          mode="edit"
          apartment={apartment}
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-oatmeal shadow-warm p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-heading font-bold text-ink-plum truncate">
            {apartment.name}
          </h1>
          {apartment.address && (
            <p className="text-sm text-muted-foreground">{apartment.address}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <form
            action={deleteApartment}
            onSubmit={(e) => {
              if (!confirm(`Delete "${apartment.name}"? This cannot be undone.`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={apartment.id} />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
            >
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {apartment.rent != null && (
          <span>
            <span className="text-muted-foreground">Rent </span>
            <span className="font-medium">{formatRent(apartment.rent)}/mo</span>
          </span>
        )}
        {apartment.sqft != null && (
          <span>
            <span className="text-muted-foreground">Size </span>
            <span className="font-medium">{apartment.sqft} sqft</span>
          </span>
        )}
        {apartment.viewing_at && (
          <span>
            <span className="text-muted-foreground">Viewing </span>
            <span className="font-medium">
              {new Date(apartment.viewing_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </span>
        )}
        {apartment.url && (
          <Link
            href={apartment.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            Listing ↗
          </Link>
        )}
      </div>

      {apartment.notes && (
        <p
          className="text-sm whitespace-pre-wrap pt-2"
          style={{ borderTop: "1px solid rgba(155,143,181,0.18)" }}
        >
          {apartment.notes}
        </p>
      )}
    </div>
  );
}
