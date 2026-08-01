import type { Metadata } from "next";
import { Shantell_Sans, Comic_Neue } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet";
import { Navbar } from "@/components/navbar";

const shantell = Shantell_Sans({
  variable: "--font-shantell",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const comicNeue = Comic_Neue({
  variable: "--font-comic",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Licen — license-use verification, backed by bonds",
  description:
    "Submit a source and your intended commercial use. Challengers can bond against it. GenLayer fetches the license and decides.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${shantell.variable} ${comicNeue.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <WalletProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
