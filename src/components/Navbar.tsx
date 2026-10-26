import Link from "next/link"
import Image from "next/image";
import SmartMart from "../../public/smart-mart.svg"


const focusLight = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d0e41]";
const focusDark = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d9cd]";

const Navbar = () => {
  return (
    <div>
      <header className="bg-[#7d0e41]">
        <div className="mx-auto flex items-center justify-between px-6 py-5">
          <Image src={SmartMart} alt="Smart Mart" width={250} height={100} />
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/login"
              className={`rounded-md bg-[#f4d9cd] px-4 py-2 font-semibold text-[#7d0e41] hover:bg-[#d49b9a] ${focusDark}`}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>
    </div>
  )
}

export default Navbar
