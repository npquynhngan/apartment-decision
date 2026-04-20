import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "./_sign-in-form";

export const metadata: Metadata = { title: "Sign in — Apartment Decision" };

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Apartment Decision</CardTitle>
          <CardDescription>
            Sign in with a magic link or your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm errorParam={error} />
        </CardContent>
      </Card>
    </main>
  );
}
