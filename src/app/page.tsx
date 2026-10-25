import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const features = [
  ["Fast checkout", "Scan a barcode or tap a product. Bills take seconds, even at rush hour."],
  ["Stock that stays accurate", "Every sale and delivery updates inventory. Low-stock items are flagged before they run out."],
  ["Credit (udhar) tracking", "Record what regular customers owe and what you owe suppliers, in one place."],
  ["Clear daily numbers", "See sales, expenses and profit without opening a spreadsheet."],
  ["Suppliers and purchases", "Log orders, mark them received, and keep a history of what you paid."],
  ["Staff roles", "Give cashiers the counter and keep reports and settings for the owner."],
];

const receipt = [
  ["Basmati rice 5kg", "950"],
  ["Dairy milk 1L x 2", "240"],
  ["Instant noodles x 6", "180"],
];

const focusLight = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]";
const focusDark = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d9cd]";

export default function page() {
  return (
    <div className="min-h-screen bg-[#fcf6f2]">
      <div>
        <Navbar/>
      </div>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#7d0e41] md:text-5xl">
              Run your shop from one screen.
            </h1>
            <p className="mt-5 max-w-md text-lg text-[#6b4455]">
              Smart Mart handles billing, stock, suppliers and expenses for your
              store, so you spend less time counting and more time selling.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className={`rounded-md bg-[#7d0e41] px-6 py-3 font-semibold text-white hover:bg-[#5e0a31] ${focusLight}`}
              >
                Open the dashboard
              </Link>
              <Link
                href="/pos"
                className={`rounded-md border border-[#aa5e78] bg-white px-6 py-3 font-medium text-[#7d0e41] hover:border-[#7d0e41] ${focusLight}`}
              >
                Try the counter
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-[#d49b9a] px-6 py-12 sm:px-12">
            <div className="mx-auto w-full max-w-xs rotate-1 bg-white px-6 py-7 shadow-xl">
              <div className="text-center">
                <div className="font-bold text-[#7d0e41]">Smart Mart</div>
                <div className="text-xs text-[#6b4455]">Receipt S-1043</div>
              </div>
              <ul className="mt-5 space-y-2 border-y border-dashed border-[#d49b9a] py-4 text-sm text-[#7d0e41]">
                {receipt.map(([name, price]) => (
                  <li key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span>Rs {price}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between text-lg font-bold text-[#7d0e41]">
                <span>Total</span>
                <span>Rs 1,370</span>
              </div>
              <div className="mt-1 text-center text-xs text-[#6b4455]">Paid by QR</div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-[#d49b9a] bg-[#f4d9cd]">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="max-w-lg text-2xl font-bold text-[#7d0e41]">
              Everything a neighbourhood store needs, nothing it doesn&rsquo;t
            </h2>
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(([title, text]) => (
                <div key={title} className="border-l-4 border-[#aa5e78] pl-4">
                  <h3 className="font-semibold text-[#7d0e41]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6b4455]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-2xl bg-[#7d0e41] px-8 py-12 text-white">
            <h2 className="text-2xl font-bold">Ready to ring up your first sale?</h2>
            <p className="mt-2 max-w-md text-[#f4d9cd]">
              Sign in and add your products. You can be billing customers in minutes.
            </p>
            <Link
              href="/login"
              className={`mt-6 inline-block rounded-md bg-[#f4d9cd] px-6 py-3 font-semibold text-[#7d0e41] hover:bg-[#d49b9a] ${focusDark}`}
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <footer>
        <Footer/>
      </footer>
    </div>
  );
}