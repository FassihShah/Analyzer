"use client";

import type { FormEvent } from "react";
import { Suspense } from "react";
import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE, setToken } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      setError("Could not sign in with those credentials.");
      return;
    }
    const data = await response.json();
    setToken(data.access_token);
    router.push(searchParams.get("next") || "/");
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-paper lg:grid-cols-[1fr_520px]">
      <section className="hidden min-h-screen lg:block">
        <Image
          src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80"
          alt="Review desk"
          width={1400}
          height={1200}
          className="h-full w-full object-cover"
        />
      </section>
      <section className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <p className="text-sm font-semibold text-coral">Internal recruiter access</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-[#65706a]">Review candidates with structured multi-pass AI evaluation.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">
              Email
              <Input className="mt-1" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              Password
              <Input className="mt-1" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {error && <p className="text-sm text-coral">{error}</p>}
            <Button className="w-full" type="submit">Continue</Button>
          </form>
        </Card>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-paper text-sm text-[#65706a]">Loading sign in...</main>}>
      <LoginForm />
    </Suspense>
  );
}
