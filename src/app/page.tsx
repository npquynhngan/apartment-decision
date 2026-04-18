export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-2xl space-y-6 text-center sm:text-left">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          apartment-decision
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Decide on an apartment together.
        </h1>
        <p className="text-lg text-muted-foreground">
          A collaborative workspace for two people comparing apartments:
          weighted criteria, dealbreakers, commute times, photos, and an
          LLM-assisted tradeoff analysis. Sign in with a magic link to get
          started.
        </p>
        <p className="text-sm text-muted-foreground">
          Step 1 of setup is complete. Auth and data model land next.
        </p>
      </div>
    </main>
  );
}
