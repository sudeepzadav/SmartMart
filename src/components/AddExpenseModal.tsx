"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

export type NewExpense = {
  title: string;
  category: string;
  amount: string;
  date: string; // YYYY-MM-DD
  note: string;
};

type Props = {
  categories: string[]; // categories used before, offered as suggestions
  // Return an error message to show in the form, or nothing when the save worked.
  onSave: (data: NewExpense) => Promise<string | void>;
  onClose: () => void;
};

const fieldClass =
  "w-full rounded-md border border-[#d49b9a] bg-white px-3 py-2 text-[#7d0e41] placeholder:text-[#aa5e78]/70 focus:border-[#7d0e41] focus:outline-2 focus:outline-offset-1 focus:outline-[#aa5e78]";

// Today's date in the user's own time zone, as YYYY-MM-DD.
function today() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function AddExpenseModal({ categories, onSave, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!title.trim()) return setError("Title is required.");
    if (!(parseFloat(amount) > 0)) return setError("Enter an amount greater than 0.");
    if (!date) return setError("Choose a date.");

    setError("");
    setSaving(true);
    const message = await onSave({
      title: title.trim(),
      category: category.trim(),
      amount,
      date,
      note: note.trim(),
    });
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-expense-title"
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
        <h2 id="add-expense-title" className="text-xl font-bold">
          Add expense
        </h2>

        <div>
          <label htmlFor="exp-title" className="mb-1 block text-sm font-medium">
            What was it for?
          </label>
          <input
            id="exp-title"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Electricity bill"
            className={fieldClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="exp-amount" className="mb-1 block text-sm font-medium">
              Amount (Rs)
            </label>
            <input
              id="exp-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="exp-date" className="mb-1 block text-sm font-medium">
              Date
            </label>
            <input
              id="exp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="exp-category" className="mb-1 block text-sm font-medium">
            Category (optional)
          </label>
          <input
            id="exp-category"
            list="exp-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Utilities"
            className={fieldClass}
          />
          <datalist id="exp-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="exp-note" className="mb-1 block text-sm font-medium">
            Note (optional)
          </label>
          <input
            id="exp-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={fieldClass}
          />
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
            {saving ? "Saving..." : "Save expense"}
          </button>
        </div>
      </form>
    </div>
  );
}