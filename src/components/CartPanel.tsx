"use client";
import type { CartLine, DiscountType, PayMethod, Totals } from "@/app/pos/types";
import { fmt, VAT_RATE } from "@/app/pos/lib";

type Props = {
  cart: CartLine[];
  totals: Totals;

  customer: string;
  onCustomerChange: (v: string) => void;
  discountType: DiscountType;
  onDiscountTypeChange: (v: DiscountType) => void;
  discountValue: string;
  onDiscountValueChange: (v: string) => void;
  method: PayMethod;
  onMethodChange: (v: PayMethod) => void;
  tendered: string;
  onTenderedChange: (v: string) => void;

  cashShort: boolean;
  change: number;

  onChangeQty: (sku: string, delta: number) => void;
  onRemove: (sku: string) => void;
  onComplete: () => void;
};

const fieldClass =
  "w-full rounded-md border border-[#d49b9a] bg-white px-2 py-1.5 text-sm text-[#7d0e41] placeholder:text-[#aa5e78]/70 focus:outline-2 focus:outline-[#f4d9cd]";

export default function CartPanel({
  cart,
  totals,
  customer,
  onCustomerChange,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  method,
  onMethodChange,
  tendered,
  onTenderedChange,
  cashShort,
  change,
  onChangeQty,
  onRemove,
  onComplete,
}: Props) {
  const showChange = method === "Cash" && tendered !== "" && !cashShort;

  return (
    <aside className="flex w-104 flex-col overflow-y-auto bg-[#7d0e41] p-6">
      <h2 className="mb-3 text-lg font-bold text-[#f4d9cd]">Current sale</h2>

      <ul className="min-h-24 flex-1 space-y-3 overflow-y-auto">
        {cart.length === 0 && (
          <li className="text-sm text-[#d49b9a]">
            Scan a barcode or tap a product to start.
          </li>
        )}
        {cart.map((l) => (
          <li key={l.sku} className="text-sm text-white">
            <div className="flex justify-between">
              <span>{l.name}</span>
              <span>{fmt(l.price * l.qty)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[#f4d9cd]">
              <button
                onClick={() => onChangeQty(l.sku, -1)}
                aria-label={`Decrease ${l.name}`}
                className="h-6 w-6 rounded border border-[#aa5e78] hover:bg-[#aa5e78]"
              >
                -
              </button>
              <span className="w-6 text-center text-white">{l.qty}</span>
              <button
                onClick={() => onChangeQty(l.sku, 1)}
                aria-label={`Increase ${l.name}`}
                className="h-6 w-6 rounded border border-[#aa5e78] hover:bg-[#aa5e78]"
              >
                +
              </button>
              <span className="text-xs">@ Rs {l.price}</span>
              <button
                onClick={() => onRemove(l.sku)}
                className="ml-auto underline hover:text-white"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Billing details */}
      <div className="mt-4 space-y-3 border-t border-[#aa5e78] pt-4">
        <input
          value={customer}
          onChange={(e) => onCustomerChange(e.target.value)}
          placeholder="Customer name (optional)"
          aria-label="Customer name"
          className={fieldClass}
        />

        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={discountValue}
            onChange={(e) => onDiscountValueChange(e.target.value)}
            placeholder="Discount"
            aria-label="Discount"
            className={fieldClass}
          />
          <select
            value={discountType}
            onChange={(e) => onDiscountTypeChange(e.target.value as DiscountType)}
            aria-label="Discount type"
            className={fieldClass + " w-24"}
          >
            <option value="amount">Rs</option>
            <option value="percent">%</option>
          </select>
        </div>

        <div className="flex gap-2" role="group" aria-label="Payment method">
          {(["Cash", "Card", "QR"] as PayMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => onMethodChange(m)}
              aria-pressed={method === m}
              className={`flex-1 rounded-md border py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-[#f4d9cd] ${
                method === m
                  ? "border-[#f4d9cd] bg-[#f4d9cd] text-[#7d0e41]"
                  : "border-[#aa5e78] text-[#f4d9cd] hover:bg-[#aa5e78]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {method === "Cash" && (
          <div>
            <input
              type="number"
              min="0"
              value={tendered}
              onChange={(e) => onTenderedChange(e.target.value)}
              placeholder="Cash received"
              aria-label="Cash received"
              className={fieldClass}
            />
            {cashShort && (
              <p className="mt-1 text-xs text-[#f4d9cd]">
                Cash received is less than the total.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Totals */}
      <dl className="mt-4 space-y-1 text-sm text-[#f4d9cd]">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{fmt(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd>- {fmt(totals.discount)}</dd>
          </div>
        )}
        {VAT_RATE > 0 && (
          <div className="flex justify-between">
            <dt>VAT ({Math.round(VAT_RATE * 100)}%)</dt>
            <dd>{fmt(totals.vat)}</dd>
          </div>
        )}
      </dl>
      <div className="mt-2 flex justify-between border-t border-[#aa5e78] pt-3 text-lg font-bold text-white">
        <span>Total</span>
        <span>{fmt(totals.total)}</span>
      </div>
      {showChange && (
        <div className="mt-1 flex justify-between text-sm text-[#f4d9cd]">
          <span>Change</span>
          <span>{fmt(change)}</span>
        </div>
      )}

      <button
        disabled={cart.length === 0 || cashShort}
        onClick={onComplete}
        className="mt-4 rounded-md bg-[#f4d9cd] py-3 font-semibold text-[#7d0e41] hover:bg-[#d49b9a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d9cd] disabled:opacity-40 disabled:hover:bg-[#f4d9cd]"
      >
        Complete sale and print bill
      </button>
    </aside>
  );
}