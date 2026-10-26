"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Dashboard", "/dashboard"],
  ["Point of sale", "/pos"],
  ["Products", "/products"],
  ["Categories", "/categories"],
  ["Inventory", "/inventory"],
  ["Purchases", "/purchases"],
  ["Suppliers", "/suppliers"],
  ["Sales", "/sales"],
  ["Customers", "/customers"],
  ["Expenses", "/expenses"],
  ["Reports", "/reports"],
  ["Settings", "/settings"],
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-stone-200 bg-[#7d0e41] p-4">
      <div className="mb-6 px-2 text-2xl font-semibold text-amber-500">Smart Mart</div>
      <nav className="flex flex-col gap-1">
        {links.map(([label, href]) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-2 text-sm ${
                active ? "bg-emerald-50 font-medium text-emerald-900" : "text-white hover:bg-stone-100 hover:text-red-700"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
