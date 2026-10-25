import PageHeader from "@/components/PageHeader";

const field = "mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm";

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Store details shown on receipts." />
      <div className="max-w-md space-y-4">
        <label className="block text-sm font-medium">Store name
          <input className={field} defaultValue="Smart Mart" />
        </label>
        <label className="block text-sm font-medium">Address
          <input className={field} placeholder="Street, city" />
        </label>
        <label className="block text-sm font-medium">PAN / VAT number
          <input className={field} />
        </label>
        <label className="block text-sm font-medium">VAT rate (%)
          <input className={field} type="number" defaultValue={13} />
        </label>
        <button className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900">
          Save changes
        </button>
      </div>
    </>
  );
}
