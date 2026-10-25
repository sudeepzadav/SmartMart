"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return setError("Enter your email and password.");
    router.push("/dashboard");
  }

  const field =
    "mt-1 w-full rounded-md border border-[#d49b9a] bg-white px-3 py-2 text-sm text-[#7d0e41] placeholder:text-[#aa5e78]/60 focus:border-[#7d0e41] focus:outline-2 focus:outline-offset-1 focus:outline-[#aa5e78]";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#fcf6f2] p-4">
      <Link href="/" className="mb-6 text-lg font-bold text-[#7d0e41]">
        Smart Mart
      </Link>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-[#d49b9a] border-t-4 border-t-[#7d0e41] bg-white p-6 shadow-lg"
      >
        <div>
          <h1 className="text-xl font-bold text-[#7d0e41]">Sign in to Smart Mart</h1>
          <p className="mt-1 text-sm text-[#6b4455]">Welcome back. Enter your details to continue.</p>
        </div>

        <label className="block text-sm font-medium text-[#7d0e41]">
          Email
          <input
            className={field}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-[#7d0e41]">
          Password
          <input
            className={field}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p className="rounded-md bg-[#f4d9cd] px-3 py-2 text-sm font-medium text-[#7d0e41]">{error}</p>
        )}

        <button className="w-full rounded-md bg-[#7d0e41] py-2.5 text-sm font-semibold text-white hover:bg-[#5e0a31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]">
          Sign in
        </button>
      </form>
    </main>
  );
}