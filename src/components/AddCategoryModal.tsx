"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

type Props = {
  // Return an error message to show in the form, or nothing when the save worked.
  onSave: (name: string) => Promise<string | void>;
  onClose: () => void;
};

export default function AddCategoryModal({ onSave, onClose }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const value = name.trim();
    if (!value) {
      setError("Category name is required.");
      return;
    }
    setError("");
    setSaving(true);
    const message = await onSave(value);
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-category-title"
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
        <h2 id="add-category-title" className="text-xl font-bold">
          Add category
        </h2>

        <div>
          <label htmlFor="category-name" className="mb-1 block text-sm font-medium">
            Category name
          </label>
          <input
            id="category-name"
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Grocery"
            aria-invalid={!!error}
            aria-describedby={error ? "category-error" : undefined}
            className="w-full rounded-md border border-[#d49b9a] bg-white px-3 py-2 text-[#7d0e41] placeholder:text-[#aa5e78]/70 focus:border-[#7d0e41] focus:outline-2 focus:outline-offset-1 focus:outline-[#aa5e78]"
          />
          {error && (
            <p id="category-error" role="alert" className="mt-1 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

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
            {saving ? "Saving..." : "Save category"}
          </button>
        </div>
      </form>
    </div>
  );
}