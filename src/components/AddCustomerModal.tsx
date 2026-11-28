"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

export type NewCustomer = { name: string; phone: string; creditBalance: string };

type Props = {
  // Return an error message to show in the form, or nothing when the save worked.
  onSave: (data: NewCustomer) => Promise<string | void>;
  onClose: () => void;
};

const fieldClass =
  "w-full rounded-md border border-[#d49b9a] bg-white px-3 py-2 text-[#7d0e41] placeholder:text-[#aa5e78]/70 focus:border-[#7d0e41] focus:outline-2 focus:outline-offset-1 focus:outline-[#aa5e78]";

export default function AddCustomerModal({ onSave, onClose }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [credit, setCredit] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) return setError("Customer name is required.");
    if (phone.trim() && !/^[0-9+\-() ]{5,20}$/.test(phone.trim()))
      return setError("Enter a valid phone number (digits, spaces, + and - only).");
    if (credit !== "" && !(parseFloat(credit) >= 0))
      return setError("Opening credit must be 0 or more.");

    setError("");
    setSaving(true);
    const message = await onSave({
      name: name.trim(),
      phone: phone.trim(),
      creditBalance: credit,
    });
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-customer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        noValidate
        className="w-full max-w-sm space-y-4 rounded-xl bg-[#fcf6f2] p-6 text-[#7d0e41] shadow-lg"
      >
        <h2 id="add-customer-title" className="text-xl font-bold">
          Add customer
        </h2>

        <div>
          <label htmlFor="cus-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="cus-name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ram Shrestha"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="cus-phone" className="mb-1 block text-sm font-medium">
            Phone (optional)
          </label>
          <input
            id="cus-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98XXXXXXXX"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="cus-credit" className="mb-1 block text-sm font-medium">
            Credit owed now, udhar (Rs)
          </label>
          <input
            id="cus-credit"
            type="number"
            min="0"
            step="0.01"
            value={credit}
            onChange={(e) => setCredit(e.target.value)}
            placeholder="0"
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-[#6b4455]">
            Leave empty if the customer owes nothing yet.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#aa5e78] bg-white px-4 py-2 font-medium hover:border-[#7d0e41] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#7d0e41] px-4 py-2 font-semibold text-white hover:bg-[#aa5e78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save customer"}
          </button>
        </div>
      </form>
    </div>
  );
}