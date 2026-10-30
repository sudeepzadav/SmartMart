"use client";
import type { Bill } from "@/app/pos/types";
import { fmt, STORE, VAT_RATE } from "@/app/pos/lib";

type Props = {
  bill: Bill;
  onNewSale: () => void;
};

// On screen this is a dialog. When printing, the rest of the page is hidden
// (the POS screen has `print:hidden`) and only this bill is printed.
export default function BillReceipt({ bill, onNewSale }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bill"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:static print:block print:bg-white print:p-0"
    >
      <div className="max-h-full w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 text-black print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:p-0">
        <div className="text-center">
          <h2 className="text-lg font-bold">{STORE.name}</h2>
          <p className="text-xs">{STORE.address}</p>
          <p className="text-xs">Tel: {STORE.phone}</p>
          <p className="text-xs">{STORE.vatNo}</p>
        </div>

        <div className="my-3 border-y border-dashed border-black py-2 text-xs">
          <div className="flex justify-between">
            <span>Bill no: {bill.billNo}</span>
            <span>{bill.date}</span>
          </div>
          {bill.customer && <div>Customer: {bill.customer}</div>}
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-1 font-semibold">Item</th>
              <th className="py-1 text-right font-semibold">Qty</th>
              <th className="py-1 text-right font-semibold">Rate</th>
              <th className="py-1 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.lines.map((l) => (
              <tr key={l.sku}>
                <td className="py-1">{l.name}</td>
                <td className="py-1 text-right">{l.qty}</td>
                <td className="py-1 text-right">{l.price}</td>
                <td className="py-1 text-right">{l.price * l.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-3 space-y-1 border-t border-dashed border-black pt-2 text-xs">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{fmt(bill.totals.subtotal)}</dd>
          </div>
          {bill.totals.discount > 0 && (
            <div className="flex justify-between">
              <dt>Discount</dt>
              <dd>- {fmt(bill.totals.discount)}</dd>
            </div>
          )}
          {VAT_RATE > 0 && (
            <div className="flex justify-between">
              <dt>VAT ({Math.round(VAT_RATE * 100)}%)</dt>
              <dd>{fmt(bill.totals.vat)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-black pt-1 text-sm font-bold">
            <dt>Total</dt>
            <dd>{fmt(bill.totals.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Paid by</dt>
            <dd>{bill.method}</dd>
          </div>
          {bill.tendered !== null && (
            <>
              <div className="flex justify-between">
                <dt>Cash received</dt>
                <dd>{fmt(bill.tendered)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Change</dt>
                <dd>{fmt(bill.change)}</dd>
              </div>
            </>
          )}
        </dl>

        <p className="mt-4 text-center text-xs">Thank you for shopping with us.</p>

        <div className="mt-5 flex gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-md border border-[#7d0e41] py-2 font-semibold text-[#7d0e41] hover:bg-[#f4d9cd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
          >
            Print bill
          </button>
          <button
            autoFocus
            onClick={onNewSale}
            className="flex-1 rounded-md bg-[#7d0e41] py-2 font-semibold text-white hover:bg-[#aa5e78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]"
          >
            New sale
          </button>
        </div>
      </div>
    </div>
  );
}