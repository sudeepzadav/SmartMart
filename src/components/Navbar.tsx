
"use client";

import Link from "next/link";
import Image from "next/image";
import SmartMart from "../../public/smart-mart.svg";
import LogoutButton from "@/components/LogoutButton";

type NavbarProps = {
  isAuthenticated: boolean;
};

export default function Navbar({ isAuthenticated }: NavbarProps) {
  const focusDark =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d9cd]";

  return (
    <header className="bg-[#7d0e41]">
      <div className="mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" aria-label="Smart Mart home">
          <Image
            src={SmartMart}
            alt="Smart Mart"
            width={250}
            height={100}
            priority
          />
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {isAuthenticated ? (
            <LogoutButton
              className={`rounded-md bg-[#f4d9cd] px-4 py-2 font-semibold text-[#7d0e41] hover:bg-[#d49b9a] ${focusDark}`}
            />
          ) : (
            <Link
              href="/login"
              className={`rounded-md bg-[#f4d9cd] px-4 py-2 font-semibold text-[#7d0e41] hover:bg-[#d49b9a] ${focusDark}`}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
