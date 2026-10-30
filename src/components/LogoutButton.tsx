
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setLoading(false);
      alert("Could not sign out. Please try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
