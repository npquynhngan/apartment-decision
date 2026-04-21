import type { Metadata } from "next";
import { SignInForm } from "./_sign-in-form";

export const metadata: Metadata = { title: "Sign in — Apartment Decision" };

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(160deg, #2D2935 0%, #3B3857 55%, #354864 100%)",
      }}
    >
      {/* Subtle paper noise on dark bg */}
      <svg
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.04,
          pointerEvents: "none",
        }}
      >
        <filter id="sign-in-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#sign-in-noise)" />
      </svg>

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Card */}
        <div
          className="rounded-[1.25rem] p-8 space-y-6 shadow-warm-lg"
          style={{ background: "rgba(42, 39, 56, 0.95)", border: "1px solid rgba(200,180,255,0.1)" }}
        >
          <div className="text-center space-y-1">
            <h1 className="font-heading font-bold text-2xl text-parchment tracking-tight">
              Apartment Decision
            </h1>
            <p className="text-sm" style={{ color: "rgba(200,180,220,0.65)" }}>
              Sign in with a magic link or your password.
            </p>
          </div>
          <SignInForm errorParam={error} />
        </div>
      </div>
    </main>
  );
}
