"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@/app/tokens";
import { useLogin } from "@/hooks/useLogin";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function LoginForm() {
  const router = useRouter();
  const { login, loading, error } = useLogin();
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await login(password);
    if (ok) router.push("/admin");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
      <label htmlFor="password" className="text-sm font-medium">
        Password
      </label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className={`rounded-md border ${tokens.border} bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-400`}
      />

      {error && (
        <Alert variant="destructive">Wrong password. Try again.</Alert>
      )}

      <Button type="submit" variant="outline" disabled={loading} className="w-full">
        {loading ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
