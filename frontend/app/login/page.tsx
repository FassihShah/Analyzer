"use client";

import type { FormEvent } from "react";
import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE, DEMO_MODE, setToken } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) throw new Error("We couldn't sign you in. Check your details and try again.");
      const data = await response.json();
      setToken(data.access_token);
      router.push(searchParams.get("next") || "/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in is currently unavailable.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,.9fr)]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#123344] p-12 text-white lg:flex xl:p-16">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-xl font-bold text-[#123344]">D</span><span className="text-lg font-bold tracking-tight">DYOS Hiring</span></div>
        <div className="max-w-xl"><p className="text-sm font-semibold text-[#9ed3db]">A better way to review talent</p><h1 className="mt-5 text-5xl font-bold leading-[1.1] tracking-[-.045em] xl:text-6xl">Make every hiring decision count.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-[#c6d9df]">Bring job profiles, candidate evidence, team review, and communication into one focused workspace.</p><div className="mt-10 space-y-4 text-sm text-[#d7e7ea]"><p className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#9ed3db]" /> Compare candidates against role-specific criteria</p><p className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#9ed3db]" /> Keep a human in control of every outcome</p></div></div>
        <p className="text-xs text-[#b6d2d9]">DYOS Hiring · Recruiter workspace</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <Card className="w-full max-w-md border-0 p-0 shadow-none">
          <div className="mb-12 flex items-center gap-3 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#123344] font-bold text-white">D</span><span className="font-bold">DYOS Hiring</span></div>
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e9f3f6] text-moss"><ShieldCheck size={23} /></span>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink">{DEMO_MODE ? "Explore DYOS Hiring" : "Welcome back"}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{DEMO_MODE ? "See how the recruitment workspace fits together." : "Sign in to continue to your recruitment workspace."}</p>
          {DEMO_MODE ? <div className="mt-7"><p className="rounded-md border border-[#c9dce3] bg-[#eaf4f7] p-4 text-sm leading-6 text-[#24566a]">This portfolio demo uses synthetic candidates. Your changes stay in this browser; no real emails or AI analysis are performed.</p><Button className="mt-5 w-full" onClick={() => router.push("/")}>Explore demo workspace</Button></div> : <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">
              Email
              <Input className="mt-2" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              Password
              <Input className="mt-2" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error && <p role="alert" className="rounded-lg border border-[#f1b2a4] bg-[#fff0ed] px-4 py-3 text-sm text-[#9c3726]">{error}</p>}
            <Button className="mt-2 w-full" type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? "Signing in…" : "Sign in"}</Button>
          </form>}
          <p className="mt-8 border-t border-line pt-6 text-xs leading-5 text-[var(--muted)]">{DEMO_MODE ? "All names and applications shown are fictional examples." : "Access is restricted to authorized recruiting team members."}</p>
        </Card>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-paper text-sm text-[#63736f]">Loading sign in...</main>}>
      <LoginForm />
    </Suspense>
  );
}
