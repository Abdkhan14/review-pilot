"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@/app/tokens";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      credentials: "include",
    });

    setPending(false);

    if (res.status === 200) {
      router.push("/admin");
    } else {
      setError("Wrong password. Try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-12">
      <label htmlFor="password" className="text-sm font-medium">
        Password
      </label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className={`border ${tokens.border} bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-400`}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`border ${tokens.border} px-4 py-2 text-sm font-medium disabled:opacity-50`}
      >
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
