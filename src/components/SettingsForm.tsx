"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { StoreSettings } from "@/lib/settings-types";

const field =
  "mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-black";

export default function SettingsForm({ initial }: { initial: StoreSettings }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [address, setAddress] = useState(initial.address);
  const [phone, setPhone] = useState(initial.phone);
  const [panVat, setPanVat] = useState(initial.panVat);
  const [vatRate, setVatRate] = useState(String(initial.vatRate));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setMessage(null);

    if (!name.trim()) return setMessage({ ok: false, text: "Store name is required." });
    const rate = parseFloat(vatRate);
    if (vatRate === "" || !(rate >= 0 && rate <= 100))
      return setMessage({ ok: false, text: "VAT rate must be between 0 and 100." });

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, phone, panVat, vatRate: rate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not save the settings." });
      } else {
        setMessage({ ok: true, text: "Saved. New bills will use these details." });
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-md space-y-4">
      <label className="block text-sm font-medium">
        Store name
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block text-sm font-medium">
        Address
        <input
          className={field}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, city"
        />
      </label>
      <label className="block text-sm font-medium">
        Phone
        <input
          className={field}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01-0000000"
        />
      </label>
      <label className="block text-sm font-medium">
        PAN / VAT number
        <input className={field} value={panVat} onChange={(e) => setPanVat(e.target.value)} />
      </label>
      <label className="block text-sm font-medium">
        VAT rate (%)
        <input
          className={field}
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={vatRate}
          onChange={(e) => setVatRate(e.target.value)}
        />
        <span className="mt-1 block text-xs font-normal text-stone-600">
          Added on top of your selling prices at the counter. Enter 0 if your prices already
          include VAT or you do not charge it.
        </span>
      </label>

      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm font-medium ${message.ok ? "text-emerald-800" : "text-red-700"}`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}