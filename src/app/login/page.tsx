
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Cashier = {
  id: number;
  name: string;
};

type LoginResponse = {
  role?: string;
  user?: {
    id?: string | number;
    name?: string;
    role?: string;
  };
  error?: string;
};

const field =
  "mt-1 w-full rounded-md border border-[#d49b9a] bg-white px-3 py-2 text-sm text-[#7d0e41] placeholder:text-[#aa5e78]/60 focus:border-[#7d0e41] focus:outline-2 focus:outline-offset-1 focus:outline-[#aa5e78]";

export default function LoginPage() {
  const router = useRouter();

  const [tab, setTab] = useState<"owner" | "cashier">("cashier");
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCashiers() {
      try {
        const res = await fetch("/api/auth/cashiers");

        if (!res.ok) {
          throw new Error("Could not load cashiers.");
        }

        const data: Cashier[] = await res.json();

        if (active) {
          setCashiers(Array.isArray(data) ? data : []);
        }
      } catch {
        if (active) {
          setCashiers([]);
        }
      }
    }

    loadCashiers();

    return () => {
      active = false;
    };
  }, []);

  function switchTab(nextTab: "owner" | "cashier") {
    setTab(nextTab);
    setError("");
  }

  async function onSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError("");

    if (tab === "owner" && (!email.trim() || !password)) {
      setError("Please enter your email and password.");
      return;
    }

    if (tab === "cashier" && (userId === null || !pin)) {
      setError("Please select a cashier and enter your PIN.");
      return;
    }

    const payload =
      tab === "owner"
        ? {
            mode: "owner",
            email: email.trim(),
            password,
          }
        : {
            mode: "cashier",
            userId,
            pin,
          };

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: LoginResponse = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not sign in.");
        setPin("");
        return;
      }

      
      const role = (data.role ?? data.user?.role)
        ?.trim()
        .toUpperCase();

      
      if (role === "ADMIN") {
        router.replace("/");
        router.refresh();
        return;
      }

      if (role === "CASHIER") {
        router.replace("/pos");
        router.refresh();
        return;
      }

      setError(
        `Invalid user role (${role ?? "missing"}). Please contact the administrator.`
      );
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
      active
        ? "bg-[#7d0e41] text-white"
        : "text-[#7d0e41] hover:bg-[#f4d9cd]"
    }`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#fcf6f2] p-4">
      <Link
        href="/"
        className="mb-6 text-lg font-bold text-[#7d0e41] transition-opacity hover:opacity-80"
      >
        Smart Mart
      </Link>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-[#d49b9a] border-t-4 border-t-[#7d0e41] bg-white p-6 shadow-lg"
      >
        <div>
          <h1 className="text-xl font-bold text-[#7d0e41]">
            Sign in
          </h1>

          <p className="mt-1 text-sm text-[#6b4455]">
            Choose how you want to sign in.
          </p>
        </div>

       
        <div className="flex gap-2 rounded-lg bg-[#fcf6f2] p-1">
          <button
            type="button"
            onClick={() => switchTab("cashier")}
            className={tabClass(tab === "cashier")}
            aria-pressed={tab === "cashier"}
          >
            Cashier
          </button>

          <button
            type="button"
            onClick={() => switchTab("owner")}
            className={tabClass(tab === "owner")}
            aria-pressed={tab === "owner"}
          >
            Owner
          </button>
        </div>

        {tab === "owner" ? (
          <>
            <label className="block text-sm font-medium text-[#7d0e41]">
              Email

              <input
                className={field}
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block text-sm font-medium text-[#7d0e41]">
              Password

              <input
                className={field}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          </>
        ) : (
          <>
            <div>
              <div className="text-sm font-medium text-[#7d0e41]">
                Who is at the counter?
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {cashiers.length === 0 ? (
                  <p className="text-sm text-[#6b4455]">
                    No cashiers available. Ask the owner to add one.
                  </p>
                ) : (
                  cashiers.map((cashier) => (
                    <button
                      key={cashier.id}
                      type="button"
                      onClick={() => {
                        setUserId(cashier.id);
                        setError("");
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        userId === cashier.id
                          ? "border-[#7d0e41] bg-[#7d0e41] text-white"
                          : "border-[#d49b9a] bg-white text-[#7d0e41] hover:bg-[#f4d9cd]"
                      }`}
                      aria-pressed={userId === cashier.id}
                    >
                      {cashier.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <label className="block text-sm font-medium text-[#7d0e41]">
              PIN

              <input
                className={`${field} tracking-[0.5em]`}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="off"
                placeholder="••••"
                value={pin}
                onChange={(e) =>
                  setPin(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                required
              />
            </label>
          </>
        )}

        
        {error && (
          <p
            role="alert"
            className="rounded-md bg-[#f4d9cd] px-3 py-2 text-sm font-medium text-[#7d0e41]"
          >
            {error}
          </p>
        )}

        
        <button
          type="submit"
          disabled={
            loading ||
            (tab === "cashier" && cashiers.length === 0)
          }
          className="w-full rounded-md bg-[#7d0e41] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5e0a31] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-center text-xs text-[#6b4455]">
          Smart Mart · Secure sign in
        </p>
      </form>
    </main>
  );
}
