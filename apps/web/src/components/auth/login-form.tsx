"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginUser } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser({
        username: username.trim(),
        password
      });

      window.location.href = data.user?.mustChangePassword
        ? "/change-password"
        : "/dashboard";
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[32px] border border-[#e2efe8] bg-white px-8 py-10 shadow-[0_30px_80px_rgba(34,56,111,0.12)] sm:px-12 sm:py-14">
      <div className="mx-auto w-full max-w-[500px]">
        <h2 className="text-4xl font-bold tracking-tight text-[#22386f] sm:text-5xl">
          Sign In
        </h2>

        <p className="mt-4 text-base leading-7 text-[#66758f] sm:text-lg">
          Please enter your credentials to access the system.
        </p>

        <div className="mt-12 space-y-8">
          <div className="space-y-3">
            <label htmlFor="username" className="block text-lg font-semibold text-[#24345b]">
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="h-16 w-full rounded-2xl border border-[#d7dfed] bg-[#f6f8fc] px-5 text-lg text-[#22386f] outline-none transition focus:border-[#5d88b1] focus:bg-white focus:ring-4 focus:ring-[#5d88b1]/15"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="password" className="block text-lg font-semibold text-[#24345b]">
              Password
            </label>

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-16 w-full rounded-2xl border border-[#d7dfed] bg-[#f6f8fc] px-5 text-lg text-[#22386f] outline-none transition focus:border-[#5d88b1] focus:bg-white focus:ring-4 focus:ring-[#5d88b1]/15"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="show-password"
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-5 w-5 rounded border-[#b8c5da] text-[#4d7f6b] focus:ring-[#4d7f6b]"
            />

            <label htmlFor="show-password" className="text-lg text-[#4f5e7c]">
              Show password
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading}
            className="h-16 w-full rounded-2xl bg-gradient-to-r from-[#5d88b1] to-[#355f8f] text-xl font-semibold text-white shadow-[0_14px_30px_rgba(53,95,143,0.25)] transition hover:from-[#537ba1] hover:to-[#2f557f] focus:outline-none focus:ring-4 focus:ring-[#5d88b1]/25 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <div className="flex flex-col gap-3 pt-2 text-base sm:flex-row sm:items-center sm:justify-between sm:text-lg">
            <Link href="/request-access" className="font-medium text-[#5578c4] transition hover:text-[#3558a3]">
              Request access
            </Link>

            <span className="text-[#7c889f]">Authorized personnel only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
