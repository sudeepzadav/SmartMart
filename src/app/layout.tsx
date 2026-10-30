
import type { Metadata } from "next";
import NavbarServer from "@/components/NavbarServer";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Smart Mart",
  description: "Smart Mart POS system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavbarServer />
        {children}
        <Footer/>
      </body>
    </html>
  );
}
