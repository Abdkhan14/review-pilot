"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tokens } from "@/app/tokens";
import { useLogin } from "@/hooks/useLogin";

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
          Wrong password. Try again.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`border ${tokens.border} px-4 py-2 text-sm font-medium disabled:opacity-50`}
      >
        {loading ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
